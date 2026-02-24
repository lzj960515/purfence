# PRD - 远程 Git 仓库集成与多人协作工作流

## 标题

支持远程 Git 仓库集成与多人协作工作流

## 用户需求（原文）

**背景**：当前 Purfence 的工作流是自包含的：
1. 自己创建需求（issue）
2. 开出 worktree
3. 天机团队工作
4. 自动完成并合并

但对于已有项目（如 GitLab 集成），需要支持：
- 同步远程分支
- 基于远程 issue 开 worktree
- 多人协作场景下不自动合并/推送

**需求改进**：
1. 支持同步远程分支并开 worktree
2. 支持多人协作模式（autoMerge: false, autoPush: false）
3. 支持单机/协作两种工作流模式切换

## 目标与非目标

### 目标

- 支持 GitLab/GitHub 远程仓库集成
- 支持读取远程 issue 并导入到 Purfence
- 支持基于远程 issue 开出 worktree
- 支持配置化工作流（autoMerge, autoPush）
- 支持单机/协作两种工作流模式
- 支持远程分支同步

### 非目标

- 不支持在 Purfence 中直接修改远程 issue（单向同步）
- 不支持 GitLab/GitHub Webhook 实时同步（采用轮询/手动触发）
- 不支持多远程仓库同时集成（一期只支持单远程）
- 不支持代码审查（Code Review）功能
- 不替代 Git 客户端功能，仅做集成

## 用户与场景

### 目标用户

1. **个人开发者** - 使用单机模式，自动化完成所有流程
2. **团队开发者** - 使用协作模式，需要人工审查后合并
3. **项目经理** - 需要跟踪远程 issue 状态

### 使用场景

#### 场景 1：基于远程 Issue 开发
```
作为开发者，我在 GitLab 上有一个 issue #123
我想在 Purfence 中基于这个 issue 开发
所以 Purfence 应该能：
1. 同步远程 issue #123 到本地
2. 基于远程分支开出 worktree
3. 天机团队完成后，我可以手动合并推送
```

#### 场景 2：协作模式开发
```
作为团队成员，我不想让 Purfence 自动推送代码
所以我配置 autoMerge: false, autoPush: false
当天机团队完成工作后：
1. 代码保留在本地 worktree
2. 我审查后可以手动合并/推送
3. 或者发起 Merge Request
```

#### 场景 3：单机模式开发
```
作为个人开发者，我希望全流程自动化
所以我配置 autoMerge: true, autoPush: true
当天机团队完成工作后：
1. 自动合并到 main 分支
2. 自动推送到远程仓库
```

## 核心用户旅程

### 旅程 1：配置远程仓库

1. 用户在项目设置中选择"添加远程仓库"
2. 选择仓库类型（GitLab/GitHub）
3. 输入仓库 URL 和 Access Token
4. 系统验证连接并保存配置
5. 用户选择工作流模式（单机/协作）

### 旅程 2：同步远程 Issue

1. 用户在 issue 列表点击"同步远程 Issue"
2. 系统调用远程 API 获取 issue 列表
3. 用户选择要导入的 issue
4. 系统创建 Purfence issue 并关联远程 issue
5. issue 出现在 Purfence issue 列表

### 旅程 3：基于远程 Issue 开发

1. 用户在 Purfence 中启动远程 issue
2. 系统同步远程分支到本地
3. 系统基于远程分支开出 worktree
4. 天机团队开始工作
5. 工作完成后：
   - 协作模式：等待用户手动合并/推送
   - 单机模式：自动合并并推送

### 旅程 4：手动合并/推送（协作模式）

1. 天机团队完成工作，issue 状态变为"待合并"
2. 用户收到通知
3. 用户审查 worktree 中的代码
4. 用户点击"合并并推送"或"发起 MR/PR"
5. 系统执行相应操作

## 功能清单

### P0（必须有）

