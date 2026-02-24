# 架构设计文档 - 远程 Git 仓库集成与多人协作工作流

## 1. 架构概览

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Purfence Backend                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   GraphQL API   │    │  REST API       │    │   WebSocket     │         │
│  │   (Queries)     │    │  (Webhooks)     │    │   (Events)      │         │
│  └────────┬────────┘    └────────┬────────┘    └─────────────────┘         │
│           │                      │                                          │
│           └──────────────────────┘                                          │
│                      │                                                      │
│  ┌───────────────────┴──────────────────────────────────────────────────┐  │
│  │                        Application Layer                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  RemoteRepo │  │   Issue     │  │  Workflow   │  │    Git      │  │  │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service   │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │  │
│  │         │                │                │                │         │  │
│  │         └────────────────┴────────────────┴────────────────┘         │  │
│  │                              │                                        │  │
│  │                    ┌─────────┴─────────┐                              │  │
│  │                    │   Event Bus       │                              │  │
│  │                    │  (EventEmitter)   │                              │  │
│  │                    └───────────────────┘                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        Domain Layer                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ RemoteRepo  │  │   Issue     │  │  Workflow   │  │   Git       │  │  │
│  │  │   Entity    │  │   Entity    │  │   Config    │  │  Operation  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │  │
│  │  │  Remote     │  │   Issue     │  │   Token     │                     │  │
│  │  │   Issue     │  │   State     │  │   Crypto    │                     │  │
│  │  │   Adapter   │  │   Machine   │  │   Service   │                     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Infrastructure Layer                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   GitLab    │  │   GitHub    │  │    Git      │  │   Crypto    │  │  │
│  │  │   Client    │  │   Client    │  │   Client    │  │   (AES)     │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │  │
│  │  │   HTTP      │  │   Retry     │  │   Cache     │                     │  │
│  │  │   Client    │  │   Wrapper   │  │   (Redis)   │                     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    │
┌───────────────────────────────────┴─────────────────────────────────────────┐
│                           External Services                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   GitLab    │  │   GitHub    │  │    Git      │  │   Redis     │         │
│  │    API      │  │    API      │  │   Remote    │  │   Cache     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 模块依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                     Module Dependencies                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                             │
│  │  PurfenceModule │◄─────────────────────────────────────┐      │
│  │   (Existing)    │                                      │      │
│  └────────┬────────┘                                      │      │
│           │                                               │      │
│           │ imports                                       │      │
│           ▼                                               │      │
│  ┌─────────────────┐     ┌─────────────────┐              │      │
│  │  RemoteGitModule │◄────│  WorkflowModule  │              │      │
│  │    (New)        │     │    (New)        │              │      │
│  └────────┬────────┘     └────────┬────────┘              │      │
│           │                       │                       │      │
│           │ imports               │ imports               │      │
│           ▼                       ▼                       │      │
│  ┌─────────────────┐     ┌─────────────────┐              │      │
│  │  GitLabModule   │     │  SharedModule   │──────────────┘      │
│  │  GitHubModule   │     │  (CryptoUtil)   │                     │
│  │  (Adapters)     │     └─────────────────┘                     │
│  └─────────────────┘                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 目录结构

