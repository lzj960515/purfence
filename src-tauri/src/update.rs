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
pub struct UpdateProgress {
    pub downloaded: u64,
    pub total: Option<u64>,
    pub percentage: f64,
}

/// Check for updates from GitHub Releases API
#[tauri::command]
pub async fn check_for_updates() -> Result<Option<UpdateInfo>, String> {
    let client = reqwest::Client::builder()
        .user_agent("Purfence-Updater")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get("https://api.github.com/repos/lzj960515/purfence/releases/latest")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch releases: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API returned status: {}", response.status()));
    }

    let release: GitHubRelease = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse release: {}", e))?;

    let current_version = env!("CARGO_PKG_VERSION").to_string();

    // Compare versions (simple semver comparison)
    let has_update = compare_versions(&release.tag_name, &current_version)?;

    if !has_update {
        return Ok(None);
    }

    // Find the appropriate download URL based on platform
    let download_url = find_download_url(&release.assets);

    Ok(Some(UpdateInfo {
        version: release.tag_name,
        current_version,
        release_notes: Some(release.body),
        download_url,
        pub_date: release.published_at,
    }))
}

#[derive(Debug, Deserialize)]
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

    if latest_parts.is_empty() || current_parts.is_empty() {
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

    for (l, c) in latest_padded.iter().zip(current_padded.iter()) {
        match l.cmp(c) {
            std::cmp::Ordering::Greater => return Ok(true),
            std::cmp::Ordering::Less => return Ok(false),
            std::cmp::Ordering::Equal => continue,
        }
    }

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