#### F1: 远程仓库配置管理
- 支持配置 GitLab/GitHub 仓库连接
- 支持存储和加密 Access Token
- 支持验证远程仓库连接
- 支持项目级配置

#### F2: 远程 Issue 同步
- 支持从远程仓库获取 issue 列表
- 支持将远程 issue 导入为 Purfence issue
- 支持关联 Purfence issue 与远程 issue
- 支持手动触发同步

#### F3: 工作流配置
- 支持配置 `autoMerge`（默认 true）
- 支持配置 `autoPush`（默认 true）
- 支持配置 `requireManualApproval`（默认 false）
- 支持项目级配置存储

#### F4: 协作模式完成流程
- 支持天机团队完成后进入"待合并"状态
- 支持用户手动触发合并
- 支持用户手动触发推送
- 支持发起 MR/PR（GitLab/GitHub）
- 支持手动同步 MR/PR 状态到 Purfence

#### F5: 远程分支同步
- 支持同步远程分支到本地
- 支持基于远程分支创建 worktree
- 支持检出特定远程分支

### P1（应该有）

#### F6: Issue 字段同步
- 同步 title、description
- 同步 labels
- 同步 assignees
- 同步 comments（只读）

#### F7: 状态映射
- 支持远程 issue 状态与 Purfence 状态映射
- 支持配置状态映射规则

#### F8: 批量同步
- 支持批量导入远程 issue
- 支持按条件筛选（labels、状态等）

### P2（可以有）

#### F9: 自动同步
- 支持定时自动同步远程 issue
- 支持 Webhook 实时同步

#### F10: 多远程仓库
- 支持同时配置多个远程仓库

## 业务规则 / 边界条件

### 工作流模式规则

| 配置项 | 单机模式（默认） | 协作模式 |
|-------|----------------|---------|
| `workflow.mode` | `standalone` | `collaborative` |
| `workflow.autoCreateIssue` | `true` | `false` |
| `workflow.autoMerge` | `true` | `false` |
| `workflow.autoPush` | `true` | `false` |
| `workflow.requireManualApproval` | `false` | `true` |

### 远程 Issue 导入规则

1. **唯一性**：一个远程 issue 只能导入一次（通过 `remoteIssueId` 去重）
2. **字段映射**：
   - `remoteIssueId` → 存储原始 ID
   - `title` → 直接映射
   - `description` → 直接映射
   - `labels` → 存储为 JSON 数组
   - `remoteUrl` → 远程 issue URL
   - `remoteState` → 远程状态
3. **状态初始化**：导入后状态为 `open`
4. **同步策略**：单向导入，不自动同步
   - 导入时获取远程 issue 的最新状态
   - 导入后 Purfence issue 与远程 issue 独立管理
   - 如需更新，用户需手动重新导入或同步

### Worktree 命名规则

基于远程 issue 开 worktree 时：

```
分支名: issue/{purfence-issue-id}-{short-random}
目录名: worktrees/{remote-issue-number}-{slug}

示例：
- 远程 issue: #123 fix-login-bug
- Purfence issue ID: 86zjm8g8hgxsh2
- 随机后缀: a3f9k2
- 分支: issue/86zjm8g8hgxsh2-a3f9k2
- 目录: worktrees/123-fix-login-bug
```

**分支命名规则说明**：
- `short-random` 使用 6 位字母数字组合（小写字母+数字）
- 添加随机后缀是为了避免多人基于同一远程 issue 开发时产生分支名冲突
- 每个 Purfence issue 创建时生成唯一的随机后缀，保持不变

### 完成流程规则

**单机模式**：
1. 天机团队调用 `completeIssue`
2. 系统自动合并到 main
3. 系统自动推送到远程
4. issue 状态变为 `done`

**协作模式**：
1. 天机团队调用 `completeIssue`
2. 系统检查 `autoMerge: false`，不执行合并
3. issue 状态变为 `needs_approval`
4. 通知用户有待审查的 worktree
5. 用户审查后：
   - 点击"合并到 main" → 执行合并
   - 点击"推送到远程" → 执行推送
   - 点击"发起 MR/PR" → 调用 API 创建 MR/PR