```
backend/
├── src/
│   ├── purfence/
│   │   ├── purfence-issue.entity.ts          # 扩展现有实体
│   │   ├── purfence-issue.service.ts         # 扩展现有服务
│   │   ├── purfence-project.entity.ts        # 扩展现有实体
│   │   ├── purfence-status.enum.ts           # 扩展现有枚举
│   │   └── ...
│   │
│   ├── remote-git/                           # 新增模块
│   │   ├── remote-git.module.ts
│   │   ├── remote-git.service.ts
│   │   ├── remote-git.resolver.ts
│   │   ├── dto/
│   │   │   ├── remote-repository.input.ts
│   │   │   ├── remote-repository.dto.ts
│   │   │   ├── remote-issue.dto.ts
│   │   │   └── merge-request.input.ts
│   │   ├── entities/
│   │   │   └── remote-repository.entity.ts   # 项目级配置存储
│   │   ├── adapters/
│   │   │   ├── git-adapter.interface.ts
│   │   │   ├── gitlab.adapter.ts
│   │   │   ├── github.adapter.ts
│   │   │   └── adapter.factory.ts
│   │   └── errors/
│   │       ├── remote-git.error.ts
│   │       ├── token-expired.error.ts
│   │       └── permission-denied.error.ts
│   │
│   ├── workflow/                             # 新增模块
│   │   ├── workflow.module.ts
│   │   ├── workflow.service.ts
│   │   ├── workflow.resolver.ts
│   │   ├── dto/
│   │   │   ├── workflow-config.input.ts
│   │   │   └── workflow-config.dto.ts
│   │   ├── entities/
│   │   │   └── workflow-config.entity.ts
│   │   ├── strategies/
│   │   │   ├── completion-strategy.interface.ts
│   │   │   ├── standalone-completion.strategy.ts
│   │   │   └── collaborative-completion.strategy.ts
│   │   └── state-machine/
│   │       ├── issue-state-machine.ts
│   │       └── transitions/
│   │           ├── to-needs-approval.transition.ts
│   │           └── to-done.transition.ts
│   │
│   └── app.module.ts                         # 注册新模块
│
├── libs/
│   ├── shared/
│   │   └── src/
│   │       └── utils/
│   │           └── crypto.util.ts            # 现有加密工具
│   │
│   └── cache/                                # 现有缓存模块
│
└── test/
    └── remote-git/
        ├── gitlab.adapter.spec.ts
        ├── github.adapter.spec.ts
        └── workflow.service.spec.ts
```

## 3. 核心接口设计

### 3.1 Git 适配器接口

```typescript
// adapters/git-adapter.interface.ts

export interface GitAdapter {
  /** 测试连接 */
  testConnection(): Promise<ConnectionTestResult>;

  /** 获取 Issue 列表 */
  getIssues(options?: GetIssuesOptions): Promise<RemoteIssue[]>;

  /** 获取单个 Issue */
  getIssue(issueId: string): Promise<RemoteIssue>;

  /** 创建 Merge Request / Pull Request */
  createMergeRequest(params: CreateMRParams): Promise<MergeRequestResult>;

  /** 获取 Merge Request / Pull Request 状态 */
  getMergeRequestStatus(mrId: string): Promise<MRStatus>;

  /** 获取仓库分支列表 */
  getBranches(): Promise<Branch[]>;

  /** 获取默认分支 */
  getDefaultBranch(): Promise<string>;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  permissions?: string[];
}

export interface GetIssuesOptions {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
  perPage?: number;
  page?: number;
}

export interface RemoteIssue {
  id: string;
  number: number;
  title: string;
  description: string;
  state: string;
  labels: string[];
  assignees: string[];
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMRParams {
  sourceBranch: string;
  targetBranch: string;
  title: string;
  description?: string;
}

export interface MergeRequestResult {
  id: string;
  url: string;
  state: 'open' | 'merged' | 'closed';
}

export interface MRStatus {
  id: string;
  state: 'open' | 'merged' | 'closed' | 'unknown';
  mergeCommitSha?: string;
}

export interface Branch {
  name: string;
  isDefault: boolean;
  isProtected: boolean;
}
```

### 3.2 工作流策略接口

```typescript
// strategies/completion-strategy.interface.ts

import { PurfenceIssue } from '../../purfence/purfence-issue.entity';

export interface CompletionStrategy {
  /** 执行完成流程 */
  complete(issue: PurfenceIssue): Promise<CompletionResult>;

  /** 检查是否可以执行 */
  canComplete(issue: PurfenceIssue): Promise<boolean>;
}

export interface CompletionResult {
  success: boolean;
  issue: PurfenceIssue;
  message?: string;
  requiresManualAction?: boolean;
  nextState: string;
}
```

### 3.3 状态机接口

