use serde::Serialize;
use std::env;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::time::{Duration, Instant};
use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;

#[derive(Serialize)]
pub struct EnvironmentItemStatus {
    installed: bool,
    detail: String,
}

#[derive(Serialize)]
pub struct DesktopEnvironmentStatus {
    platform: String,
    node: EnvironmentItemStatus,
    claude_code: EnvironmentItemStatus,
    git: EnvironmentItemStatus,
    agents: EnvironmentItemStatus,
}

#[derive(Serialize)]
pub struct EnvironmentActionResult {
    success: bool,
    message: String,
    updated_count: Option<u32>,
}

#[derive(Clone, Serialize)]
pub struct DesktopSkillItem {
    name: String,
    description: String,
    source: String,
    package: Option<String>,
}

#[derive(Serialize)]
pub struct DesktopSkillsCatalog {
    installed: Vec<DesktopSkillItem>,
    recommended: Vec<DesktopSkillItem>,
}

#[derive(Clone, Serialize)]
struct InstallLogPayload {
    stream: String,
    message: String,
}

fn check_command_installed(command: &str, args: &[&str]) -> bool {
    match Command::new(command).args(args).output() {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

fn check_command_path_installed(command_path: &Path, args: &[&str]) -> bool {
    match Command::new(command_path).args(args).output() {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

fn check_with_nvm(script: &str) -> bool {
    match Command::new(preferred_unix_shell())
        .args(["-lc", script])
        .output()
    {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

fn preferred_unix_shell() -> &'static str {
    if cfg!(target_os = "macos") {
        "zsh"
    } else {
        "bash"
    }
}

fn get_node_version() -> Option<String> {
    let output = Command::new("node").args(["--version"]).output().ok()?;
    if !output.status.success() {
        return None;
    }
    Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn get_node_version_with_nvm() -> Option<String> {
    let output = Command::new(preferred_unix_shell())
        .args([
            "-lc",
            "export NVM_DIR=\"${NVM_DIR:-$HOME/.nvm}\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; node --version",
        ])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn is_node_22_ready() -> bool {
    let system_node_22 = get_node_version()
        .map(|v| v.starts_with("v22."))
        .unwrap_or(false)
        && check_command_installed("npm", &["--version"]);
    if system_node_22 {
        return true;
    }

    let nvm_node_22 = get_node_version_with_nvm()
        .map(|v| v.starts_with("v22."))
        .unwrap_or(false)
        && check_with_nvm(
            "export NVM_DIR=\"${NVM_DIR:-$HOME/.nvm}\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; npm --version >/dev/null 2>&1",
        );
    nvm_node_22
}

fn claude_candidate_paths() -> Vec<PathBuf> {
    let mut candidates: Vec<PathBuf> = vec![];

    if let Some(home) = dirs::home_dir() {
        if cfg!(target_os = "windows") {
            candidates.push(
                home.join("AppData")
                    .join("Roaming")
                    .join("npm")
                    .join("claude.cmd"),
            );
            candidates.push(
                home.join("AppData")
                    .join("Roaming")
                    .join("npm")
                    .join("claude.exe"),
            );
            candidates.push(home.join(".local").join("bin").join("claude.cmd"));
            candidates.push(home.join(".local").join("bin").join("claude.exe"));
            candidates.push(home.join("scoop").join("shims").join("claude.cmd"));
        } else {
            candidates.push(home.join(".local").join("bin").join("claude"));
        }
    }

    if !cfg!(target_os = "windows") {
        candidates.push(PathBuf::from("/opt/homebrew/bin/claude"));
        candidates.push(PathBuf::from("/usr/local/bin/claude"));
    }

    candidates
}

fn is_claude_installed() -> bool {
    let command_candidates = if cfg!(target_os = "windows") {
        vec!["claude", "claude.cmd", "claude.exe"]
    } else {
        vec!["claude"]
    };

    for command in command_candidates {
        if check_command_installed(command, &["--version"]) {
            return true;
        }
    }

    for candidate in claude_candidate_paths() {
        if candidate.exists() && check_command_path_installed(&candidate, &["--version"]) {
            return true;
        }
    }

    if check_with_nvm(
        "export NVM_DIR=\"${NVM_DIR:-$HOME/.nvm}\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; claude --version >/dev/null 2>&1",
    ) {
        return true;
    }

    false
}

fn is_node_installed() -> bool {
    if check_command_installed("node", &["--version"])
        && check_command_installed("npm", &["--version"])
    {
        return true;
    }

    check_with_nvm(
        "export NVM_DIR=\"${NVM_DIR:-$HOME/.nvm}\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; node --version >/dev/null 2>&1 && npm --version >/dev/null 2>&1",
    )
}

fn resolve_brew_command() -> Option<String> {
    if check_command_installed("brew", &["--version"]) {
        return Some("brew".to_string());
    }

    for candidate in ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"] {
        let path = PathBuf::from(candidate);
        if path.exists() && check_command_path_installed(&path, &["--version"]) {
            return Some(candidate.to_string());
        }
    }

    None
}

fn list_markdown_files(dir: &Path) -> Result<Vec<PathBuf>, String> {
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut files = vec![];
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.ends_with(".md") {
                    files.push(path);
                }
            }
        }
    }

    files.sort();
    Ok(files)
}

fn claude_agents_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Home directory not found")?;
    Ok(home.join(".claude").join("agents").join("purfence"))
}

fn claude_skills_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Home directory not found")?;
    Ok(home.join(".claude").join("skills"))
}

fn list_skill_dirs(dir: &Path) -> Result<Vec<PathBuf>, String> {
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut result = vec![];
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        if path.join("SKILL.md").exists() {
            result.push(path);
        }
    }

    result.sort();
    Ok(result)
}