6. 用户点击"同步远程状态" → 查询 MR/PR 状态，如已合并则 issue 状态变为 `completed`

### 错误处理规则

1. **远程 API 调用失败**：
   - 记录错误日志
   - 返回用户友好的错误信息
   - 允许重试

2. **Access Token 失效**：
   - 标记配置为"需要重新授权"
   - 通知用户更新 Token

3. **权限不足**：
   - 明确提示缺少的权限
   - 提供权限配置指南

4. **网络超时**：
   - 3 次重试机制
   - 重试失败后返回超时错误

## 非功能需求

### 性能

- 远程 API 调用超时：30 秒
- 同步 100 个 issue 响应时间 < 10 秒
- 分支同步响应时间 < 5 秒

### 安全/隐私

- Access Token 必须加密存储（AES-256）
- Token 只在服务端使用，不暴露给前端
- 支持 Token 轮换机制
- 日志中不得记录敏感信息

### 兼容性

- 支持 GitLab 14.0+
- 支持 GitHub Enterprise 3.0+
- 支持标准 Git 协议（HTTPS/SSH）

## 风险与取舍

### 风险 1：Access Token 安全

**描述**：Access Token 存储和传输过程中的安全风险

**应对方案**：
- 使用 AES-256 加密存储
- 服务端代理所有远程 API 调用
- 支持 Token 定期轮换

### 风险 2：远程 API 限流

**描述**：GitLab/GitHub API 有调用频率限制

**应对方案**：
- 实现请求队列和限流控制
- 提供缓存机制
- 错误时返回友好提示

### 风险 3：Git 操作冲突

**描述**：多人协作时可能出现分支冲突

**应对方案**：
- 协作模式下保留 worktree 供人工解决
- 提供冲突检测和提示
- 天机团队可以处理简单冲突

### 取舍 1：单向同步 vs 双向同步

**选择**：单向同步（远程 → Purfence）

**理由**：
- 简化实现复杂度
- 避免状态不一致问题
- 符合大多数使用场景

### 取舍 2：手动触发 vs 自动同步

**选择**：一期采用手动触发，二期考虑自动同步

**理由**：
- 降低系统复杂度
- 避免不必要的 API 调用
- 给用户更多控制权

## 决策与假设列表

### 决策

| ID | 决策内容 | 理由 |
|----|---------|------|
| D1 | 配置存储在项目级数据库中，而非 `.purfence/config.json` | 便于多设备同步，支持加密存储，符合现有架构 |
| D2 | Access Token 使用 AES-256 加密存储 | 安全最佳实践，符合企业级应用要求 |
| D3 | Issue 同步采用单向同步（远程→Purfence） | 简化状态管理，避免冲突 |
| D4 | 分支命名使用 `issue/{purfence-issue-id}-{short-random}` 格式 | 避免多人基于同一远程 issue 开发时产生分支名冲突，随机后缀使用 6 位字母数字组合 |
| D5 | 协作模式下保留 worktree 供人工审查 | 给用户完全控制权，符合协作场景需求 |
| D6 | 完成流程状态：`needs_approval` 表示等待手动合并，`completed` 表示 MR/PR 已合并 | 复用现有状态枚举，减少改动 |
| D8 | 远程 Issue 同步采用单向导入策略 | 简化状态管理，避免双向同步的复杂性，用户手动控制同步时机 |
| D7 | 远程 API 调用使用服务端代理 | 保护 Access Token，统一错误处理 |

### 假设

