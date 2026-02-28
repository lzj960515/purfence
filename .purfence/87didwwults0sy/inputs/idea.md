# Idea

## 需求描述（原文）

**标题**：refactor-install-skill

重构 Skills 安装配置 - 使用完整命令并移除 tauri skills
**描述**：
## 问题

当前代码使用 `owner/repo@skill` 格式，但正确的格式应该是：
```bash
npx skills add https://github.com/anthropics/skills --skill pdf
```

## 解决方案

### 1. 字段重命名

将 `package` 字段改为 `command` 字段，直接存储完整的安装命令。

**数据结构调整**：
```rust
pub struct DesktopSkillItem {
    name: String,           // 技能名称
    description: String,    // 技能描述
    source: String,         // 来源：builtin | online
    command: Option<String>, // 完整安装命令
}
```

**示例配置**：
```rust
DesktopSkillItem {
    name: "pdf".to_string(),
    description: "PDF 处理".to_string(),
    source: "online".to_string(),
    command: Some("npx skills add https://github.com/anthropics/skills --skill pdf -g -y --agent claude-code".to_string()),
}
```

### 2. 简化安装逻辑

- 直接执行 `command` 字段中的命令
- 不再需要拼接命令或格式解析

### 3. 移除 tauri 相关的 skills

从推荐列表中删除所有 tauri 相关的 skills：
- `tauri-v2`
- `integrating-tauri-js-frontends`
- `configuring-tauri-permissions`
- `tauri-event-system`

这些不作为推荐 skills。

## 优势

- 更灵活，每个 skill 可以有自定义安装命令
- 不需要复杂的格式解析
- 易于维护和扩展
- 减少不必要的推荐项

## 涉及文件

- `src-tauri/src/environment.rs` - DesktopSkillItem 结构和推荐列表

## 验收标准

- [ ] `package` 字段已改为 `command`
- [ ] 所有推荐的 online skills 使用正确的 URL 格式命令
- [ ] 安装时直接执行 command 字段
- [ ] tauri 相关 skills 已从推荐列表移除
- [ ] Skills 安装功能正常工作

## 参考资料

- 官方网站: https://skills.sh/

## 优先级

**P1（高优先级）** - 功能修复