fn parse_skill_metadata(skill_dir: &Path) -> DesktopSkillItem {
    let fallback_name = skill_dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    let mut name = fallback_name.clone();
    let mut description = String::new();

    let skill_file = skill_dir.join("SKILL.md");
    if let Ok(content) = fs::read_to_string(skill_file) {
        let mut in_frontmatter = false;
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed == "---" {
                if in_frontmatter {
                    break;
                }
                in_frontmatter = true;
                continue;
            }
            if !in_frontmatter {
                continue;
            }

            if let Some(rest) = trimmed.strip_prefix("name:") {
                let value = rest.trim().trim_matches('"').trim_matches('\'');
                if !value.is_empty() {
                    name = value.to_string();
                }
            }
            if let Some(rest) = trimmed.strip_prefix("description:") {
                let value = rest.trim().trim_matches('"').trim_matches('\'');
                if !value.is_empty() {
                    description = value.to_string();
                }
            }
        }
    }

    DesktopSkillItem {
        name,
        description,
        source: "installed".to_string(),
        package: None,
    }
}

fn resolve_builtin_skills_dir(app: &AppHandle) -> Option<PathBuf> {
    let mut candidates: Vec<PathBuf> = vec![];

    if let Ok(dir) = env::var("PURFENCE_BUILTIN_SKILLS_DIR") {
        candidates.push(PathBuf::from(dir));
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        candidates.push(resource_dir.join("binaries").join("skills"));
    }

    if let Ok(current) = env::current_dir() {
        candidates.push(current.join("src-tauri").join("binaries").join("skills"));
        candidates.push(current.join("backend").join("src").join("purfence").join("skills"));
    }

    candidates
        .into_iter()
        .find(|dir| list_skill_dirs(dir).map(|it| !it.is_empty()).unwrap_or(false))
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| e.to_string())?;

    let entries = fs::read_dir(src).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            if let Some(parent) = dst_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            fs::copy(&src_path, &dst_path).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

fn strip_ansi(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let bytes = input.as_bytes();
    let mut i = 0usize;
    while i < bytes.len() {
        if bytes[i] == 0x1b {
            i += 1;
            if i < bytes.len() && bytes[i] == b'[' {
                i += 1;
                while i < bytes.len() {
                    let b = bytes[i];
                    i += 1;
                    if (b as char).is_ascii_alphabetic() {
                        break;
                    }
                }
            }
            continue;
        }

        out.push(bytes[i] as char);
        i += 1;
    }

    out
}