| ID | 假设内容 | 依据 |
|----|---------|------|
| A1 | 用户有远程仓库的管理员或开发者权限 | 否则无法创建 MR/PR 或推送代码 |
| A2 | 远程仓库使用标准 GitLab/GitHub API | 如果是自托管版本，API 应该兼容 |
| A3 | 一个 Purfence 项目只关联一个远程仓库 | 简化一期实现 |
| A4 | 用户会定期更新 Access Token | Token 有过期时间 |
| A5 | 协作模式下用户会及时审查和合并代码 | 否则 worktree 会堆积 |

## 数据模型

### 配置结构

```typescript
// 项目配置扩展
interface PurfenceProject {
  // ... 现有字段

  // 远程仓库配置
  remoteRepository?: RemoteRepositoryConfig;

  // 工作流配置
  workflow?: WorkflowConfig;
}

// 远程仓库配置
interface RemoteRepositoryConfig {
  // 仓库类型
  type: 'gitlab' | 'github';

  // 仓库 URL（HTTPS 或 SSH）
  url: string;

  // 加密存储的 Access Token
  encryptedToken: string;

  // 默认分支
  defaultBranch: string;

  // 最后同步时间
  lastSyncedAt?: Date;

  // 状态: connected, error, expired
  status: 'connected' | 'error' | 'expired';

  // 错误信息（如果有）
  errorMessage?: string;
}

// 工作流配置
interface WorkflowConfig {
  // 工作流模式
  mode: 'standalone' | 'collaborative';

  // 自动创建 issue（单机模式）
  autoCreateIssue: boolean;

  // 自动合并
  autoMerge: boolean;

  // 自动推送
  autoPush: boolean;

  // 需要手动确认
  requireManualApproval: boolean;
}

// 默认值
const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  mode: 'standalone',
  autoCreateIssue: true,
  autoMerge: true,
  autoPush: true,
  requireManualApproval: false,
};
```

### Issue 数据结构扩展

```typescript
// PurfenceIssue 扩展
interface PurfenceIssue {
  // ... 现有字段

  // 来源类型扩展
  origin: 'user' | 'ai' | 'remote';

  // 远程 issue 关联信息
  remoteIssue?: RemoteIssueReference;
}

// 远程 issue 引用
interface RemoteIssueReference {
  // 远程 issue ID
  remoteIssueId: string;

  // 远程 issue 编号（如 #123）
  remoteIssueNumber: number;

  // 远程 URL
  remoteUrl: string;

  // 远程状态
  remoteState: string;

  // 最后同步时间
  lastSyncedAt: Date;

  // 同步的字段（存储原始数据）
  syncedData: {
    title: string;
    description: string;
    labels: string[];
    assignees: string[];
    comments: RemoteComment[];
  };
}

interface RemoteComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}
```

## 接口设计建议

### GraphQL Schema 扩展

