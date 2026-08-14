# Changelog

## [1.2.1] - 2026-08-12

### Bug 修复

- **操作列按钮间距错位**：`CustomTable` 操作列按钮间距由「相邻兄弟 `margin-left`」改为「flex `gap`」。原实现配合 `visible` 动态显隐（`v-show`）时，隐藏按钮仍占据 DOM 位置，会导致第一个可见按钮被误加 `margin-left: 8px`（典型场景：启用/禁用互斥按钮中，状态为「启用」的行里「禁用」按钮会多出左边距）。flex gap 下隐藏元素不占位、不产生间距，按钮始终对齐。

## [1.2.0] - 2026-08-12

### 新功能

- **服务端排序与筛选状态管理**：`useTablePage` 新增 `sortInfo` / `filterInfo` 状态与 `handleSortChange` / `handleFilterChange`，配置 `sortable` / `filterable`（`boolean` 或自定义映射函数）即可将排序/筛选状态并入列表请求参数，无需手写事件处理；默认排序参数映射 `{ orderByColumn, isAsc }`（RuoYi 风格），`handleReset` 自动清空排序与筛选
- **列显隐 API**：新增 `toggleColumn(prop, visible?)` 切换列显隐、`getVisibleColumns()` 获取可见列，直接操作响应式列配置并同步视图
- **`tableBindings` 强类型化**：新增 `TableBindings<T>` 类型，`tableBindings` 从 `Record<string, any>` 收敛为 `ComputedRef<TableBindings<T>>`，`v-bind="tableBindings"` 无需 `as any` 即可通过类型检查
- **导出能力增强**：新增 `exportLoading` 状态；`exportFunction` 返回 `Blob`（或 `{ blob }`）时自动触发浏览器下载；支持 `onExportSuccess` / `onExportError` 回调（`useCrudPage` 场景配置于 `advanced`）
- **`useFormDialog` 暴露 `formRules`**：`config.formRules` 不再死配置，通过返回的 `formRules`（响应式）绑定到 `el-form` 的 `:rules` 即可生效
- **`CustomTable` 内置表格自适应高度（默认开启）**：新增 `autoHeight` 属性（`boolean | AutoHeightOptions`），**默认开启**——零配置即让表格自动填满视口/容器剩余空间（表格内部滚动、分页器固定底部、外部无滚动条、随窗口缩放自适应），传对象自定义 `{ minHeight, extraGap, watchSources }`、传 `false` 关闭；内置默认 `minHeight 240 / extraGap 40`（为内容区 padding 预留缓冲）；容器内 el-table 默认 `flex-shrink: 0`，防止被外层 flex 布局压缩导致高度失真
- **`CustomTable` 暴露 `paginationRef`**：通过 `defineExpose` 提供内部分页器引用，配合 `useTableHeight` 读取分页器尺寸
- **多表格互不影响**：每个 `CustomTable`/`useTableHeight` 实例拥有独立的高度计算、分页与事件状态，同页面多个表格可各自自适应、独立操作
- **`useTableHeight` 容器基准**：当表格容器被外部 flex 布局约束（`flex-grow > 0` 或 `flex-basis: 0%`）时，表格高度改为基于容器可用空间计算（而非视口），精确填满所在卡片/区域——从根本上避免视口基准在卡片布局/不同视口/字体渲染下出现的溢出与外部滚动条；`CustomTable` 已内置传入自身容器，用户无需配置
- 导出 `AutoHeightOptions`（types/table）与 `WatchSource`（useTableHeight）类型

### 测试与文档

- **测试补强**（125 → 130 用例）：`CustomTable`（sort/filter 事件透传、按钮 `visible`/`disabled` 分支、`btnType: 'button'`、内容/表头插槽、`hidden` 列、分页器显示边界、autoHeight 默认开启）；`useTableHeight`（容器基准、多实例独立、分页器延迟渲染自动重算）；`useTablePage`（排序/筛选状态、`toggleColumn`、导出增强）；`useFormDialog`（`formRules` 暴露）
- **文档完善**：新增 `use-table-height` 文档页并接入 vitepress 导航；README 与 docs 补全 `addDateRange`、`sortInfo`/`filterInfo`/`handleSortChange`/`handleFilterChange`/`toggleColumn`/`getVisibleColumns`/`exportLoading`/`formRules`/`isSuccess`/`transformResponse` 等 API 说明；docs 演示环境修复（分页器高度异常、演示容器高度约束、内容区宽度调宽）

## [1.1.0] - 2026-08-11

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
