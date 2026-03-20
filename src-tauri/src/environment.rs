use serde::Serialize;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::AppHandle;
use tauri::Manager;


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
    command: Option<String>,
}

#[derive(Serialize)]
pub struct DesktopSkillsCatalog {
    installed: Vec<DesktopSkillItem>,
    recommended: Vec<DesktopSkillItem>,
}



fn agents_skills_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Home directory not found")?;
    Ok(home.join(".agents").join("skills"))
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
        command: None,
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
        candidates.push(
            current
                .join("backend")
                .join("src")
                .join("purfence")
                .join("skills"),
        );
    }

    candidates.into_iter().find(|dir| {
        list_skill_dirs(dir)
            .map(|it| !it.is_empty())
            .unwrap_or(false)
    })
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

        // 生成完整安装命令
        let command = format!(
            "npx skills add https://github.com/{} --skill {} -g -y --agent claude-code",
            package.split('@').next().unwrap_or(package),
            skill_name
        );

        result.push(DesktopSkillItem {
            name: skill_name,
            description: package.to_string(),
            source: "online".to_string(),
            command: Some(command),
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
    // 官方 Anthropic 技能仓库: https://github.com/anthropics/skills
    // 安装命令格式: npx skills add https://github.com/<owner/repo> --skill <skill-name> -g -y --agent claude-code
    vec![
        // ===== 官方 Anthropic 技能 =====
        DesktopSkillItem {
            name: "algorithmic-art".to_string(),
            description: "Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill algorithmic-art -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "browser-use".to_string(),
            description: "Automates browser interactions for web testing, form filling, screenshots, and extraction".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/browser-use/browser-use --skill browser-use -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "canvas-design".to_string(),
            description: "Create beautiful visual art in .png and .pdf documents using design philosophy".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill canvas-design -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "doc-coauthoring".to_string(),
            description: "Structured workflow for co-authoring documentation and technical specs".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill doc-coauthoring -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "docx".to_string(),
            description: "Professional .docx document creation, editing, tracked changes, and comments".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill docx -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "find-skills".to_string(),
            description: "Discover and install agent skills for specific tasks".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/vercel-labs/skills --skill find-skills -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "frontend-design".to_string(),
            description: "Create production-grade frontend interfaces with high design quality".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill frontend-design -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "mcp-builder".to_string(),
            description: "Guide for building MCP servers that integrate external services".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill mcp-builder -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "nestjs-best-practices".to_string(),
            description: "NestJS architecture and best practices for production apps".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill nestjs-best-practices -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "pdf".to_string(),
            description: "Comprehensive PDF extraction, editing, merging, splitting, and form handling".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill pdf -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "playwright-cli".to_string(),
            description: "Automates browser interactions for web testing, screenshots, and data extraction".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/microsoft/playwright-cli --skill playwright-cli -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "pptx".to_string(),
            description: "Presentation creation, editing, layout, and speaker notes tooling".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill pptx -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "skill-creator".to_string(),
            description: "Guide for creating and improving reusable skills".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill skill-creator -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "slack-gif-creator".to_string(),
            description: "Knowledge and utilities for creating Slack-friendly animated GIFs".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill slack-gif-creator -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "theme-factory".to_string(),
            description: "Apply themed visual systems to docs, slides, reports, and HTML artifacts".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill theme-factory -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "typeorm".to_string(),
            description: "Guidelines for developing with TypeORM".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/mindrally/skills --skill typeorm -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "web-artifacts-builder".to_string(),
            description: "Build elaborate multi-component HTML artifacts with modern frontend tooling".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill web-artifacts-builder -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "webapp-testing".to_string(),
            description: "Playwright-based toolkit for local web app interaction and testing".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill webapp-testing -g -y --agent claude-code".to_string()),
        },
        DesktopSkillItem {
            name: "xlsx".to_string(),
            description: "Spreadsheet creation, editing, formulas, analysis, and visualization".to_string(),
            source: "online".to_string(),
            command: Some("npx skills add https://github.com/anthropics/skills --skill xlsx -g -y --agent claude-code".to_string()),
        },
        // 注意: tauri 相关技能已移除
        // 注意: 以下技能已移除，因为在线技能库中不存在或非官方:
        // - product-artifacts: 在线不存在，应作为内置技能处理
        // - tauri-common-issues: 在线不存在
        // - nanobanana: 非官方，安装量低
    ]
}

fn resolve_online_command_for_skill(skill_name: &str) -> Result<String, String> {
    let mut candidates = run_skills_find(skill_name)?;
    if candidates.is_empty() {
        return Err(format!("未找到可安装的在线 skill: {}", skill_name));
    }

    if let Some(exact) = candidates
        .iter()
        .find(|item| item.name.eq_ignore_ascii_case(skill_name))
        .and_then(|item| item.command.clone())
    {
        return Ok(exact);
    }

    candidates
        .remove(0)
        .command
        .ok_or_else(|| format!("未找到可安装的在线 skill: {}", skill_name))
}


#[tauri::command]
pub async fn desktop_skills_catalog(app: AppHandle) -> Result<DesktopSkillsCatalog, String> {
    let installed_dir = agents_skills_dir()?;
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
            item.command = None;
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
    command: Option<String>,
) -> Result<EnvironmentActionResult, String> {
    let target_root = agents_skills_dir()?;
    fs::create_dir_all(&target_root).map_err(|e| e.to_string())?;

    if source == "builtin" {
        let source_root =
            resolve_builtin_skills_dir(&app).ok_or("未找到内置 skills 目录，请先完成应用安装")?;
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
        // 获取完整的安装命令
        let install_command = match command {
            Some(value) if !value.trim().is_empty() => value,
            _ => resolve_online_command_for_skill(&name)?,
        };

        // 解析命令以执行
        // 命令格式: npx skills add https://github.com/... --skill <name> -g -y --agent claude-code
        let parts: Vec<&str> = install_command.split_whitespace().collect();
        if parts.is_empty() {
            return Err("无效的安装命令".to_string());
        }

        let program = parts[0];
        let args: Vec<&str> = parts[1..].to_vec();

        let output = Command::new(program)
            .args(&args)
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
                message: format!("安装命令执行成功，但未检测到 ~/.agents/skills/{}", name),
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