```typescript
// state-machine/issue-state-machine.ts

export interface StateTransition {
  from: string;
  to: string;
  condition: (context: TransitionContext) => boolean | Promise<boolean>;
  action?: (context: TransitionContext) => Promise<void>;
}

export interface TransitionContext {
  issue: PurfenceIssue;
  workflowConfig: WorkflowConfig;
  gitService: GitService;
}

export class IssueStateMachine {
  private transitions: StateTransition[] = [];

  registerTransition(transition: StateTransition): void;

  canTransition(from: string, to: string, context: TransitionContext): Promise<boolean>;

  transition(issue: PurfenceIssue, toState: string, context: TransitionContext): Promise<void>;
}
```

## 4. 核心算法与流程

### 4.1 Issue 同步流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sync Remote Issues Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐                                                    │
│  │  Start   │                                                    │
│  └────┬─────┘                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                             │
│  │ Get Project     │                                             │
│  │ Remote Config   │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────┐                        │
│  │ Check Token     │────►│  Decrypt    │                        │
│  │ Status          │     │  Token      │                        │
│  └────────┬────────┘     └─────────────┘                        │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ Create Adapter  │                                             │
│  │ (GitLab/GitHub) │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────┐     ┌─────────────┐    │
│  │ Call API        │────►│  Retry 3x   │────►│  Cache      │    │
│  │ Get Issues      │     │  on Fail    │     │  Results    │    │
│  └────────┬────────┘     └─────────────┘     └─────────────┘    │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ Filter Already  │                                             │
│  │ Imported Issues │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ Return to       │                                             │
│  │ Client          │                                             │
│  └─────────────────┘                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 协作模式完成流程

