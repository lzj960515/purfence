# Purfence 发布指南

## 发布流程概览

Purfence 使用自动化发布流程，通过 Git 标签触发 GitHub Actions 自动构建和发布。

```
开发完成 → 运行发布脚本 → 自动更新版本号 → 创建 Git 标签 → 推送到远程
    ↓
GitHub Actions 自动构建
    ↓
  ├── macOS DMG (代码签名 + 公证)
  └── Windows MSI (可选代码签名)
    ↓
自动创建 GitHub Release
```

## 快速开始

### 1. 发布新版本（推荐）

```bash
# 自动化发布（推荐）
npm run release 0.4.16

# 带预发布标签
npm run release 0.5.0-beta.1

# 干运行（预览不执行）
npm run release:check 0.4.16
```

发布脚本会自动：
- ✓ 检查 Git 工作区是否干净
- ✓ 检查标签是否已存在
- ✓ 同步更新所有版本号（package.json, Cargo.toml, tauri.conf.json）
- ✓ 创建 Git commit 和标签
- ✓ 推送到远程并触发 CI/CD

### 2. 手动发布（不推荐）

如果需要更多控制，可以手动操作：

```bash
# 1. 更新版本号
npm run release:sync-version 0.4.16

# 2. 提交更改
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: bump version to v0.4.16"

# 3. 创建标签
git tag -a v0.4.16 -m "Release v0.4.16"

# 4. 推送
git push origin HEAD --tags
```

## 发布命令详解

### npm run release `<version>`

完整的发布流程，包括：
- 版本号验证
- Git 状态检查
- 版本同步更新
- Commit 和 Tag 创建
- 推送到远程

**参数：**
- `<version>`: 要发布的版本号（支持 `0.4.16` 或 `v0.4.16` 格式）

**选项：**
- `--dry-run`: 干运行模式，只预览不执行
- `--no-push`: 不推送到远程

**示例：**
```bash
# 正式发布
npm run release 0.4.16

# 预发布版本
npm run release 0.5.0-beta.1

# 干运行预览
npm run release 0.4.16 -- --dry-run

# 只创建本地标签，不推送
npm run release 0.4.16 -- --no-push
```

### npm run release:check `<version>`

干运行模式的快捷命令，用于预览发布过程。

**示例：**
```bash
npm run release:check 0.4.16
```

### npm run release:sync-version `<version>`

仅同步版本号，不创建 Git 操作。通常由 CI/CD 自动调用。

**示例：**
```bash
npm run release:sync-version 0.4.16
```

## 版本号规范

Purfence 遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

### 示例

- `0.4.16` - 正式版本
- `0.5.0-beta.1` - Beta 预发布
- `0.5.0-alpha.2` - Alpha 预发布
- `1.0.0-rc.1` - 候选版本

### 版本递增规则

- **PATCH (0.4.x)**: Bug 修复、小改进
- **MINOR (0.x.0)**: 新功能、向后兼容的改进
- **MAJOR (x.0.0)**: 重大更新、不兼容的变更

## CI/CD 自动化

GitHub Actions 工作流 `.github/workflows/release-desktop.yml` 会在推送标签时自动触发。

### 构建产物

- **macOS**: DMG 安装包（已签名和公证）
- **Windows**: MSI 安装包（可选签名）

### GitHub Release

自动创建包含以下内容的 Release：
- 版本号标题
- DMG 和 MSI 下载链接
- 自动生成的 Changelog

### 必需的 GitHub Secrets

在仓库 Settings → Secrets 中配置：

#### macOS 签名（必需）
- `APPLE_CERTIFICATE`: Base64 编码的 Developer ID 证书
- `APPLE_CERTIFICATE_PASSWORD`: 证书密码
- `APPLE_SIGNING_IDENTITY`: 签名身份（如 "Developer ID Application: Name"）
- `KEYCHAIN_PASSWORD`: 临时钥匙串密码
- `APPLE_API_ISSUER`: App Store Connect API Issuer ID
- `APPLE_API_KEY`: App Store Connect API Key ID
- `APPLE_API_KEY_P8`: Base64 编码的 .p8 私钥文件

#### Windows 签名（可选）
- `WINDOWS_CERTIFICATE`: Base64 编码的代码签名证书
- `WINDOWS_CERTIFICATE_PASSWORD`: 证书密码

## 发布前检查清单

### 1. 代码准备
- [ ] 所有功能已开发完成
- [ ] 所有测试通过
- [ ] 代码已 Review
- [ ] CHANGELOG 已更新

### 2. 版本号确认
- [ ] 确定新版本号
- [ ] 检查是否需要递增 MAJOR/MINOR/PATCH
- [ ] 是否是预发布版本

### 3. Git 状态
- [ ] 工作区干净（无未提交的更改）
- [ ] 在正确的分支（main/master）
- [ ] 已拉取最新代码

### 4. 执行发布
```bash
# 1. 干运行检查
npm run release:check 0.4.16

# 2. 确认无误后正式发布
npm run release 0.4.16

# 3. 等待 CI/CD 完成
# 访问 https://github.com/OWNER/REPO/actions 查看构建状态

# 4. 验证 Release
# 访问 https://github.com/OWNER/REPO/releases 确认产物
```

## 常见问题

### 1. 标签已存在

**错误：** `Tag v0.4.16 already exists!`

**解决：**
```bash
# 删除本地标签
git tag -d v0.4.16

# 删除远程标签
git push origin :refs/tags/v0.4.16

# 重新发布
npm run release 0.4.16
```

### 2. 工作区有未提交的更改

**错误：** `Working directory has uncommitted changes`

**解决：**
```bash
# 提交或暂存更改
git add .
git commit -m "Your changes"

# 或使用 stash
git stash
npm run release 0.4.16
git stash pop
```

### 3. CI/CD 构建失败

**检查步骤：**
1. 访问 GitHub Actions 页面查看详细日志
2. 确认所有 Secrets 配置正确
3. 检查代码是否编译通过
4. 验证签名配置

### 4. 版本号格式错误

**错误：** `Invalid version: 0.4`

**解决：** 使用完整的 semver 格式，如 `0.4.16`

## 回滚发布

如果发布出现问题：

```bash
# 1. 删除远程标签
git push origin :refs/tags/v0.4.16

# 2. 删除本地标签
git tag -d v0.4.16

# 3. 回退 commit（如果需要）
git reset --hard HEAD~1

# 4. 修复问题后重新发布
npm run release 0.4.16
```

## 最佳实践

1. **使用自动化脚本**：始终使用 `npm run release` 而非手动操作
2. **先干运行**：发布前使用 `--dry-run` 预览
3. **版本号规范**：遵循语义化版本规范
4. **测试先行**：确保所有测试通过再发布
5. **更新日志**：维护 CHANGELOG 记录变更
6. **签名配置**：确保所有签名 Secrets 配置正确

## 相关文件

- 发布脚本：`scripts/release.mjs`
- 版本同步：`scripts/sync-tauri-version.mjs`
- CI/CD 配置：`.github/workflows/release-desktop.yml`
- Tauri 配置：`src-tauri/tauri.conf.json`
- Cargo 配置：`src-tauri/Cargo.toml`
- Package 配置：`package.json`
