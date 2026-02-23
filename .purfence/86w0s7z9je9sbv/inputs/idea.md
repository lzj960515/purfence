# Idea

## 需求描述（原文）

**标题**：修改紫微提示词 - 修复重复创建需求问题

## 背景

当前紫微在创建项目时存在重复创建需求的问题。

## 问题描述

**当前行为**：
1. 紫微调用 `createProject` 工具创建项目
2. `createProject` 工具**内部逻辑已经自动创建了第一个需求**（默认需求）
3. 紫微**又额外调用了 `createIssue`** 工具
4. 结果：一个项目 + **两个需求**（重复了）

**问题代码示例**：
```typescript
// 紫微当前行为（错误）
const project = await createProject({ name, slug, description });
const issue = await createIssue({ projectId: project.id, ... }); // ❌ 重复创建
```

## 修复方案

修改紫微的系统提示词：

**之前**：
```
创建项目流程：
1. 调用 createProject 创建项目
2. 调用 createIssue 创建默认需求
```

**之后**：
```
创建项目流程：
1. 调用 createProject 创建项目
   - 详细撰写项目描述（description），因为：
     - 该描述会作为项目的描述
     - 系统会自动创建一个默认需求，使用此描述作为需求描述
   - 确保 description 包含：项目背景、核心功能、技术栈、目标用户等
2. 无需再调用 createIssue
   - createProject 已经自动创建了第一个需求
   - 继续询问用户下一步想做什么
```

## 涉及文件

- `backend/src/purfence/prompts/ziluo.prompt.ts` 或紫微系统提示词配置

## 验收标准

- ✅ 修改紫微提示词，移除 createIssue 的调用
- ✅ 提示词中说明 createProject 已自动创建需求
- ✅ 强调写详细的项目 description
- ✅ 测试验证：创建项目后只有一个需求（不是两个）
- ✅ 测试验证：默认需求的描述质量良好

## 优先级

**P1（中优先级）** - 修复重复创建问题