```
┌─────────────────────────────────────────────────────────────────┐
│              Collaborative Mode Completion Flow                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐                                                    │
│  │  Start   │                                                    │
│  │ Complete │                                                    │
│  │  Issue   │                                                    │
│  └────┬─────┘                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                             │
│  │ Get Workflow    │                                             │
│  │ Config          │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ Check Mode      │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│     ┌─────┴─────┐                                                │
│     │           │                                                │
│     ▼           ▼                                                │
│  ┌──────┐   ┌──────────┐                                         │
│  │ Stand│   │ Collabor │                                         │
│  │ alone│   │ ative    │                                         │
│  └──┬───┘   └────┬─────┘                                         │
│     │            │                                               │
│     ▼            ▼                                               │
│  ┌────────┐   ┌─────────────────┐                                │
│  │ Auto   │   │ Skip Auto       │                                │
│  │ Merge  │   │ Merge/Push      │                                │
│  │ & Push │   │                 │                                │
│  └──┬─────┘   └────────┬────────┘                                │
│     │                  │                                         │
│     ▼                  ▼                                         │
│  ┌────────┐   ┌─────────────────┐                                │
│  │ Status │   │ Status =        │                                │
│  │ = done │   │ needs_approval  │                                │
│  └────────┘   └────────┬────────┘                                │
│                        │                                         │
│                        ▼                                         │
│               ┌─────────────────┐                                │
│               │ Notify User     │                                │
│               │ (via WebSocket) │                                │
│               └────────┬────────┘                                │
│                        │                                         │
│                        ▼                                         │
│               ┌─────────────────┐                                │
│               │ Wait for Manual │                                │
│               │ Action          │                                │
│               └────────┬────────┘                                │
│                        │                                         │
│           ┌────────────┼────────────┐                           │
│           │            │            │                           │
│           ▼            ▼            ▼                           │
│      ┌────────┐   ┌────────┐   ┌────────┐                      │
│      │ Merge  │   │ Push   │   │ Create │                      │
│      │ to Main│   │ Remote │   │ MR/PR  │                      │
│      └───┬────┘   └───┬────┘   └───┬────┘                      │
│          │            │            │                            │
│          └────────────┴────────────┘                            │
│                     │                                            │
│                     ▼                                            │
│            ┌─────────────────┐                                   │
│            │ Status = done   │                                   │
│            └─────────────────┘                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 状态机状态流转

```
┌─────────────────────────────────────────────────────────────────┐
│                    State Machine Transitions                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Standalone Mode                        │   │
│  │                                                          │   │
│  │   ┌─────┐    ┌─────────┐    ┌─────────┐    ┌─────┐      │   │
│  │   │open │───►│ running │───►│ complete│───►│done │      │   │
│  │   └─────┘    └─────────┘    │ Issue() │    └─────┘      │   │
│  │                             │(auto     │                  │   │
│  │                             │ merge)   │                  │   │
│  │                             └─────────┘                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Collaborative Mode                      │   │
│  │                                                          │   │
│  │   ┌─────┐    ┌─────────┐    ┌─────────┐                  │   │
│  │   │open │───►│ running │───►│needs_   │                  │   │
│  │   └─────┘    └─────────┘    │approval │                  │   │
│  │                             └────┬────┘                  │   │
│  │                                  │                       │   │
│  │                    ┌─────────────┼─────────────┐          │   │
│  │                    │             │             │          │   │
│  │                    ▼             ▼             ▼          │   │
│  │              ┌─────────┐   ┌─────────┐   ┌─────────┐     │   │
│  │              │ manual  │   │ manual  │   │ create  │     │   │
│  │              │ merge() │   │ push()  │   │ MR/PR   │     │   │
│  │              └────┬────┘   └────┬────┘   └────┬────┘     │   │
│  │                   │             │             │          │   │
│  │                   └─────────────┴─────────────┘          │   │
│  │                                 │                        │   │
│  │                                 ▼                        │   │
│  │                           ┌─────────┐                    │   │
│  │                           │  done   │                    │   │
│  │                           └─────────┘                    │   │
│  │                                                          │   │
│  │   Alternative: MR/PR merged remotely                     │   │
│  │   ┌─────────┐    syncMRStatus()    ┌─────┐              │   │
│  │   │needs_   │─────────────────────►│done │              │   │
│  │   │approval │                      └─────┘              │   │
│  │   └─────────┘                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Token 加密/解密流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    Token Encryption Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Encryption:                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                 │
│  │ Raw      │────►│ AES-256  │────►│ Base64   │                 │
│  │ Token    │     │ Encrypt  │     │ Encode   │                 │
│  └──────────┘     └──────────┘     └──────────┘                 │
│                        │                                         │
│                        │ Key from env: REMOTE_GIT_ENCRYPTION_KEY│
│                        ▼                                         │
│                   ┌──────────┐                                   │
│                   │ Store in │                                   │
│                   │ Database │                                   │
│                   └──────────┘                                   │
│                                                                  │
│  Decryption:                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                 │
│  │ Encrypted│────►│ Base64   │────►│ AES-256  │                 │
│  │ Token    │     │ Decode   │     │ Decrypt  │                 │
│  └──────────┘     └──────────┘     └──────────┘                 │
│                        │                                         │
│                        │ Key from env: REMOTE_GIT_ENCRYPTION_KEY│
│                        ▼                                         │
│                   ┌──────────┐                                   │
│                   │ Use for  │                                   │
│                   │ API Call │                                   │
│                   └──────────┘                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 5. 数据库 Schema 变更

### 5.1 新增表

```sql
-- 远程仓库配置表
CREATE TABLE remote_repository_config (
    id VARCHAR(32) PRIMARY KEY,
    project_id VARCHAR(32) NOT NULL,
    type VARCHAR(16) NOT NULL CHECK (type IN ('gitlab', 'github')),
    url VARCHAR(512) NOT NULL,
    encrypted_token TEXT NOT NULL,
    default_branch VARCHAR(64) DEFAULT 'main',
    status VARCHAR(16) DEFAULT 'connected' CHECK (status IN ('connected', 'error', 'expired')),
    error_message TEXT,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id),
    FOREIGN KEY (project_id) REFERENCES purfence_project(id) ON DELETE CASCADE
);

-- 工作流配置表
CREATE TABLE workflow_config (
    id VARCHAR(32) PRIMARY KEY,
    project_id VARCHAR(32) NOT NULL,
    mode VARCHAR(16) DEFAULT 'standalone' CHECK (mode IN ('standalone', 'collaborative')),
    auto_create_issue BOOLEAN DEFAULT true,
    auto_merge BOOLEAN DEFAULT true,
    auto_push BOOLEAN DEFAULT true,
    require_manual_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id),
    FOREIGN KEY (project_id) REFERENCES purfence_project(id) ON DELETE CASCADE
);

-- 远程 Issue 关联表（可选，如果采用 JSON 列则不需要）
CREATE TABLE remote_issue_reference (
    id VARCHAR(32) PRIMARY KEY,
    issue_id VARCHAR(32) NOT NULL,
    remote_issue_id VARCHAR(64) NOT NULL,
    remote_issue_number INT NOT NULL,
    remote_url VARCHAR(512) NOT NULL,
    remote_state VARCHAR(32) NOT NULL,
    synced_data JSON,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(issue_id),
    FOREIGN KEY (issue_id) REFERENCES purfence_issue(id) ON DELETE CASCADE
);
```

