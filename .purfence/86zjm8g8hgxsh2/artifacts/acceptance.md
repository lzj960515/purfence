# 验收标准（Acceptance Criteria）

## F1: 远程仓库配置管理

### AC1: 成功配置 GitLab 远程仓库

- **Given**: 用户已创建 Purfence 项目
- **When**: 用户输入 GitLab 仓库 URL 和 Access Token 并保存
- **Then**:
  - 系统验证连接成功
  - 配置保存到数据库（Token 加密存储）
  - 项目显示远程仓库已连接

### AC2: 成功配置 GitHub 远程仓库

- **Given**: 用户已创建 Purfence 项目
- **When**: 用户输入 GitHub 仓库 URL 和 Access Token 并保存
- **Then**:
  - 系统验证连接成功
  - 配置保存到数据库（Token 加密存储）
  - 项目显示远程仓库已连接

### AC3: 配置验证失败处理

- **Given**: 用户输入了无效的 Token
- **When**: 用户尝试保存配置
- **Then**:
  - 系统返回错误信息"无法连接到远程仓库，请检查 Token 是否有效"
  - 配置不保存
  - 显示重试按钮

### AC4: Token 加密存储验证

- **Given**: 用户已配置远程仓库
- **When**: 直接查询数据库
- **Then**:
  - Token 字段为加密后的密文
  - 无法直接读取原始 Token

### AC5: 更新远程仓库配置

- **Given**: 用户已配置远程仓库
- **When**: 用户修改仓库 URL 或 Token
- **Then**:
  - 新配置验证通过后保存
  - 旧配置被覆盖
  - 同步状态重置

### AC6: 删除远程仓库配置

- **Given**: 用户已配置远程仓库
- **When**: 用户删除远程仓库配置
- **Then**:
  - 配置从数据库删除
  - 已导入的远程 issue 保留但标记为"未关联"
  - 项目恢复为无远程仓库状态

## F2: 远程 Issue 同步

### AC7: 成功获取远程 issue 列表

- **Given**: 项目已配置有效的远程仓库
- **When**: 用户点击"同步远程 Issue"
- **Then**:
  - 系统调用远程 API 获取 issue 列表
  - 显示 issue 列表（title、number、state、labels）
  - 已导入的 issue 标记为"已导入"

### AC8: 成功导入单个远程 issue

- **Given**: 用户正在查看远程 issue 列表
- **When**: 用户选择一个未导入的 issue 并点击"导入"
- **Then**:
  - 创建 Purfence issue
  - issue.origin 为 "remote"
  - 关联 remoteIssue 信息
  - 状态为 "open"
  - 显示在 Purfence issue 列表

### AC9: 防止重复导入

- **Given**: 用户已导入远程 issue #123
- **When**: 用户再次尝试导入同一个远程 issue
- **Then**:
  - 系统提示"该 issue 已导入"
  - 不创建重复 issue
  - 跳转到已存在的 issue

### AC10: 远程 issue 字段正确映射

- **Given**: 用户导入远程 issue
- **When**: 查看导入后的 Purfence issue
- **Then**:
  - title 与远程一致
  - description 与远程一致
  - labels 存储在 remoteIssue.syncedData.labels
  - remoteUrl 指向原始 issue

### AC11: 空状态处理

- **Given**: 远程仓库没有任何 issue
- **When**: 用户点击"同步远程 Issue"
- **Then**:
  - 显示"远程仓库暂无 issue"
  - 提供"刷新"按钮

### AC12: API 调用失败处理

- **Given**: 远程 API 暂时不可用
- **When**: 用户点击"同步远程 Issue"
- **Then**:
  - 显示错误信息"无法获取远程 issue，请稍后重试"
  - 提供"重试"按钮
  - 记录错误日志

### AC12a: 远程 Issue 单向导入策略

- **Given**: 用户已导入远程 issue #123
- **Given**: 远程 issue #123 的标题在导入后被修改
- **When**: 系统执行任何操作
- **Then**:
  - Purfence issue 的标题保持导入时的值不变
  - 不自动同步远程 issue 的变更
  - 如需更新，用户需手动重新导入

## F3: 工作流配置

### AC13: 默认配置验证

- **Given**: 新项目未配置工作流
- **When**: 查看工作流配置
- **Then**:
  - mode 为 "standalone"
  - autoMerge 为 true
  - autoPush 为 true
  - requireManualApproval 为 false

### AC14: 切换到协作模式

