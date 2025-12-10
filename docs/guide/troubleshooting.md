---
title: 常见错误与排查
---

# 常见错误与排查

## 预览容器路径错误

- 现象：报错 ENOENT，找不到 `TablePageDemo.vue`
- 处理：`demo-preview` 路径写相对当前文档，如 `../examples/demos/TablePageDemo.vue`

## await-to-js 导入失败

- 现象：`Failed to resolve import "await-to-js"`
- 处理：使用默认导入 `import to from 'await-to-js'`，并在 `docs/.vitepress/config.mts` 的 `optimizeDeps.include` 加入 `await-to-js`

## 自动导入失效

- 现象：`ElMessage` 或 Vue API 未找到
- 处理：确认 `unplugin-auto-import` 与 `unplugin-vue-components` 已在 `docs/.vitepress/config.mts` 配置；重新启动 `pnpm run docs:dev`

## Element Plus 样式未加载

- 现象：组件样式缺失
- 处理：在主题入口 `docs/.vitepress/theme/index.ts` 引入 `element-plus/dist/index.css` 并 `app.use(ElementPlus)`

## 导出字段不一致

- 现象：后端导出参数解析错误
- 处理：在 `useTablePage` 的 `exportConfig` 中设置 `arrayFields/timeFields/idKey`，保持与后端一致