fn parse_remote_skill_refs(stdout: &str) -> Vec<DesktopSkillItem> {
    let mut result: Vec<DesktopSkillItem> = vec![];
    for line in strip_ansi(stdout).lines() {
        let mut found: Option<&str> = None;
        for token in line.split_whitespace() {
            if token.contains('/') && token.contains('@') {
                if token == "owner/repo@skill" {
                    continue;
                }
                found = Some(token);
                break;
            }
        }

        let Some(package) = found else {
            continue;
        };

        let skill_name = package
            .split('@')
            .nth(1)
            .unwrap_or(package)
            .trim()
            .to_string();

        if result.iter().any(|it| it.name == skill_name) {
            continue;
        }

        result.push(DesktopSkillItem {
            name: skill_name,
            description: package.to_string(),
            source: "online".to_string(),
            package: Some(package.to_string()),
        });
    }

    result
}

fn run_skills_find(query: &str) -> Result<Vec<DesktopSkillItem>, String> {
    let output = Command::new("npx")
        .args(["skills", "find", query])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(stderr);
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(parse_remote_skill_refs(&stdout))
}

fn fixed_online_recommended_skills() -> Vec<DesktopSkillItem> {
    vec![
        DesktopSkillItem {
            name: "algorithmic-art".to_string(),
            description: "Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "browser-use".to_string(),
            description: "Automates browser interactions for web testing, form filling, screenshots, and extraction".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "canvas-design".to_string(),
            description: "Create beautiful visual art in .png and .pdf documents using design philosophy".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "configuring-tauri-permissions".to_string(),
            description: "Guides through configuring Tauri permissions and capability integration".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "doc-coauthoring".to_string(),
            description: "Structured workflow for co-authoring documentation and technical specs".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "docx".to_string(),
            description: "Professional .docx document creation, editing, tracked changes, and comments".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "find-skills".to_string(),
            description: "Discover and install agent skills for specific tasks".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "frontend-design".to_string(),
            description: "Create production-grade frontend interfaces with high design quality".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "integrating-tauri-js-frontends".to_string(),
            description: "Configure JavaScript frontends for Tauri v2 desktop apps".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "mcp-builder".to_string(),
            description: "Guide for building MCP servers that integrate external services".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "nanobanana".to_string(),
            description: "Generate and edit images using Google Gemini 3 Pro Image".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "nestjs-best-practices".to_string(),
            description: "NestJS architecture and best practices for production apps".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "pdf".to_string(),
            description: "Comprehensive PDF extraction, editing, merging, splitting, and form handling".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "pptx".to_string(),
            description: "Presentation creation, editing, layout, and speaker notes tooling".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "product-artifacts".to_string(),
            description: "产品工件目录结构和 PRD/IA/验收标准模板".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "skill-creator".to_string(),
            description: "Guide for creating and improving reusable skills".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "slack-gif-creator".to_string(),
            description: "Knowledge and utilities for creating Slack-friendly animated GIFs".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "tauri-common-issues".to_string(),
            description: "Tauri v2 common issues and solutions".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "tauri-event-system".to_string(),
            description: "Advanced Tauri event patterns for bidirectional communication".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "tauri-v2".to_string(),
            description: "Tauri v2 cross-platform app development with Rust backend".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "theme-factory".to_string(),
            description: "Apply themed visual systems to docs, slides, reports, and HTML artifacts".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "typeorm".to_string(),
            description: "Guidelines for developing with TypeORM".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "web-artifacts-builder".to_string(),
            description: "Build elaborate multi-component HTML artifacts with modern frontend tooling".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "webapp-testing".to_string(),
            description: "Playwright-based toolkit for local web app interaction and testing".to_string(),
            source: "online".to_string(),
            package: None,
        },
        DesktopSkillItem {
            name: "xlsx".to_string(),
            description: "Spreadsheet creation, editing, formulas, analysis, and visualization".to_string(),
            source: "online".to_string(),
            package: None,
        },
    ]
}

fn resolve_online_package_for_skill(skill_name: &str) -> Result<String, String> {
    let mut candidates = run_skills_find(skill_name)?;
    if candidates.is_empty() {
        return Err(format!("未找到可安装的在线 skill: {}", skill_name));
    }

    if let Some(exact) = candidates
        .iter()
        .find(|item| item.name.eq_ignore_ascii_case(skill_name))
        .and_then(|item| item.package.clone())
    {
        return Ok(exact);
    }

    candidates
        .remove(0)
        .package
        .ok_or_else(|| format!("未找到可安装的在线 skill: {}", skill_name))
}

