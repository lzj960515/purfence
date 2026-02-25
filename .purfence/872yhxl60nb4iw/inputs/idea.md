# Idea

## 需求描述（原文）

**标题**：修复 TypeScript 编译错误导致发布失败

修复 Purfence 项目构建时的 TypeScript 错误：
1. src/components/agent/ChatInputArea.tsx 第13行：删除未使用的 'AgentOption' 导入
2. src/pages/AgentPage.tsx 第9行：删除未使用的 'agentOptions' 变量声明

修复后重新发布 Tauri 应用。
