# Idea

## 需求描述（原文）

**标题**：修复 Skills 安装功能 - 查找正确的安装命令并更新

## 问题

Skills 页面点击安装按钮，提示"未知错误"。

## 任务

### 1. 使用 find skill skill 查找所有正确的安装命令

使用已有的 find skill skill 工具，找出所有推荐的在线技能（docx、pdf 等）的正确安装命令。

正确的安装格式示例：
```bash
npx skills add https://github.com/anthropics/skills --skill pdf
```

### 2. 更新 environment.rs 中的安装逻辑

- 使用正确的安装命令格式（URL + `--skill` 参数）
- 确保只给 claude code 安装
- 参考 skill agent 的提示词了解如何只给 claude code 安装

### 3. 更新推荐的 skills 配置

在 `fixed_online_recommended_skills()` 或相关函数中，为每个推荐的 skill 配置：
- 正确的 GitHub URL
- 正确的技能名（用于 `--skill` 参数）

## 涉及文件

- `src-tauri/src/environment.rs` - 安装命令逻辑
- 相关的 skills 配置函数

## 验收标准

- [ ] 使用 find skill skill 查找到所有推荐技能的正确安装命令
- [ ] environment.rs 使用正确的命令格式
- [ ] 点击安装按钮能成功安装 skill
- [ ] 安装的 skill 能正常使用
- [ ] 只给 claude code 安装，不影响其他 agent

## 优先级

**P1（高优先级）** - 功能不可用