fn resolve_builtin_agents_dir(app: &AppHandle) -> Option<PathBuf> {
    let mut candidates: Vec<PathBuf> = vec![];

    if let Ok(dir) = env::var("PURFENCE_BUILTIN_AGENTS_DIR") {
        candidates.push(PathBuf::from(dir));
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        candidates.push(resource_dir.join("binaries").join("agents"));
    }

    if let Ok(current) = env::current_dir() {
        candidates.push(
            current
                .join("backend")
                .join("src")
                .join("purfence")
                .join("agents"),
        );
        candidates.push(current.join("src").join("purfence").join("agents"));
    }

    candidates.into_iter().find(|dir| {
        if let Ok(files) = list_markdown_files(dir) {
            !files.is_empty()
        } else {
            false
        }
    })
}

fn are_agents_installed(app: &AppHandle) -> bool {
    let source_dir = match resolve_builtin_agents_dir(app) {
        Some(path) => path,
        None => return false,
    };
    let target_dir = match claude_agents_dir() {
        Ok(path) => path,
        Err(_) => return false,
    };

    let source = match list_markdown_files(&source_dir) {
        Ok(files) => files,
        Err(_) => return false,
    };
    if source.is_empty() {
        return false;
    }

    let target = match list_markdown_files(&target_dir) {
        Ok(files) => files,
        Err(_) => return false,
    };

    let target_names: std::collections::HashSet<String> = target
        .iter()
        .filter_map(|path| {
            path.file_name()
                .and_then(|n| n.to_str())
                .map(|v| v.to_string())
        })
        .collect();

    source.iter().all(|path| {
        path.file_name()
            .and_then(|n| n.to_str())
            .map(|name| target_names.contains(name))
            .unwrap_or(false)
    })
}

fn sync_builtin_agents(app: &AppHandle) -> Result<u32, String> {
    let source_dir =
        resolve_builtin_agents_dir(app).ok_or("未找到内置 agents 资源，请先完成应用安装")?;
    let target_dir = claude_agents_dir()?;

    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    let files = list_markdown_files(&source_dir)?;
    let mut count = 0u32;

    for source in files {
        let file_name = source.file_name().ok_or("Invalid agent file name")?;
        let target = target_dir.join(file_name);
        fs::copy(source, target).map_err(|e| e.to_string())?;
        count += 1;
    }

    Ok(count)
}

pub fn auto_sync_builtin_agents_on_startup(app: &AppHandle) {
    if !is_claude_installed() {
        log::info!("Skip builtin agents sync: Claude Code not installed");
        return;
    }

    match sync_builtin_agents(app) {
        Ok(count) => {
            log::info!(
                "Synced builtin agents on startup (overwritten {} files)",
                count
            );
        }
        Err(err) => {
            log::warn!("Failed to sync builtin agents on startup: {}", err);
        }
    }
}

fn emit_install_log(app: &AppHandle, stream: &str, message: &str) {
    let payload = InstallLogPayload {
        stream: stream.to_string(),
        message: message.to_string(),
    };
    let _ = app.emit("claude-install-log", payload);
}

fn run_install_step(
    app: &AppHandle,
    step_name: &str,
    program: &str,
    args: &[&str],
    timeout_secs: u64,
) -> Result<(), String> {
    emit_install_log(app, "meta", &format!("步骤开始: {}", step_name));
    let status = run_installer_with_timeout(app, program, args, timeout_secs)?;
    if status.success() {
        emit_install_log(app, "meta", &format!("步骤完成: {}", step_name));
        Ok(())
    } else {
        let err = format!("{} 执行失败，退出码: {:?}", step_name, status.code());
        emit_install_log(app, "meta", &err);
        Err(err)
    }
}

