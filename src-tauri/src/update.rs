use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub release_notes: Option<String>,
    pub download_url: Option<String>,
    pub pub_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct UpdateProgress {
    pub downloaded: u64,
    pub total: Option<u64>,
    pub percentage: f64,
}

/// Check for updates from GitHub Releases API
#[tauri::command]
pub async fn check_for_updates() -> Result<Option<UpdateInfo>, String> {
    log::info!("[Update] Starting update check...");

    let client = reqwest::Client::builder()
        .user_agent("Purfence-Updater")
        .build()
        .map_err(|e| {
            log::error!("[Update] Failed to create HTTP client: {}", e);
            format!("Failed to create HTTP client: {}", e)
        })?;

    log::info!("[Update] Fetching latest release from GitHub API...");

    let response = client
        .get("https://api.github.com/repos/lzj960515/purfence/releases/latest")
        .send()
        .await
        .map_err(|e| {
            log::error!("[Update] Failed to fetch releases: {}", e);
            format!("Failed to fetch releases: {}", e)
        })?;

    if !response.status().is_success() {
        log::error!("[Update] GitHub API returned status: {}", response.status());
        return Err(format!("GitHub API returned status: {}", response.status()));
    }

    log::info!("[Update] Parsing release information...");

    let release: GitHubRelease = response
        .json()
        .await
        .map_err(|e| {
            log::error!("[Update] Failed to parse release: {}", e);
            format!("Failed to parse release: {}", e)
        })?;

    let current_version = env!("CARGO_PKG_VERSION").to_string();

    log::info!(
        "[Update] Current version: {}, Latest version: {}",
        current_version,
        release.tag_name
    );

    // Compare versions (simple semver comparison)
    let has_update = compare_versions(&release.tag_name, &current_version)?;

    if !has_update {
        log::info!("[Update] No update available (already on latest version)");
        return Ok(None);
    }

    log::info!("[Update] Update available! Finding download URL...");

    // Find the appropriate download URL based on platform
    let download_url = find_download_url(&release.assets);

    log::info!("[Update] Download URL: {:?}", download_url);

    Ok(Some(UpdateInfo {
        version: release.tag_name,
        current_version,
        release_notes: Some(release.body),
        download_url,
        pub_date: release.published_at,
    }))
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct GitHubRelease {
    tag_name: String,
    name: String,
    body: String,
    published_at: Option<String>,
    assets: Vec<GitHubAsset>,
}

#[derive(Debug, Deserialize)]
struct GitHubAsset {
    name: String,
    browser_download_url: String,
}

/// Compare two version strings (returns true if latest > current)
fn compare_versions(latest: &str, current: &str) -> Result<bool, String> {
    log::debug!("[Update] Comparing versions: latest={}, current={}", latest, current);

    let latest = latest.trim_start_matches('v');
    let current = current.trim_start_matches('v');

    let latest_parts: Vec<u32> = latest
        .split('.')
        .filter_map(|s| s.parse().ok())
        .collect();
    let current_parts: Vec<u32> = current
        .split('.')
        .filter_map(|s| s.parse().ok())
        .collect();

    log::debug!("[Update] Parsed version parts: latest={:?}, current={:?}", latest_parts, current_parts);

    if latest_parts.is_empty() || current_parts.is_empty() {
        log::error!("[Update] Invalid version format: latest_parts={:?}, current_parts={:?}", latest_parts, current_parts);
        return Err("Invalid version format".to_string());
    }

    // Pad with zeros if needed
    let max_len = latest_parts.len().max(current_parts.len());
    let mut latest_padded = latest_parts.clone();
    let mut current_padded = current_parts.clone();

    while latest_padded.len() < max_len {
        latest_padded.push(0);
    }
    while current_padded.len() < max_len {
        current_padded.push(0);
    }

    log::debug!("[Update] Padded versions: latest={:?}, current={:?}", latest_padded, current_padded);

    for (i, (l, c)) in latest_padded.iter().zip(current_padded.iter()).enumerate() {
        log::debug!("[Update] Comparing part {}: {} vs {}", i, l, c);
        match l.cmp(c) {
            std::cmp::Ordering::Greater => {
                log::info!("[Update] Version {} is greater at part {}", latest, i);
                return Ok(true);
            }
            std::cmp::Ordering::Less => {
                log::info!("[Update] Version {} is less at part {}", latest, i);
                return Ok(false);
            }
            std::cmp::Ordering::Equal => continue,
        }
    }

    log::info!("[Update] Versions are equal");
    Ok(false)
}

/// Find the appropriate download URL for the current platform
fn find_download_url(assets: &[GitHubAsset]) -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        #[cfg(target_arch = "aarch64")]
        {
            assets
                .iter()
                .find(|a| a.name.contains("aarch64") && a.name.ends_with(".dmg"))
                .map(|a| a.browser_download_url.clone())
                .or_else(|| {
                    assets
                        .iter()
                        .find(|a| a.name.contains("apple") && a.name.ends_with(".dmg"))
                        .map(|a| a.browser_download_url.clone())
                })
        }
        #[cfg(not(target_arch = "aarch64"))]
        {
            assets
                .iter()
                .find(|a| a.name.contains("x86_64") && a.name.ends_with(".dmg"))
                .map(|a| a.browser_download_url.clone())
                .or_else(|| {
                    assets
                        .iter()
                        .find(|a| a.name.contains("intel") && a.name.ends_with(".dmg"))
                        .map(|a| a.browser_download_url.clone())
                })
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Prefer MSI, fallback to EXE
        assets
            .iter()
            .find(|a| a.name.ends_with(".msi"))
            .map(|a| a.browser_download_url.clone())
            .or_else(|| {
                assets
                    .iter()
                    .find(|a| a.name.ends_with(".exe"))
                    .map(|a| a.browser_download_url.clone())
            })
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        None
    }
}

#[tauri::command]
pub fn get_current_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
