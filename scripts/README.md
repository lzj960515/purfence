# 发布命令使用指南

## 快速发布

```bash
# 发布新版本（自动更新版本号、创建标签、推送）
npm run release 0.4.16

# 预览发布过程（不执行任何操作）
npm run release:check 0.4.16
```

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run release <version>` | 完整的发布流程 |
| `npm run release:check <version>` | 干运行预览 |
| `npm run release:sync-version <version>` | 仅同步版本号 |

## 详细文档

查看 [发布指南](../docs/release-guide.md) 了解：
- 完整的发布流程
- 版本号规范
- CI/CD 自动化
- 常见问题解决

## 示例

### 发布正式版本
```bash
npm run release 0.4.16
```

### 发布预发布版本
```bash
npm run release 0.5.0-beta.1
```

### 干运行测试
```bash
npm run release:check 1.0.0
```