### 5.2 现有表变更

```sql
-- purfence_issue 表扩展
ALTER TABLE purfence_issue
    ADD COLUMN branch_suffix VARCHAR(8) NULL,  -- 6位随机后缀
    ADD COLUMN remote_issue_data JSON NULL;    -- 远程 issue 关联信息

-- purfence_project 表扩展（可选，如果采用独立配置表）
-- 建议保持现有结构不变，通过关联表扩展
```

## 6. 依赖包建议

### 6.1 必需依赖

```json
{
  "dependencies": {
    "@octokit/rest": "^20.0.2",           // GitHub API 客户端
    "@gitbeaker/rest": "^40.0.0",          // GitLab API 客户端
    "axios": "^1.6.0",                     // HTTP 客户端（已存在）
    "axios-retry": "^4.0.0"                // 请求重试（已存在）
  }
}
```

### 6.2 可选依赖

```json
{
  "dependencies": {
    "octokit-webhooks": "^12.0.0",         // Webhook 处理（P2）
    "bullmq": "^5.0.0"                     // 任务队列（P2，用于自动同步）
  }
}
```

## 7. 配置项

### 7.1 环境变量

```bash
# Token 加密密钥（必需）
REMOTE_GIT_ENCRYPTION_KEY=<32-byte-base64-encoded-key>

# API 超时配置（可选，有默认值）
REMOTE_GIT_API_TIMEOUT_MS=30000
REMOTE_GIT_API_RETRY_COUNT=3
REMOTE_GIT_API_RETRY_DELAY_MS=1000

# 缓存配置（可选）
REMOTE_GIT_CACHE_TTL_SEC=300

# Webhook 密钥（P2）
GITLAB_WEBHOOK_SECRET=
GITHUB_WEBHOOK_SECRET=
```

### 7.2 运行时配置

```typescript
// 默认工作流配置
const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  mode: 'standalone',
  autoCreateIssue: true,
  autoMerge: true,
  autoPush: true,
  requireManualApproval: false,
};

// GitLab 配置
const GITLAB_CONFIG = {
  apiVersion: 'v4',
  timeout: 30000,
  retryCount: 3,
};

// GitHub 配置
const GITHUB_CONFIG = {
  apiVersion: '2022-11-28',
  timeout: 30000,
  retryCount: 3,
};
```

## 8. 风险评估与应对策略

### 8.1 技术风险

| 风险 | 影响 | 可能性 | 应对策略 |
|------|------|--------|----------|
| GitLab/GitHub API 变更 | 高 | 中 | 1. 封装适配器层，隔离 API 变化<br>2. 编写集成测试，及时发现不兼容问题<br>3. 关注官方变更日志 |
| Token 泄露 | 高 | 低 | 1. AES-256 加密存储<br>2. 服务端代理所有 API 调用<br>3. 支持 Token 轮换机制<br>4. 日志脱敏处理 |
| API 限流 | 中 | 高 | 1. 实现请求队列和限流控制<br>2. 使用缓存减少重复请求<br>3. 指数退避重试策略<br>4. 友好的错误提示 |
| 网络不稳定 | 中 | 中 | 1. 3 次重试机制<br>2. 超时配置<br>3. 断路器模式（可选） |
| Git 操作冲突 | 中 | 中 | 1. 协作模式保留 worktree 供人工解决<br>2. 冲突检测和提示<br>3. 天机团队处理简单冲突 |

