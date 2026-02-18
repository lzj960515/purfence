# Idea

## 需求描述（原文）

**标题**：改进 createProject 工具的路径参数说明

## 问题背景

在导入项目时，如果使用相对路径（如 `~/purfence`），会导致：
1. **localRootPath 初始化失败**：异步事件处理后，localRootPath 保持为空
2. **软链接创建失败**：repo 软链接无法正确创建
3. **AI 分析无法执行**：项目分析流程依赖正确的路径，路径错误会导致分析失败

### 实际案例
```typescript
// ❌ 错误用法（相对路径）
createProject({
  mode: "import",
  slug: "purfence",
  externalPath: "~/purfence"  // 导致初始化失败
})

// ✅ 正确用法（绝对路径）
createProject({
  mode: "import",
  slug: "purfence",
  externalPath: "/Users/liaozijian/purfence"  // macOS 绝对路径
})
```

## 需要改进的地方

### 1. 工具描述（description）
**当前**：没有明确说明路径要求

**建议改进**：
```
创建项目或导入现有本地项目（会在本地 projects 根目录初始化 repo）

注意：
- 导入项目（mode="import"）时，externalPath 参数必须使用绝对路径
- 不要使用相对路径（如 ~/project、../project）
- 路径必须指向实际存在的目录
```

### 2. 参数描述（parameters.externalPath）

**当前**：
```
"externalPath": {
  "description": "本地已有项目的绝对路径（import 模式必填）",
  "type": "string"
}
```

**建议改进**：
```
"externalPath": {
  "description": "本地已有项目的绝对路径（import 模式必填）。
  
  ⚠️ 必须使用绝对路径，格式要求：
  
  macOS/Linux 示例：
  - ✅ 正确：/Users/用户名/projects/my-project
  - ❌ 错误：~/projects/my-project
  - ❌ 错误：../my-project
  
  Windows 示例：
  - ✅ 正确：C:\\Users\\用户名\\projects\\my-project
  - ✅ 正确：D:\\projects\\my-project
  - ❌ 错误：~\\projects\\my-project
  - ❌ 错误：..\\my-project
  
  路径必须指向实际存在的目录。",
  "type": "string",
  "minLength": 1
}
```

### 3. 参数验证增强

**建议添加前端验证**：
```typescript
// 在 Zod schema 或参数验证中添加
if (mode === 'import') {
  // 检查是否包含 ~ 符号
  if (externalPath?.includes('~')) {
    throw new Error('❌ 错误：请使用绝对路径，不要使用 ~ 符号。例如：/Users/用户名/project（macOS）或 C:\\Users\\用户名\\project（Windows）');
  }
  
  // 检查是否是相对路径（不以 / 或驱动器字母开头）
  const isAbsolute = externalPath?.startsWith('/') || 
                     /^[A-Za-z]:/.test(externalPath || '');
  if (!isAbsolute) {
    throw new Error('❌ 错误：请使用绝对路径。例如：/Users/用户名/project（macOS）或 C:\\Users\\用户名\\project（Windows）');
  }
}
```

### 4. 错误提示改进

**当前错误**：软链接创建失败时，错误信息不够清晰

**建议改进**：
```typescript
// 在 setupImportedRepo 中
try {
  fs.symlinkSync(externalPath, repoLinkPath);
} catch (error) {
  if (externalPath.includes('~')) {
    throw new Error(
      `❌ 路径格式错误：不支持包含 ~ 的相对路径。
      
      请使用绝对路径：
      - macOS: /Users/用户名/${externalPath.replace('~/', '')}
      - Windows: C:\\Users\\用户名\\${externalPath.replace('~\\', '')}
      
      原始错误：${error.message}`
    );
  }
  throw new Error(`Failed to create symlink: ${error.message}`);
}
```

## 技术实现位置

需要修改的文件：
1. **工具定义**：`src/purfence/tools/purfence.tools.ts`（第 97-123 行）
   - 更新 description
   - 更新 parameters.externalPath 描述

2. **参数验证**：`src/purfence/tools/purfence.tools.ts`（第 81-86 行）
   - 添加路径格式验证

3. **错误处理**：`src/purfence/purfence-project.service.ts`（第 128-134 行）
   - 改进错误提示信息

## 验收标准

- ✅ 工具描述明确说明必须使用绝对路径
- ✅ 参数描述包含 macOS/Linux 和 Windows 的路径格式示例
- ✅ 提供正确和错误的路径示例对比
- ✅ 传入相对路径时，给出清晰的错误提示
- ✅ 错误提示包含正确格式的示例
- ✅ 不影响现有使用绝对路径的功能

## 优先级

**P1（高优先级）**：这个改进可以避免用户遇到难以调试的路径问题，提升用户体验。

## 额外建议

1. **文档补充**：在用户文档中添加"导入项目最佳实践"章节
2. **路径展开**：考虑在后端自动展开 `~` 符号（使用 `os.homedir()`）
3. **路径检查**：在保存前验证路径是否存在
4. **友好提示**：如果检测到相对路径，提供转换建议