fn install_missing_toolchain(
    app: &AppHandle,
    node_missing: bool,
    git_missing: bool,
) -> Result<(), String> {
    if !node_missing && !git_missing {
        return Ok(());
    }

    if cfg!(target_os = "windows") {
        if !check_command_installed("winget", &["--version"]) {
            let err =
                "未检测到 winget，无法自动安装 Node.js/Git，请先安装 App Installer 或手动安装"
                    .to_string();
            emit_install_log(app, "meta", &err);
            return Err(err);
        }

        if node_missing {
            run_install_step(
                app,
                "安装 Node.js LTS",
                "winget",
                &[
                    "install",
                    "--id",
                    "OpenJS.NodeJS.LTS",
                    "--source",
                    "winget",
                    "--accept-package-agreements",
                    "--accept-source-agreements",
                    "--silent",
                ],
                600,
            )?;
        }

        if git_missing {
            run_install_step(
                app,
                "安装 Git for Windows",
                "winget",
                &[
                    "install",
                    "--id",
                    "Git.Git",
                    "--source",
                    "winget",
                    "--accept-package-agreements",
                    "--accept-source-agreements",
                    "--silent",
                ],
                600,
            )?;
        }

        return Ok(());
    }

    if node_missing {
        run_install_step(
            app,
            "安装 nvm",
            "bash",
            &[
                "-lc",
                "set -e; if command -v curl >/dev/null 2>&1; then curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash; elif command -v wget >/dev/null 2>&1; then wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash; else echo '需要 curl 或 wget 来安装 nvm'; exit 1; fi",
            ],
            900,
        )?;
        run_install_step(
            app,
            "使用 nvm 安装 Node.js 22",
            "bash",
            &[
                "-lc",
                "export NVM_DIR=\"${NVM_DIR:-$HOME/.nvm}\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; nvm install 22 && nvm alias default 22",
            ],
            900,
        )?;
    }

    if git_missing {
        emit_install_log(
            app,
            "meta",
            "检测到 Git 缺失：先尝试安装 Xcode Command Line Tools",
        );
        let _ = run_install_step(
            app,
            "安装 Xcode Command Line Tools",
            "xcode-select",
            &["--install"],
            60,
        );
        if check_command_installed("git", &["--version"]) {
            return Ok(());
        }

        let mut brew_cmd = resolve_brew_command();
        if brew_cmd.is_none() && cfg!(target_os = "macos") {
            emit_install_log(app, "meta", "未检测到 Homebrew，开始自动安装（用于安装 Git）");
            run_install_step(
                app,
                "安装 Homebrew",
                "bash",
                &[
                    "-lc",
                    "NONINTERACTIVE=1 CI=1 /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"",
                ],
                900,
            )?;
            brew_cmd = resolve_brew_command();
        }

        let Some(brew_cmd) = brew_cmd else {
            let err = "Git 仍未安装，且 Homebrew 不可用。请先完成 Xcode Command Line Tools 或手动安装 Git。"
                .to_string();
            emit_install_log(app, "meta", &err);
            return Err(err);
        };

        run_install_step(app, "安装 Git", &brew_cmd, &["install", "git"], 600)?;
    }

    Ok(())
}

