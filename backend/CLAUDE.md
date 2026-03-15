# CLAUDE.md (backend agent guidance)

This file provides guidance for coding agents working under `backend/`.

## Critical rules (read before writing code)

Before writing ANY new code, you MUST:

1. Find and read similar existing code in the same module/directory
2. Copy exact import patterns (use the same aliases/paths as existing files)
3. Follow existing structure precisely (decorators, module wiring, file naming)
4. Never guess or assume (read the actual base classes and utilities)

## Common mistakes to avoid

- Do NOT add connection names to TypeORM decorators or module registration.
  - This repo is organized as a single DB connection usage.
  - Never write `@InjectRepository(Entity, 'ai')` or `TypeOrmModule.forFeature([...], 'ai')`.
- Do NOT create Java-style folder structure.
  - No `controllers/`, `services/`, `entities/` folders.
  - Keep files flat in the module directory.
- Do NOT use wrong imports.
  - Follow existing aliases (e.g. entities should import `BaseEntity` from `@app/shared` if that’s the established pattern).
- Do NOT make assumptions about GraphQL decorators.
  - Check existing entities: don’t add `@ObjectType` / `@Field` unless needed.

## Error handling

- Avoid try-catch abuse.
- Only catch errors you can handle.
- Prefer letting Nest exception filters handle unexpected errors.

## Commands (run only when appropriate)

If services are already running in your environment, do not start/stop them from an agent; ask the user first.

Common backend commands:

- Dev: `npm -w backend run start:dev`
- Build: `npm -w backend run build`
- Lint: `npm -w backend run lint`
- Format: `npm -w backend run format`
- Test: `npm -w backend run test`
- E2E: `npm -w backend run test:e2e`

## Notes

- Entity creation checklist lives at `.claude/commands/create-entity.md`.

## GraphQL / Pagination limits

- `nestjs-query` 列表查询对 `paging.limit` 有上限校验（当前最大值为 `50`）。
- 前端调用时 `limit` 不要超过 `50`；如需更多数据，使用分页（offset/limit）逐页拉取。
- 详见 `docs/conventions.md`。

## BullMQ Processors

- 使用 BullMQ 时，继承 `BaseProcessor` 或 `BaseRepeatProcessor`。
- 详见 `docs/bullmq-processors.md`。

## Transaction Management

### 事务处理规范

本项目统一使用声明式事务管理，遵循以下规则：

#### ✅ 推荐做法

- **使用 `@Transactional()` 注解**：从 `typeorm-transactional` 导入并使用

  ```typescript
  import { Transactional } from 'typeorm-transactional';

  @Transactional()
  async myMethod(): Promise<void> {
    // 事务内的数据库操作
  }
  ```

- **保持方法为 public**：由于 `@Transactional()` 依赖 AOP 代理，在 `private` 方法上不生效

  ```typescript
  // ✅ 正确
  @Transactional()
  async deleteIssueRecords(issueId: string): Promise<void> { }

  // ❌ 错误 - 注解不会生效
  @Transactional()
  private async deleteIssueRecords(issueId: string): Promise<void> { }
  ```

#### ❌ 禁止做法

- **禁止使用编程式事务**：不要直接使用 `dataSource.transaction()` 或 `manager.transaction()`
  ```typescript
  // ❌ 禁止
  await this.dataSource.transaction(async (manager) => {
    await manager.delete(Entity, { id });
  });
  ```

#### 事务边界设计原则

1. **事务内只包含数据库操作**：外部资源（如文件系统、Git 操作、API 调用）应在事务外处理
2. **事务粒度适中**：避免过大事务，保持事务内逻辑简洁
3. **异常自动回滚**：`@Transactional()` 默认在抛出异常时自动回滚

#### 示例

```typescript
async deleteIssue(issueId: string): Promise<string> {
  // 阶段1: 前置校验（事务外）
  const issue = await this.validateIssueForDelete(issueId);

  // 阶段2: 外部资源清理（事务外）
  await this.cleanupConversations(issueId);
  await this.cleanupGitResources(issue);

  // 阶段3: 数据库删除（事务内）
  await this.deleteIssueRecords(issueId);

  return issueId;
}

@Transactional()
async deleteIssueRecords(issueId: string): Promise<void> {
  // 事务内的数据库操作
  await PurfenceExecution.delete({ issueId });
  await PurfenceIssue.delete({ id: issueId });
}
```