- **Given**: 项目当前为单机模式
- **When**: 用户将 mode 改为 "collaborative"
- **Then**:
  - autoMerge 自动变为 false
  - autoPush 自动变为 false
  - requireManualApproval 自动变为 true
  - 配置保存成功

### AC15: 自定义配置

- **Given**: 用户在项目设置页面
- **When**: 用户修改 autoMerge 为 false，其他保持默认
- **Then**:
  - 仅 autoMerge 变为 false
  - autoPush 保持 true
  - 配置保存成功

### AC16: 配置持久化

- **Given**: 用户已修改工作流配置
- **When**: 重新打开项目设置
- **Then**:
  - 显示上次保存的配置
  - 配置值正确

## F4: 协作模式完成流程

### AC17: 协作模式下完成进入待审批状态

- **Given**: 项目配置为协作模式（autoMerge: false）
- **Given**: Issue 正在运行中
- **When**: 天机团队调用 completeIssue
- **Then**:
  - issue 状态变为 "needs_approval"
  - 不执行合并操作
  - 不执行推送操作
  - worktree 保留
  - 发送通知给用户

### AC18: 手动合并成功

- **Given**: issue 状态为 "needs_approval"
- **Given**: worktree 存在且无冲突
- **When**: 用户点击"合并到 main"
- **Then**:
  - 执行 git merge
  - issue 状态变为 "done"
  - 显示合并成功提示

### AC19: 手动合并冲突处理

- **Given**: issue 状态为 "needs_approval"
- **Given**: worktree 与 main 有冲突
- **When**: 用户点击"合并到 main"
- **Then**:
  - 显示冲突信息
  - 提示用户手动解决冲突
  - issue 状态保持 "needs_approval"

### AC20: 手动推送成功

- **Given**: issue 已合并到 main
- **Given**: 项目配置 autoPush: false
- **When**: 用户点击"推送到远程"
- **Then**:
  - 执行 git push
  - 显示推送成功提示
  - 更新远程分支状态

### AC21: 单机模式自动完成

- **Given**: 项目配置为单机模式（autoMerge: true, autoPush: true）
- **Given**: Issue 正在运行中
- **When**: 天机团队调用 completeIssue
- **Then**:
  - 自动合并到 main
  - 自动推送到远程
  - issue 状态变为 "done"
  - worktree 被清理

### AC22: 发起 Merge Request

- **Given**: issue 状态为 "needs_approval"
- **Given**: 项目配置了 GitLab 远程仓库
- **When**: 用户点击"发起 MR"
- **Then**:
  - 调用 GitLab API 创建 MR
  - 显示 MR URL
  - issue 状态保持 "needs_approval"
  - 记录 MR ID 用于后续状态同步

### AC23: 发起 Pull Request

- **Given**: issue 状态为 "needs_approval"
- **Given**: 项目配置了 GitHub 远程仓库
- **When**: 用户点击"发起 PR"
- **Then**:
  - 调用 GitHub API 创建 PR
  - 显示 PR URL
  - issue 状态保持 "needs_approval"
  - 记录 PR ID 用于后续状态同步

### AC23a: 同步 MR/PR 状态 - 已合并

- **Given**: issue 状态为 "needs_approval"
- **Given**: 已发起 MR/PR 且已在远程合并
- **When**: 用户点击"同步远程状态"
- **Then**:
  - 调用远程 API 查询 MR/PR 状态
  - 检测到状态为 "merged"
  - issue 状态自动变为 "done"
  - 显示"MR/PR 已合并，issue 状态已更新"

### AC23b: 同步 MR/PR 状态 - 未合并

- **Given**: issue 状态为 "needs_approval"
- **Given**: 已发起 MR/PR 但尚未合并
- **When**: 用户点击"同步远程状态"
- **Then**:
  - 调用远程 API 查询 MR/PR 状态
  - 检测到状态为 "open"
  - issue 状态保持 "needs_approval"
  - 显示"MR/PR 状态: open，请等待合并"

## F5: 远程分支同步

### AC24: 基于远程分支创建 worktree

- **Given**: 项目已配置远程仓库
- **Given**: 存在远程分支 "feature/login"
- **When**: 用户基于远程 issue 启动开发
- **Then**:
  - 同步远程分支到本地
  - 基于远程分支创建 worktree
  - worktree 包含远程分支最新代码

### AC25: Worktree 命名规则