```graphql
# 远程仓库类型
enum RemoteRepositoryType {
  GITLAB
  GITHUB
}

# 远程仓库配置
input RemoteRepositoryConfigInput {
  type: RemoteRepositoryType!
  url: String!
  token: String!
  defaultBranch: String
}

type RemoteRepositoryConfig {
  type: RemoteRepositoryType!
  url: String!
  defaultBranch: String!
  lastSyncedAt: DateTime
  status: String!
  errorMessage: String
}

# 工作流配置
input WorkflowConfigInput {
  mode: WorkflowMode!
  autoCreateIssue: Boolean
  autoMerge: Boolean
  autoPush: Boolean
  requireManualApproval: Boolean
}

enum WorkflowMode {
  STANDALONE
  COLLABORATIVE
}

type WorkflowConfig {
  mode: WorkflowMode!
  autoCreateIssue: Boolean!
  autoMerge: Boolean!
  autoPush: Boolean!
  requireManualApproval: Boolean!
}

# 远程 Issue
type RemoteIssue {
  remoteIssueId: String!
  remoteIssueNumber: Int!
  title: String!
  description: String
  state: String!
  labels: [String!]!
  assignees: [String!]!
  remoteUrl: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# 扩展 PurfenceProject
type PurfenceProject {
  # ... 现有字段
  remoteRepository: RemoteRepositoryConfig
  workflow: WorkflowConfig
}

# 扩展 PurfenceIssue
type PurfenceIssue {
  # ... 现有字段
  remoteIssue: RemoteIssueReference
}

type RemoteIssueReference {
  remoteIssueId: String!
  remoteIssueNumber: Int!
  remoteUrl: String!
  remoteState: String!
  lastSyncedAt: DateTime!
}

# Mutations
extend type Mutation {
  # 配置远程仓库
  configureRemoteRepository(
    projectId: ID!
    config: RemoteRepositoryConfigInput!
  ): PurfenceProject!

  # 测试远程仓库连接
  testRemoteRepositoryConnection(
    type: RemoteRepositoryType!
    url: String!
    token: String!
  ): Boolean!

  # 同步远程 issue 列表
  syncRemoteIssues(projectId: ID!): [RemoteIssue!]!

  # 导入远程 issue
  importRemoteIssue(
    projectId: ID!
    remoteIssueId: String!
  ): PurfenceIssue!

  # 更新工作流配置
  updateWorkflowConfig(
    projectId: ID!
    config: WorkflowConfigInput!
  ): PurfenceProject!

  # 手动合并 issue 分支
  manualMergeIssue(issueId: ID!): PurfenceIssue!

  # 手动推送 issue 分支
  manualPushIssue(issueId: ID!): PurfenceIssue!

  # 发起 Merge Request / Pull Request
  createMergeRequest(
    issueId: ID!
    title: String
    description: String
  ): MergeRequestResult!

  # 同步远程 MR/PR 状态
  syncMergeRequestStatus(issueId: ID!): SyncMRStatusResult!
}

type MergeRequestResult {
  success: Boolean!
  mrUrl: String
  mrId: String
  errorMessage: String
}

type SyncMRStatusResult {
  success: Boolean!
  status: String  # merged, open, closed, unknown
  issueStateUpdated: Boolean!
  previousState: String
  currentState: String
  errorMessage: String
}

# Queries
extend type Query {
  # 获取远程 issue 列表
  remoteIssues(projectId: ID!): [RemoteIssue!]!

  # 检查 issue 是否可以合并
  canMergeIssue(issueId: ID!): Boolean!
}
```

### REST API（可选，用于 Webhook）

```
POST /webhooks/gitlab
POST /webhooks/github
```

## 配置选项列表

### 项目级配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| `workflow.mode` | enum | `standalone` | 工作流模式：standalone/collaborative |
| `workflow.autoCreateIssue` | boolean | `true` | 是否自动创建 issue（单机模式） |
| `workflow.autoMerge` | boolean | `true` | 完成时是否自动合并 |
| `workflow.autoPush` | boolean | `true` | 完成时是否自动推送 |
| `workflow.requireManualApproval` | boolean | `false` | 是否需要手动确认 |

### 远程仓库配置

| 配置项 | 类型 | 必填 | 说明 |
|-------|------|-----|------|
| `remoteRepository.type` | enum | 是 | 仓库类型：gitlab/github |
| `remoteRepository.url` | string | 是 | 仓库 URL |
| `remoteRepository.encryptedToken` | string | 是 | 加密后的 Access Token |
| `remoteRepository.defaultBranch` | string | 否 | 默认分支，默认 main |

## 状态流转图

### 单机模式

```
open → running → done
```

### 协作模式

```
open → running → needs_approval → done
                    ↓                ↑
              （用户手动合并/推送）   （或 MR/PR 合并后同步状态）
```

**状态流转说明**：
- `needs_approval`：天机团队完成工作，等待用户审查
- `done`：用户手动合并或 MR/PR 已合并（通过"同步远程状态"检测）

### 远程 Issue 同步状态

```
未导入 → 已导入(open) → 同步中 → 同步完成
  ↑___________________________|
  （定期重新同步）
```