fn install_claude_with_npm(app: &AppHandle) -> Result<(), String> {
    if is_claude_installed() {
        emit_install_log(app, "meta", "检测到 Claude Code 已安装，跳过安装步骤");
        return Ok(());
    }

    if cfg!(target_os = "windows") {
        let default_install = run_install_step(
            app,
            "安装 Claude Code（默认 npm 源）",
            "powershell",
            &[
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                "npm install -g @anthropic-ai/claude-code --no-audit --progress=false",
            ],
            600,
        );

        match default_install {
            Ok(_) => return Ok(()),
            Err(err) => emit_install_log(app, "meta", &format!("默认源安装失败: {}", err)),
        }

        emit_install_log(
            app,
            "meta",
            "默认源安装失败，尝试中国大陆镜像源与 npm cache",
        );
        let mirror_install = run_install_step(
            app,
            "安装 Claude Code（npmmirror + prefer-offline）",
            "powershell",
            &[
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                "$env:NPM_CONFIG_REGISTRY='https://registry.npmmirror.com'; npm install -g @anthropic-ai/claude-code --prefer-offline --no-audit --progress=false",
            ],
            600,
        );

        match mirror_install {
            Ok(_) => return Ok(()),
            Err(err) => emit_install_log(app, "meta", &format!("镜像源安装失败: {}", err)),
        }

        return Err(
            "Claude Code 安装失败：已尝试默认源与 npmmirror。请在基础配置中设置代理后重试。"
                .to_string(),
        );
    }

    let shell = preferred_unix_shell();
    let default_install = run_install_step(
        app,
        "安装 Claude Code（默认 npm 源）",
        shell,
        &[
            "-lc",
            "export NVM_DIR=\"${NVM_DIR:-$HOME/.nvm}\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; command -v npm >/dev/null 2>&1 || { echo 'npm not found after loading nvm' >&2; exit 127; }; npm install -g @anthropic-ai/claude-code --no-audit --progress=false",
        ],
        600,
    );

    match default_install {
        Ok(_) => {
            finalize_unix_claude_install(app, shell)?;
            return Ok(());
        }
        Err(err) => emit_install_log(app, "meta", &format!("默认源安装失败: {}", err)),
    }

    emit_install_log(
        app,
        "meta",
        "默认源安装失败，尝试中国大陆镜像源与 npm cache",
    );
    let mirror_install = run_install_step(
        app,
        "安装 Claude Code（npmmirror + prefer-offline）",
        shell,
        &[
            "-lc",
            "export NVM_DIR=\"${NVM_DIR:-$HOME/.nvm}\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; command -v npm >/dev/null 2>&1 || { echo 'npm not found after loading nvm' >&2; exit 127; }; NPM_CONFIG_REGISTRY=https://registry.npmmirror.com npm install -g @anthropic-ai/claude-code --prefer-offline --no-audit --progress=false",
        ],
        600,
    );

    match mirror_install {
        Ok(_) => {
            finalize_unix_claude_install(app, shell)?;
            return Ok(());
        }
        Err(err) => emit_install_log(app, "meta", &format!("镜像源安装失败: {}", err)),
    }

    Err(
        "Claude Code 安装失败：已尝试默认源与 npmmirror。请在基础配置中设置代理后重试。"
            .to_string(),
    )
}

fn finalize_unix_claude_install(app: &AppHandle, shell: &str) -> Result<(), String> {
    run_install_step(
        app,
        "初始化 Claude 本地二进制",
        shell,
        &[
            "-lc",
            "export NVM_DIR=\"${NVM_DIR:-$HOME/.nvm}\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; command -v claude >/dev/null 2>&1 || { echo 'claude command not found after npm install' >&2; exit 127; }; claude install",
        ],
        600,
    )?;

    Ok(())
}

fn run_claude_install(app: &AppHandle) -> Result<(), String> {
    emit_install_log(app, "meta", "阶段 1/2：安装基础依赖（Node.js / Git）");
    let node_missing = !is_node_installed();
    let git_missing = !check_command_installed("git", &["--version"]);

    if !node_missing {
        if is_node_22_ready() {
            emit_install_log(app, "meta", "检测到 Node.js 22 已安装，跳过 Node 安装");
        } else {
            emit_install_log(
                app,
                "meta",
                "检测到已有 Node.js 环境（非 22），跳过 Node 安装",
            );
        }
    }

    install_missing_toolchain(app, node_missing, git_missing)?;

    if !is_node_installed() {
        let err = "Node.js 安装后检测失败，请重启终端后重试。".to_string();
        emit_install_log(app, "meta", &err);
        return Err(err);
    }
    if !check_command_installed("git", &["--version"]) {
        let err = "Git 安装后检测失败，请重启终端后重试。".to_string();
        emit_install_log(app, "meta", &err);
        return Err(err);
    }

    emit_install_log(app, "meta", "阶段 1/2 完成：Node.js / Git 已就绪");
    emit_install_log(app, "meta", "阶段 2/2：安装 Claude Code");
    install_claude_with_npm(app)
}

