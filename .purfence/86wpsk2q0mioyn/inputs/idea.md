# Idea

## 需求描述（原文）

**标题**：修复自动更新弹窗导致的白屏问题

## Bug 描述

当应用检测到有新版本时，会触发白屏问题。

## 复现步骤
1. 启动 Purfence 应用
2. 等待自动更新检查（或手动触发）
3. 当检测到有新版本时
4. 应用白屏，无法正常显示

## 预期行为
- 检测到新版本时，正常显示更新弹窗
- 用户可以看到版本信息和操作按钮
- 不会白屏

## 可能原因

### 1. 弹窗组件渲染问题
- UpdateDialog 组件可能存在空值处理不当
- 异步数据未正确加载导致渲染失败
- 状态管理（useUpdate hook）异常

### 2. 数据获取问题
- GitHub API 返回数据格式异常
- 版本信息解析失败
- 空值/undefined 未正确处理

### 3. Tauri 窗口问题
- 弹窗创建时窗口状态异常
- 前端与后端通信问题

## 检查点

### 前端代码检查
```typescript
// frontend/src/components/update/UpdateDialog.tsx
// 检查：
// 1. 是否正确处理 loading 状态
// 2. 是否正确处理 error 状态  
// 3. 是否正确处理空数据
// 4. 版本信息是否正确显示

// frontend/src/hooks/useUpdate.ts
// 检查：
// 1. 状态转换是否正确
// 2. 错误处理是否完善
// 3. 数据解析是否健壮
```

### 关键检查项
- [ ] `updateInfo` 是否为 null/undefined 时正确处理
- [ ] `currentVersion` 和 `latestVersion` 是否正确获取
- [ ] 弹窗打开时是否所有必要数据已加载
- [ ] 是否有未捕获的异常导致白屏
- [ ] React 渲染错误边界是否配置

## 调试建议

### 1. 添加日志
在以下位置添加 console.log：
- useUpdate hook 的状态变化
- UpdateDialog 组件的 props 和 state
- GitHub API 返回数据

### 2. 添加错误边界
```typescript
// 在 UpdateDialog 外包裹 ErrorBoundary
<ErrorBoundary>
  <UpdateDialog />
</ErrorBoundary>
```

### 3. 防御性编程
```typescript
// 确保所有可能为空的值都有默认值
const currentVersion = updateInfo?.currentVersion || 'unknown';
const latestVersion = updateInfo?.latestVersion || 'unknown';
const releaseNotes = updateInfo?.releaseNotes || '暂无更新说明';
```

## 验收标准

- ✅ 检测到新版本时正常显示弹窗，不白屏
- ✅ 弹窗正确显示版本信息（当前版本、最新版本）
- ✅ 弹窗正确显示更新内容
- ✅ 三个按钮（更新/跳过/稍后）正常显示和点击
- ✅ 网络异常时有错误提示，不白屏
- ✅ 数据解析异常时有降级显示，不白屏

## 涉及的文件

- `frontend/src/components/update/UpdateDialog.tsx`
- `frontend/src/hooks/useUpdate.ts`
- `frontend/src/components/update/DownloadProgress.tsx`
- 可能涉及：`frontend/src/App.tsx` 或布局文件

## 优先级

**P0（紧急）** - 影响核心功能，用户体验严重受损
