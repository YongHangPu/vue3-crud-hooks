# 贡献指南

感谢你愿意为 `vue3-crud-hooks` 做出贡献。

本项目欢迎以下形式的贡献：

- 提交 Bug 反馈与使用问题
- 提交功能建议与 API 优化建议
- 改进文档、示例与测试
- 修复问题或新增能力并提交 Pull Request

## 开始之前

在开始贡献前，建议先阅读以下内容：

- `README.md`
- `docs/`
- `src/`
- `tests/`

如果你准备提交较大的改动，建议先创建 Issue 说明背景、目标和方案，避免重复开发。

## 本地开发

### 环境要求

- Node.js 18 及以上
- `pnpm`

### 安装依赖

```bash
pnpm install
```

### 常用命令

```bash
pnpm build
pnpm test
pnpm test:run
pnpm test:coverage
pnpm docs:dev
pnpm docs:build
```

## 分支与提交建议

建议从最新的默认分支拉取代码后，新建功能分支进行开发，例如：

```bash
git checkout -b feat/xxx
git checkout -b fix/xxx
git checkout -b docs/xxx
```

提交信息建议尽量清晰，推荐使用以下前缀：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `test`: 测试相关
- `refactor`: 重构
- `chore`: 工程配置或杂项调整

示例：

```bash
git commit -m "feat: support custom table action rendering"
git commit -m "fix: correct pagination reset behavior"
git commit -m "docs: improve useCrudPage example"
```

## Pull Request 规范

提交 Pull Request 前，请尽量确保以下内容：

- 改动目标明确，避免在同一个 PR 中混入无关修改
- 已完成本地构建与测试，至少保证相关命令可正常运行
- 如果改动涉及公开 API，请同步更新文档或示例
- 如果改动涉及行为变化，请补充必要说明
- 如果修复了已有 Issue，可在 PR 描述中关联对应 Issue

建议在 PR 描述中包含：

- 改动背景
- 主要修改点
- 使用方式或影响范围
- 测试说明

## Issue 反馈建议

提交 Issue 时，建议尽量提供以下信息：

- 使用场景
- 复现步骤
- 期望行为
- 实际行为
- 运行环境信息
- 最小复现代码或截图

信息越完整，越有助于更快定位问题。

## 文档与示例

如果你修改了以下内容，建议同步更新文档：

- `src/hooks/` 中的公开 Hook
- `src/components/` 中的公开组件
- 对外暴露的类型定义
- 示例代码与 API 使用方式

相关文档主要位于：

- `README.md`
- `docs/hooks/`
- `docs/examples/`

## 测试建议

对于行为修复、逻辑调整或新增能力，建议补充或更新对应测试，测试文件位于 `tests/` 目录。

如果某项改动暂时无法补充自动化测试，请在 PR 中说明验证方式与潜在影响范围。

## 行为准则

参与本项目即表示你同意遵守 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) 中定义的社区行为准则。

再次感谢你的贡献。
