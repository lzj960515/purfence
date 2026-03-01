# Idea

## 需求描述（原文）

**标题**：修复 Windows onboarding Node 环境检测问题

## 问题描述

Windows 启动时 onboarding 流程中，Node.js 环境检测存在问题：

**现象**：
1. 已经安装了 Node.js
2. 在 PowerShell 中可以正常运行 `node -v`
3. 但是 onboarding 环境检查显示 Node 未安装
4. 点击安装按钮后，又显示已安装，尝试升级
5. 因为已经是最新版本，升级失败
6. 卡在这一步无法继续

## 复现步骤

1. Windows 系统
2. 已安装 Node.js（在 PowerShell 可以运行 `node -v`）
3. 启动 Purfence，进入 onboarding
4. 环境检查步骤显示 Node 未安装
5. 点击安装 → 显示已安装并尝试升级 → 升级失败 → 卡住

## 可能的原因

1. **PATH 环境变量问题**：
   - Node 可能只在用户 PATH 中，不在系统 PATH 中
   - Electron 应用的环境变量可能与 PowerShell 不同

2. **Node 安装方式问题**：
   - 通过 nvm-windows 安装的 Node
   - 通过其他包管理器（chocolatey, scoop）安装的 Node
   - 官方安装包安装的 Node

3. **检测逻辑问题**：
   - 检测 Node 的方式可能在某些情况下不准确
   - 升级检测和安装检测逻辑冲突

## 期望行为

1. 如果 PowerShell 能运行 `node -v`，onboarding 也应该能检测到
2. 检测到已安装时，不应该进入升级流程
3. 如果检测失败，应该提供跳过或手动指定的选项
4. 不应该卡住，应该有继续或跳过的选项

## 验收标准

- [ ] 已安装 Node 时能正确检测到（PowerShell 能运行 `node -v` 的情况下）
- [ ] 检测到已安装时，不尝试升级
- [ ] 检测失败时提供跳过或手动指定路径的选项
- [ ] 不会卡在 Node 检测步骤
- [ ] 支持不同的 Node 安装方式（nvm、官方安装包、包管理器）

## 优先级

**P0（高优先级）** - 阻塞 Windows 用户使用