fn run_installer_with_timeout(
    app: &AppHandle,
    program: &str,
    args: &[&str],
    timeout_secs: u64,
) -> Result<std::process::ExitStatus, String> {
    emit_install_log(
        app,
        "meta",
        &format!("运行安装命令: {} {}", program, args.join(" ")),
    );

    let mut child = Command::new(program)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            let err = format!("启动安装命令失败: {}", e);
            emit_install_log(app, "meta", &err);
            err
        })?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let (tx, rx) = mpsc::channel::<(String, String)>();

    if let Some(stdout_handle) = stdout {
        let tx_out = tx.clone();
        std::thread::spawn(move || {
            let reader = BufReader::new(stdout_handle);
            for line in reader.lines().map_while(Result::ok) {
                let _ = tx_out.send(("stdout".to_string(), line));
            }
        });
    }

    if let Some(stderr_handle) = stderr {
        let tx_err = tx.clone();
        std::thread::spawn(move || {
            let reader = BufReader::new(stderr_handle);
            for line in reader.lines().map_while(Result::ok) {
                let _ = tx_err.send(("stderr".to_string(), line));
            }
        });
    }

    drop(tx);

    let start = Instant::now();
    let timeout = Duration::from_secs(timeout_secs);

    loop {
        while let Ok((stream, line)) = rx.try_recv() {
            emit_install_log(app, &stream, &line);
        }

        if let Some(status) = child.try_wait().map_err(|e| e.to_string())? {
            while let Ok((stream, line)) = rx.try_recv() {
                emit_install_log(app, &stream, &line);
            }
            return Ok(status);
        }

        if start.elapsed() >= timeout {
            let _ = child.kill();
            let _ = child.wait();
            emit_install_log(app, "meta", &format!("安装超时（{}秒）", timeout_secs));
            return Err(format!("installer timed out after {}s", timeout_secs));
        }

        std::thread::sleep(Duration::from_millis(250));
    }
}

#[tauri::command]
pub async fn desktop_environment_status(
    app: AppHandle,
) -> Result<DesktopEnvironmentStatus, String> {
    let node_installed = is_node_installed();
    let claude_installed = is_claude_installed();
    let git_installed = check_command_installed("git", &["--version"]);
    let agents_installed = are_agents_installed(&app);

    Ok(DesktopEnvironmentStatus {
        platform: env::consts::OS.to_string(),
        node: EnvironmentItemStatus {
            installed: node_installed,
            detail: if node_installed {
                "已安装".to_string()
            } else {
                "未安装".to_string()
            },
        },
        claude_code: EnvironmentItemStatus {
            installed: claude_installed,
            detail: if claude_installed {
                "已安装".to_string()
            } else {
                if node_installed && git_installed {
                    "未安装".to_string()
                } else {
                    "依赖 Node.js 与 Git".to_string()
                }
            },
        },
        git: EnvironmentItemStatus {
            installed: git_installed,
            detail: if git_installed {
                "已安装".to_string()
            } else {
                "未安装".to_string()
            },
        },
        agents: EnvironmentItemStatus {
            installed: agents_installed,
            detail: if claude_installed {
                if agents_installed {
                    "已安装".to_string()
                } else {
                    "未安装".to_string()
                }
            } else {
                "依赖 Claude Code 安装".to_string()
            },
        },
    })
}

#[tauri::command]
pub async fn install_claude_code_desktop(
    app: AppHandle,
) -> Result<EnvironmentActionResult, String> {
    if is_node_installed()
        && check_command_installed("git", &["--version"])
        && is_claude_installed()
    {
        emit_install_log(
            &app,
            "meta",
            "检测到 Node.js、Git 与 Claude Code 均已安装，跳过安装步骤",
        );
        return Ok(EnvironmentActionResult {
            success: true,
            message: "Node.js、Git、Claude Code 已安装".to_string(),
            updated_count: None,
        });
    }

    run_claude_install(&app)?;

    let node_installed = is_node_installed();
    let git_installed = check_command_installed("git", &["--version"]);
    let claude_installed = is_claude_installed();
    let installed = node_installed && git_installed && claude_installed;
    Ok(EnvironmentActionResult {
        success: installed,
        message: if installed {
            "Node.js、Git、Claude Code 安装完成".to_string()
        } else {
            "安装后检测失败，请重试（需同时安装 Node.js、Git、Claude Code）".to_string()
        },
        updated_count: None,
    })
}

#[tauri::command]
pub async fn install_builtin_agents_desktop(
    app: AppHandle,
) -> Result<EnvironmentActionResult, String> {
    let count = sync_builtin_agents(&app)?;

    Ok(EnvironmentActionResult {
        success: true,
        message: format!("已同步 {} 个内置 agents", count),
        updated_count: Some(count),
    })
}

