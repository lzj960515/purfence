---
name: product-artifacts
description: |
  产品工件目录结构和文件模板。用于创建、补全产品需求文档（PRD）、信息架构（IA）、验收标准等产品工件。

  Use this skill when:
  - 需要创建产品工件目录结构（.project-genesis/）
  - 需要了解产品工件的文件格式和模板
  - 需要补全或修改 PRD、IA、验收标准等文档
  - PM 或 product-manager agent 在处理产品需求时
---

# Product Artifacts

本 skill 定义了产品工件的目录结构和文件模板。

## 目录结构

```
.project-genesis/
├── inputs/              # 输入（系统生成）
│   ├── idea.md          # 原始需求
│   └── user_answers.md  # 用户回答
├── artifacts/           # 产物（PM 产出）
│   ├── prd.md           # 产品需求文档
│   ├── ia.md            # 信息架构
│   ├── acceptance.md    # 验收标准
│   └── open_questions.md # 开放问题
├── meta/                # 元数据（系统管理）
│   └── issue.json
└── attachments/         # 附件
```

## 工作流程

1. **读取 inputs/**：理解用户的原始需求
2. **产出 artifacts/**：根据需求写 PRD、IA、验收标准
3. **记录 open_questions.md**：真正需要用户澄清的问题

## 文件模板

根据需要读取对应的模板文件：

| 文件 | 模板位置 |
|-----|---------|
| prd.md | [references/prd.md](references/prd.md) |
| ia.md | [references/ia.md](references/ia.md) |
| acceptance.md | [references/acceptance.md](references/acceptance.md) |
| open_questions.md | [references/open_questions.md](references/open_questions.md) |
| inputs/* | [references/inputs.md](references/inputs.md) |

## ID 规则

| 类型 | 格式 | 示例 |
|-----|------|------|
| 功能点 | F + 数字 | F1, F2, F3 |
| 页面 | P + 数字 | P1, P2, P3 |
| 验收标准 | AC + 数字 | AC1, AC2, AC3 |
| 开放问题 | Q + 数字 | Q1, Q2, Q3 |

## 质量标准

### 缺陷分级

| 级别 | 说明 |
|-----|-----|
| blocking | 阻断，下游无法开工 |
| major | 重要，增加返工风险 |
| minor | 建议，质量改进项 |

### 通过条件

- blocking 缺陷 = 0
- 所有 blocking 开放问题已回答

## 核心原则

- 面向下游 AI（设计师、开发者）直接执行
- 清晰无歧义，一次输出下游直接开工
- open_questions 只放真正 blocking 的问题
