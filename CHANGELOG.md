# Changelog

## [1.1.0]

### 新功能

- **新增 `useTableHeight`**:表格自适应高度 Hook,配合 `CustomTable` + `Pagination` 实现表格填满视口剩余空间(表格内部滚动、分页器固定底部),包含纯函数 `calculateTableMaxHeight`,支持 `minHeight` / `extraGap` / `containerRef` / `watchSources` 配置
- **响应适配层**:新增 `isSuccess`(业务码校验,默认识别 `code ∈ [0, 200, 1, '0', '200', '1']`)与 `transformResponse`(自定义列表响应解析)配置,支持 `{ code, data: { records, total } }` 嵌套包装响应,HTTP 200 但业务失败不再误报「成功」
- **`FormDialogConfig.initialData`**:新增推荐命名,兼容旧名 `initialFormData`

### Bug 修复

- 分页配置为对象时,用户静态 `pageSize`/`currentPage` 不再覆盖运行时动态值(修复分页与数据错位)
- 配置 `onDeleteSuccess`/`onBatchDeleteSuccess` 时不再自动回退页码,避免页码与数据不一致
- `setTableColumns` 动态更新列配置在已渲染后仍生效(customTableConfig 转为响应式)
- 列表请求竞态防护:快速搜索/翻页时旧响应不再覆盖新数据
- 编辑回显缺少主键字段时给出提示,不再把整个 row 对象当 id 请求
- `Pagination` 修改每页条数超出总页数时,事件携带重置后的页码
- `total` 为数字字符串(如 `"100"`)时正确解析
- `await-to-js` 内置打包,消费方无需额外安装

### 类型与构建

- 新增 `ApiResponse<T>` / `ListResult<T>` / `ActionEvent` / `BuiltInActionEvent` 类型,泛型贯通 `apis`
- 移除 element-plus 内部路径引用,`CustomTable.vue.d.ts` 从 226KB 瘦身至 3KB
- 依赖升级:vue ^3.5、vite ^8、vitepress ^1.6、vite-plugin-dts ^5、element-plus ^2.14、unplugin-auto-import ^21 等
- `Pagination` 改用 `defineModel`(vue 3.4+ 特性)
- `onCustomAction` 收敛为单一入口(`CrudPageConfig.table.onCustomAction` 优先)
- 配置类型 `any` 收窄,`tsc --noEmit` 全量通过

## [1.0.5] - 2025

- 初始版本发布