### 8.2 业务风险

| 风险 | 影响 | 可能性 | 应对策略 |
|------|------|--------|----------|
| 用户误操作合并 | 中 | 中 | 1. 二次确认弹窗<br>2. 可配置 requireManualApproval<br>3. 操作日志记录 |
| 多人同时开发同一 issue | 中 | 低 | 1. 分支名添加随机后缀避免冲突<br>2. 冲突检测机制<br>3. 明确的协作规范提示 |
| MR/PR 状态不一致 | 低 | 中 | 1. 提供手动同步按钮<br>2. 清晰的 UI 状态展示<br>3. 操作日志 |

### 8.3 技术难点

#### 难点 1：Token 安全管理
**问题**：Access Token 需要加密存储，但需要在服务端解密后使用。

**解决方案**：
```typescript
// 使用现有的 CryptoUtil 封装 TokenService
@Injectable()
export class TokenService {
  private readonly crypto: CryptoUtil;

  constructor(private configService: ConfigService) {
    const key = this.configService.get('REMOTE_GIT_ENCRYPTION_KEY');
    this.crypto = new CryptoUtil('aes-256-cbc', key, iv);
  }

  encrypt(token: string): string {
    return this.crypto.encrypt(token);
  }

  decrypt(encryptedToken: string): string {
    return this.crypto.decrypt(encryptedToken);
  }
}
```

#### 难点 2：Git 适配器抽象
**问题**：GitLab 和 GitHub API 差异较大，需要统一接口。

**解决方案**：
- 使用适配器模式，定义统一的 `GitAdapter` 接口
- 分别实现 `GitLabAdapter` 和 `GitHubAdapter`
- 使用工厂模式根据配置创建对应适配器

#### 难点 3：工作流策略切换
**问题**：单机模式和协作模式的完成流程差异大。

**解决方案**：
- 使用策略模式，定义 `CompletionStrategy` 接口
- 分别实现 `StandaloneCompletionStrategy` 和 `CollaborativeCompletionStrategy`
- 根据工作流配置动态选择策略

#### 难点 4：状态机实现
**问题**：Issue 状态流转需要严格的规则控制。

**解决方案**：
- 实现轻量级状态机
- 注册状态转换规则
- 在转换前检查条件，转换后执行动作

## 9. 测试策略

### 9.1 单元测试

```typescript
// 适配器测试
describe('GitLabAdapter', () => {
  it('should test connection successfully', () => {});
  it('should handle token expiration', () => {});
  it('should fetch issues with pagination', () => {});
});

// 工作流策略测试
describe('CollaborativeCompletionStrategy', () => {
  it('should not auto merge when autoMerge is false', () => {});
  it('should set status to needs_approval', () => {});
});
```

### 9.2 集成测试

```typescript
// 完整流程测试
describe('Remote Git Integration', () => {
  it('should sync remote issues and import one', async () => {});
  it('should complete issue in collaborative mode', async () => {});
  it('should create MR and sync status', async () => {});
});
```

## 10. 部署注意事项

1. **环境变量配置**：确保 `REMOTE_GIT_ENCRYPTION_KEY` 已设置
2. **数据库迁移**：执行新增表的 migration
3. **网络访问**：确保服务器可以访问 GitLab/GitHub API
4. **监控**：添加远程 API 调用指标的监控
5. **日志**：确保敏感信息（Token）不会输出到日志

## 11. 未来扩展点

1. **多远程仓库支持**：将 `project_id` 的唯一约束改为支持多仓库
2. **Webhook 实时同步**：添加 Webhook 处理器，实时更新 issue 状态
3. **自动同步定时任务**：使用 BullMQ 实现定时同步
4. **代码审查集成**：与 GitLab/GitHub 的 Code Review 功能集成
5. **更多 Git 提供商**：支持 Bitbucket、Gitee 等
