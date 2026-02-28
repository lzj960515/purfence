# Idea

## 需求描述（原文）

**标题**：开发 GitLab/GitHub 远程仓库集成前端页面

## 背景

后端已完成 GitLab/GitHub 远程仓库集成功能（Issue #86zjm8g8hgxsh2），但前端页面尚未实现，用户无法通过界面使用该功能。

## 当前状况

### ✅ 后端已完成

**remote-git 模块**：
- GitLab/GitHub API 适配器（`@gitbeaker/rest`、`@octokit/rest`）
- 远程仓库配置（URL、Token）
- Token 加密存储（AES-256）
- 远程 Issue 同步和导入
- GraphQL API 接口

**workflow 模块**：
- 单机/协作模式切换
- 自动/手动合并推送
- Issue 状态机
- 完成策略

### ❌ 前端未实现

用户目前只能通过 GraphQL Playground 调用 API，无法在界面上使用。

## 任务

### 1. 阅读文档和代码

**需求文档**：
- `.purfence/86zjm8g8hgxsh2/issue.json` - 需求描述
- `.purfence/86zjm8g8hgxsh2/` 目录下的其他文档

**后端代码**：
- `backend/src/remote-git/remote-git.service.ts` - 远程仓库服务
- `backend/src/remote-git/remote-git.resolver.ts` - GraphQL 接口
- `backend/src/remote-git/entities/remote-repository.entity.ts` - 数据实体
- `backend/src/workflow/workflow.service.ts` - 工作流服务
- `backend/src/workflow/workflow.resolver.ts` - GraphQL 接口

**GraphQL Schema**：
- 查看 GraphQL Playground 了解所有可用的 API

### 2. 开发前端页面

#### 2.1 项目设置页面 - 远程仓库配置

**路由**：`/projects/:projectId/settings/remote`

**功能**：
- 配置远程仓库类型（GitLab/GitHub）
- 输入仓库 URL（如 `https://gitlab.com/ns/project`）
- 输入 Access Token（密码框）
- 测试连接按钮
- 保存配置

**组件**：
```
RemoteRepositorySettings
├── RepositoryTypeSelect (GitLab/GitHub)
├── RepositoryUrlInput
├── AccessTokenInput
├── TestConnectionButton
└── SaveButton
```

#### 2.2 远程 Issue 列表页面

**路由**：`/projects/:projectId/remote-issues`

**功能**：
- 从远程仓库获取 Issue 列表
- 显示 Issue 标题、状态、标签
- 筛选和搜索功能
- 导入选中的 Issue 到 Purfence

**组件**：
```
RemoteIssuesPage
├── FilterBar（状态、标签筛选）
├── SearchInput
├── RemoteIssueList
│   ├── IssueCard
│   │   ├── Checkbox（选择导入）
│   │   ├── Title
│   │   ├── Labels
│   │   └── Status
│   └── ImportButton
└── BatchImportButton
```

#### 2.3 工作流配置页面

**路由**：`/projects/:projectId/settings/workflow`

**功能**：
- 选择工作流模式（单机/协作）
- 配置 autoMerge、autoPush、requireManualApproval
- 显示当前工作流状态

**组件**：
```
WorkflowSettings
├── ModeSelect（standalone/collaborative）
├── AutoMergeToggle
├── AutoPushToggle
├── RequireManualApprovalToggle
└── SaveButton
```

#### 2.4 Issue 详情页 - 协作模式操作

**位置**：Issue 详情页面中添加

**功能（协作模式下显示）**：
- 手动合并按钮
- 手动推送按钮
- 发起 MR/PR 按钮
- 显示当前状态（running → needs_approval → done）

**组件**：
```
CollaborationActions
├── StatusBadge
├── ManualMergeButton
├── ManualPushButton
└── CreatePullRequestButton
```

### 3. API 集成

创建前端 API 文件：
- `frontend/src/api/remote-git.api.ts` - 远程仓库 API
- `frontend/src/api/workflow.api.ts` - 工作流 API

**示例**：
```typescript
// remote-git.api.ts
export const remoteGitApi = {
  configureRepository: (projectId: string, config: RemoteRepositoryConfig) => 
    graphql.mutation(CONFIGURE_REMOTE_REPOSITORY, { projectId, config }),
  
  testConnection: (projectId: string) =>
    graphql.query(TEST_REMOTE_CONNECTION, { projectId }),
  
  getRemoteIssues: (projectId: string, filters?: IssueFilters) =>
    graphql.query(GET_REMOTE_ISSUES, { projectId, filters }),
  
  importIssue: (projectId: string, remoteIssueId: string) =>
    graphql.mutation(IMPORT_REMOTE_ISSUE, { projectId, remoteIssueId }),
};
```

### 4. 状态管理

考虑使用 React Query 或 Apollo Client 管理远程数据：
- 缓存远程 Issue 列表
- 乐观更新
- 错误处理

## 涉及文件

**新增文件**：
- `frontend/src/pages/RemoteRepositorySettingsPage.tsx`
- `frontend/src/pages/RemoteIssuesPage.tsx`
- `frontend/src/pages/WorkflowSettingsPage.tsx`
- `frontend/src/components/remote-git/` - 相关组件
- `frontend/src/api/remote-git.api.ts`
- `frontend/src/api/workflow.api.ts`

**修改文件**：
- `frontend/src/App.tsx` - 添加路由
- `frontend/src/pages/IssueDetailPage.tsx` - 添加协作操作

## 验收标准

- [ ] 阅读了 `.purfence/86zjm8g8hgxsh2` 下的所有文档
- [ ] 理解了后端 remote-git 和 workflow 模块的实现
- [ ] 可以在项目设置中配置 GitLab/GitHub 远程仓库
- [ ] 可以测试远程仓库连接
- [ ] 可以查看远程 Issue 列表
- [ ] 可以导入远程 Issue 到 Purfence
- [ ] 可以切换工作流模式（单机/协作）
- [ ] 协作模式下可以手动合并和推送
- [ ] 所有 API 调用都有错误处理
- [ ] UI 响应式设计，适配桌面端

## 优先级

**P1（高优先级）** - 核心功能，用户无法使用远程仓库集成

## 参考

- 需求文档：`.purfence/86zjm8g8hgxsh2/`
- 后端代码：`backend/src/remote-git/`、`backend/src/workflow/`
- GraphQL Playground：http://localhost:1016/graphql