#[tauri::command]
pub async fn desktop_skills_catalog(
    app: AppHandle,
) -> Result<DesktopSkillsCatalog, String> {
    let installed_dir = claude_skills_dir()?;
    let installed_dirs = list_skill_dirs(&installed_dir)?;
    let mut installed: Vec<DesktopSkillItem> = installed_dirs
        .iter()
        .map(|dir| parse_skill_metadata(dir))
        .collect();
    installed.sort_by(|a, b| a.name.cmp(&b.name));

    let installed_names: std::collections::HashSet<String> = installed
        .iter()
        .map(|item| item.name.to_ascii_lowercase())
        .collect();

    let mut recommended: Vec<DesktopSkillItem> = vec![];

    if let Some(source_dir) = resolve_builtin_skills_dir(&app) {
        let builtin_dirs = list_skill_dirs(&source_dir)?;
        for dir in builtin_dirs {
            let name = dir
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or_default()
                .to_string();
            if !name.starts_with("apple-") {
                continue;
            }
            if installed_names.contains(&name.to_ascii_lowercase()) {
                continue;
            }

            let mut item = parse_skill_metadata(&dir);
            item.source = "builtin".to_string();
            item.package = None;
            recommended.push(item);
        }
    }

    for item in fixed_online_recommended_skills() {
        if installed_names.contains(&item.name.to_ascii_lowercase()) {
            continue;
        }
        if recommended
            .iter()
            .any(|existing| existing.name.eq_ignore_ascii_case(&item.name))
        {
            continue;
        }
        recommended.push(item);
    }

    recommended.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(DesktopSkillsCatalog {
        installed,
        recommended,
    })
}

#[tauri::command]
pub async fn install_desktop_skill(
    app: AppHandle,
    name: String,
    source: String,
    package: Option<String>,
) -> Result<EnvironmentActionResult, String> {
    let target_root = claude_skills_dir()?;
    fs::create_dir_all(&target_root).map_err(|e| e.to_string())?;

    if source == "builtin" {
        let source_root = resolve_builtin_skills_dir(&app)
            .ok_or("未找到内置 skills 目录，请先完成应用安装")?;
        let source_dir = source_root.join(&name);
        if !source_dir.exists() {
            return Err(format!("未找到内置 skill: {}", name));
        }

        let target_dir = target_root.join(&name);
        if target_dir.exists() {
            fs::remove_dir_all(&target_dir).map_err(|e| e.to_string())?;
        }
        copy_dir_recursive(&source_dir, &target_dir)?;

        return Ok(EnvironmentActionResult {
            success: true,
            message: format!("已安装内置 skill: {}", name),
            updated_count: Some(1),
        });
    }

    if source == "online" {
        let pkg = match package {
            Some(value) if !value.trim().is_empty() => value,
            _ => resolve_online_package_for_skill(&name)?,
        };
        let output = Command::new("npx")
            .args([
                "skills",
                "add",
                &pkg,
                "-g",
                "-y",
                "--agent",
                "claude-code",
            ])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            return Ok(EnvironmentActionResult {
                success: false,
                message: if stderr.trim().is_empty() {
                    "安装失败".to_string()
                } else {
                    stderr
                },
                updated_count: None,
            });
        }

        let installed = target_root.join(&name).exists();
        if !installed {
            return Ok(EnvironmentActionResult {
                success: false,
                message: format!("安装命令执行成功，但未检测到 ~/.claude/skills/{}", name),
                updated_count: None,
            });
        }

        return Ok(EnvironmentActionResult {
            success: true,
            message: format!("已安装在线 skill: {}", name),
            updated_count: Some(1),
        });
    }

    Err("不支持的 skill 来源".to_string())
}

#[tauri::command]
pub async fn git_install_prompt_desktop() -> Result<String, String> {
    let (platform_name, install_command) = if cfg!(target_os = "windows") {
        ("windows", "winget install Git.Git --source winget")
    } else {
        ("macos", "brew install git")
    };

    Ok([
        "请帮我安装 Git，并严格按以下步骤执行：",
        &format!("1. 先识别当前平台是 {}", platform_name),
        "2. 先检测是否已安装：git --version",
        "3. 如果未安装，再执行安装命令（不要改命令）：",
        install_command,
        "4. 安装后再次执行：git --version",
        "5. 返回最终结果：成功/失败、版本号、失败原因（如有）",
        "6. 不要执行任何与 Git 安装无关的命令",
    ]
    .join("\n"))
}
