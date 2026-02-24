# Idea

## 需求描述（原文）

**标题**：修复需求状态判断 - 完成时标记状态，天府评估时读取状态

## 问题

当前 `issue.json` 只有 `issueId` 和 `createdAt`，没有状态字段。导致天府评估时，刚创建的需求和已完成的需求无法区分，造成误判。

## 解决方案

### 1. 修改完成需求工具
当 AI 调用完成需求（`completeIssue`）时，更新 `issue.json`，添加状态标记：

```json
{
  "issueId": "86z2cm3femf4c1",
  "createdAt": "2026-02-24T00:21:58.120Z",
  "status": "completed",
  "completedAt": "2026-02-24T10:30:00.000Z"
}
```

### 2. 修改天府评估逻辑
天府评估是否有未完成需求时：
- 读取每个 `issue.json`
- 检查 `status` 字段
- `status === "completed"` → 算已完成，跳过
- 没有 `status` 或 `status !== "completed"` → 算进行中，加入待处理列表

## 涉及文件

- 完成需求工具相关代码（更新 issue.json）
- 天府评估逻辑相关代码（读取 issue.json 判断状态）

## 验收标准

- [ ] 完成需求时，自动更新 issue.json 添加 `status: "completed"`
- [ ] 天府评估时，正确识别已完成的需求（有 status: completed）
- [ ] 天府评估时，正确识别进行中的需求（无 status 或 status !== completed）
- [ ] 评估结果准确，不再误判

## 优先级

**P1（中优先级）** - 修复评估准确性