- **Given**: 远程 issue #123，标题 "fix login bug"
- **Given**: Purfence issue ID 为 "86zjm8g8hgxsh2"
- **Given**: 生成的随机后缀为 "a3f9k2"
- **When**: 创建 worktree
- **Then**:
  - 分支名为 "issue/86zjm8g8hgxsh2-a3f9k2"
  - 目录名为 "worktrees/123-fix-login-bug"
  - 随机后缀为 6 位字母数字组合

### AC26: 远程分支不存在处理

- **Given**: 用户尝试基于不存在的远程分支创建 worktree
- **When**: 系统尝试同步分支
- **Then**:
  - 从 defaultBranch 创建新分支
  - 显示提示"远程分支不存在，已从 main 创建新分支"

### AC27: 同步特定远程分支

- **Given**: 用户指定要同步的远程分支名
- **When**: 启动 issue
- **Then**:
  - 检出指定远程分支
  - 创建基于该分支的 worktree

## F6: Issue 字段同步（P1）

### AC28: Labels 同步

- **Given**: 远程 issue 有 labels ["bug", "urgent"]
- **When**: 导入到 Purfence
- **Then**:
  - labels 存储在 remoteIssue.syncedData.labels
  - 显示在 issue 详情页

### AC29: Assignees 同步

- **Given**: 远程 issue 有 assignees
- **When**: 导入到 Purfence
- **Then**:
  - assignees 存储在 remoteIssue.syncedData.assignees
  - 显示在 issue 详情页

### AC30: Comments 同步

- **Given**: 远程 issue 有 comments
- **When**: 导入到 Purfence
- **When**: 用户查看 issue 详情
- **Then**:
  - comments 显示在"远程评论"区域
  - 标记为只读

## 错误处理

### AC31: Access Token 过期处理

- **Given**: 配置的 Access Token 已过期
- **When**: 系统尝试调用远程 API
- **Then**:
  - 返回错误"Access Token 已过期，请重新配置"
  - 标记远程仓库状态为 "expired"
  - 提供"更新 Token"入口

### AC32: 权限不足处理

- **Given**: Token 权限不足（无法创建 MR）
- **When**: 用户尝试发起 MR
- **Then**:
  - 返回错误"权限不足，需要 api 权限"
  - 显示权限配置指南

### AC33: 网络超时处理

- **Given**: 网络连接不稳定
- **When**: 调用远程 API 超时
- **Then**:
  - 自动重试 3 次
  - 最终失败后显示"连接超时，请检查网络"
  - 提供"重试"按钮

### AC34: 远程仓库删除处理

- **Given**: 远程仓库已被删除
- **When**: 系统尝试同步
- **Then**:
  - 返回错误"远程仓库不存在"
  - 标记配置为错误状态
  - 提示用户更新或删除配置

## 集成测试

### AC35: 完整单机模式流程

- **Given**: 项目配置为单机模式
- **Given**: 已导入远程 issue
- **When**:
  1. 启动 issue
  2. 天机团队完成工作
  3. 调用 completeIssue
- **Then**:
  1. worktree 创建成功
  2. 代码提交到分支
  3. 自动合并到 main
  4. 自动推送到远程
  5. issue 状态为 done

### AC36: 完整协作模式流程（手动合并）

- **Given**: 项目配置为协作模式
- **Given**: 已导入远程 issue
- **When**:
  1. 启动 issue
  2. 天机团队完成工作
  3. 调用 completeIssue
  4. 用户手动合并
  5. 用户手动推送
- **Then**:
  1. worktree 创建成功
  2. 代码提交到分支
  3. issue 状态变为 needs_approval
  4. 用户收到通知
  5. 合并后状态变为 done
  6. 推送后远程分支更新

### AC36a: 完整协作模式流程（MR/PR 合并同步）

- **Given**: 项目配置为协作模式
- **Given**: 已导入远程 issue
- **When**:
  1. 启动 issue
  2. 天机团队完成工作
  3. 调用 completeIssue
  4. 用户发起 MR/PR
  5. MR/PR 在远程被合并
  6. 用户点击"同步远程状态"
- **Then**:
  1. worktree 创建成功
  2. 代码提交到分支
  3. issue 状态变为 needs_approval
  4. 用户收到通知
  5. MR/PR 创建成功
  6. 同步后检测到 MR/PR 已合并
  7. issue 状态变为 done

### AC37: 多人协作场景

- **Given**: 项目配置为协作模式
- **Given**: 多个用户同时使用 Purfence
- **When**: 两个用户同时操作不同 issue
- **Then**:
  - 各 issue 独立处理
  - 无状态冲突
  - Git 操作正确执行
