# vue3-crud-hooks

基于 Vue 3 Composition API 和 Element Plus 的 CRUD 业务逻辑复用库，帮助你在中后台项目中快速搭建表格、搜索、表单弹窗等标准功能。

[![npm version](https://img.shields.io/npm/v/vue3-crud-hooks.svg)](https://www.npmjs.com/package/vue3-crud-hooks)
[![License](https://img.shields.io/npm/l/vue3-crud-hooks.svg)](https://github.com/YongHangPu/vue3-crud-hooks/blob/main/LICENSE)

[贡献指南](./CONTRIBUTING.md) · [行为准则](./CODE_OF_CONDUCT.md) · [在线示例](https://github.com/YongHangPu/vue3-crud-hooks-demo)

---

## 🎮 在线示例

完整后台管理演示项目已开源:[**vue3-crud-hooks-demo**](https://github.com/YongHangPu/vue3-crud-hooks-demo)

覆盖本库全部能力:完整 CRUD 页面(搜索/分页/新增/编辑/删除/导出/业务码校验)、服务端排序与列筛选、列显隐、多表格并存、表格自适应高度、路由懒加载、暗色模式等。

---

## ✨ 特性

- 🚀 **声明式 CRUD** — 一个 `useCrudPage` Hook 接管表格查询、分页、搜索、新增、编辑、删除全流程
- 🧩 **开箱组件** — `CustomTable` + `Pagination` 组件与 Hooks 无缝配合，`v-bind="tableBindings"` 一行完成绑定
- 🔌 **模块解耦** — 可单独使用 `useTablePage` 管理列表，或单独使用 `useFormDialog` 管理弹窗
- 📦 **Tree Shaking** — 支持子路径按需导入（`vue3-crud-hooks/useTablePage`），不引入冗余代码
- 🛠 **分层配置** — `apis / table / form / search / advanced` 各层独立，兼顾快速开发与复杂场景
- 🧠 **自动检测** — 自动识别后端返回的 `rows/data/list` 等常见字段名，支持 `{ code, data: { records, total } }` 嵌套包装，零配置接入
- ✅ **业务码校验** — 默认按 `code ∈ [0, 200, 1, '0', '200', '1']` 判断业务成败，HTTP 200 但业务失败不再误报「成功」；可自定义 `isSuccess`
- 📝 **TypeScript** — 完备的类型推导，`CustomTable` 支持 el-table 原生属性/事件透传（`@row-click` / `highlight-current-row` 等）
- 🔄 **数据转换** — 内置数组↔字符串、时间范围、空值清理等转换工具
- 📢 **消息解耦** — `useMessage` 抽象消息提示，默认 Element Plus，可替换为任意 UI 库

---

## 📦 安装

```bash
pnpm add vue3-crud-hooks
```

需要同级安装 `vue@^3.5`(库使用了 `defineModel` 特性)和 `element-plus@^2`。运行时依赖 `await-to-js` 已内置打包,无需额外安装。

如果你使用了 `CustomTable` 或 `Pagination` 组件，建议同时引入组件库样式：

```ts
import 'vue3-crud-hooks/style.css'
```

不引入时，组件功能仍可用，但以下内置样式不会生效：

- `CustomTable` 内部分页区域的上边距
- 操作列中多个 `el-link` / `el-button` 之间的间距
- `Pagination` 容器的宽度与右对齐布局
- `Pagination` 的 `hidden` 隐藏样式

如果你只使用 Hooks，不使用 `CustomTable` / `Pagination`，则不需要额外引入这份样式。

---

## 🔨 快速开始

### 完整 CRUD 页面

一个 Hook + 一个组件，快速搭建带搜索、分页、增删改的完整页面。

```vue
<template>
  <div>
    <!-- 搜索栏 -->
    <el-input v-model="searchParams.keyword" placeholder="搜索" style="width: 200px" />
    <el-button type="primary" @click="handleSearch">搜索</el-button>
    <el-button @click="handleReset">重置</el-button>
    <el-button type="primary" @click="openDialog('add')">新增</el-button>

    <!-- 表格 — v-bind 一行绑定所有属性和事件 -->
    <CustomTable v-bind="tableBindings">
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
    </CustomTable>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增' : '编辑'">
      <el-form ref="formRef" :model="formData" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="formData.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useCrudPage, CustomTable } from 'vue3-crud-hooks'
import { getList, addData, updateData, deleteData } from '@/api/demo'

const {
  searchParams,
  dialogVisible,
  dialogMode,
  formData,
  formRef,
  handleSearch,
  handleReset,
  handleDialogClose,
  openDialog,
  submitForm,
  tableBindings,           // 一键绑定，包含 config / data / loading / 事件
} = useCrudPage({
  apis: {
    list: getList,
    add: addData,
    update: updateData,
    delete: deleteData,
  },
  table: {
    config: {
      selection: true,
      index: true,
      columns: [
        { prop: 'name', label: '名称', minWidth: 120 },
        { prop: 'status', label: '状态', width: 100 },
        { prop: 'createTime', label: '创建时间', width: 180 },
        {
          type: 'action',
          label: '操作',
          width: 150,
          buttons: [
            { btnText: '编辑', event: 'edit', type: 'primary' },
            { btnText: '删除', event: 'delete', type: 'danger' },
          ],
        },
      ],
    },
  },
  form: {
    initialData: { name: '', status: 1 },
  },
})
</script>
```

### 独立使用表格

只需列表管理时，可单独使用 `useTablePage`：

```vue
<script setup lang="ts">
import { useTablePage, CustomTable } from 'vue3-crud-hooks'
import { fetchUsers } from '@/api/user'

const { tableBindings, handleSearch, handleReset, searchParams } = useTablePage(
  fetchUsers,
  { keyword: '' },
  {
    customTableConfig: {
      columns: [
        { prop: 'name', label: '姓名' },
        { prop: 'email', label: '邮箱' },
      ],
    },
  }
)
</script>

<template>
  <CustomTable v-bind="tableBindings" />
</template>
```

### 独立使用组件

也可脱离 Hooks，像使用普通组件一样使用 `CustomTable`：

```vue
<template>
  <CustomTable
    :config="config"
    :data="data"
    :loading="loading"
    @pagination="onPagination"
    @action="onAction"
    @row-click="handleRowClick"           <!-- el-table 原生事件直接透传 -->
    highlight-current-row                 <!-- el-table 原生属性直接透传 -->
  />
</template>

<script setup lang="ts">
import { CustomTable } from 'vue3-crud-hooks'
import type { CustomTableConfig } from 'vue3-crud-hooks'

const config: CustomTableConfig = {
  columns: [
    { prop: 'name', label: '名称' },
    { type: 'action', buttons: [{ btnText: '编辑', event: 'edit' }] },
  ],
  pagination: { currentPage: 1, pageSize: 20 },
}
</script>
```

---

## 📚 API 参考

### `useCrudPage<T>(config: CrudPageConfig<T>)`

一站式 CRUD Hook，整合表格查询 + 表单弹窗。

| 返回值 | 说明 | 类型 |
|-------|------|------|
| `tableBindings` | **一键绑定**到 `CustomTable`（含 `config`/`data`/`loading` + 事件） | `ComputedRef` |
| `tableData` | 表格数据 | `Ref<T[]>` |
| `loading` | 加载状态 | `Ref<boolean>` |
| `deleteLoading` | 删除操作加载状态 | `Ref<boolean>` |
| `pageInfo` | 分页信息 `{ pageNum, pageSize, total }` | `Reactive` |
| `searchParams` | 搜索参数（响应式，可直接绑定到表单） | `Reactive` |
| `selectedRows` / `selectedIds` | 当前选中行数据 / ID 列表 | `Ref` |
| `getTableData` | 手动刷新列表 | `() => Promise<void>` |
| `handleSearch` | 搜索（重置页码后刷新） | `() => void` |
| `handleReset` | 重置搜索条件 | `() => void` |
| `sortInfo` | 服务端排序信息 `{ prop, order }`（启用 `sortable` 后维护） | `Reactive` |
| `filterInfo` | 服务端筛选信息 `{ [prop]: values[] }` | `Reactive` |
| `handleSortChange` | 排序变化处理 | `(sort) => void` |
| `handleFilterChange` | 筛选变化处理 | `(filters) => void` |
| `handleDelete` | 单行删除 | `(row: T) => Promise<void>` |
| `handleBatchDelete` | 批量删除 | `() => Promise<void>` |
| `handleExport` | 导出数据 | `(options?) => void` |
| `exportLoading` | 导出操作加载状态 | `Ref<boolean>` |
| `setTableColumns` | 动态更新列配置 | `(columns) => void` |
| `toggleColumn` | 切换列显隐（`visible` 缺省取反） | `(prop, visible?) => void` |
| `getVisibleColumns` | 获取当前可见列 | `() => TableColumnConfig[]` |
| `dialogVisible` | 弹窗显示状态 | `Ref<boolean>` |
| `dialogMode` | 弹窗模式 `'add' \| 'edit'` | `Ref` |
| `formData` | 表单数据 | `Ref<T>` |
| `formRef` | 表单实例引用 | `Ref<any>` |
| `formRules` | 表单校验规则（绑定到 el-form `:rules`） | `ComputedRef` |
| `submitLoading` | 提交加载状态 | `Ref<boolean>` |
| `formLoading` | 编辑回显加载状态 | `Ref<boolean>` |
| `openDialog` | 打开弹窗 | `(mode, row?) => Promise<void>` |
| `submitForm` | 提交表单 | `() => Promise<void>` |
| `resetForm` | 重置表单 | `() => void` |
| `handleDialogClose` | 关闭弹窗 | `() => void` |

**配置项 `CrudPageConfig<T>`：**

```typescript
interface CrudPageConfig<T> {
  apis: {
    list: (params: any) => Promise<any>       // 列表查询接口
    add: (data: T) => Promise<any>            // 新增接口
    update: (data: T) => Promise<any>         // 编辑接口
    delete?: (id: any) => Promise<any>        // 删除接口
    batchDelete?: (ids: any[]) => Promise<any> // 批量删除接口
    get?: (id: any) => Promise<any>           // 获取详情接口（编辑时回显）
    export?: Function                         // 导出接口
  }
  table: {
    config?: CustomTableConfig                // CustomTable 列配置
    idKey?: string                            // 主键字段名，默认 'id'
    dataKey?: string                          // 响应数据字段名，默认 'rows'
    totalKey?: string                         // 响应总数字段名，默认 'total'
    autoFetch?: boolean                       // 是否自动获取数据
    autoDetect?: boolean                      // 是否自动检测响应结构
    exportUrl?: string                        // 导出下载 URL
    confirmMessage?: string                   // 删除确认提示
    batchConfirmMessage?: string              // 批量删除确认提示
    onCustomAction?: (event, row, index) => void // 自定义事件处理器（页面级推荐入口）
    transformResponse?: (res) => { data; total } | null // 自定义列表响应解析（返回 null 回退默认解析）
  }
  form: {
    initialData: T                            // 表单初始值
    rules?: any                               // 表单校验规则
    beforeSubmit?: (data: T) => any           // 提交前转换
    afterGet?: (data: any) => T               // 获取详情后转换
    onAfterSubmit?: () => void                // 提交成功后回调
    onSubmitSuccess?: (res, mode, formData) => void  // 提交成功回调
  }
  search?: {
    initialData: Record<string, any>          // 搜索表单初始值
    beforeSearch?: (params: any) => any       // 搜索前参数转换
  }
  advanced?: {
    arrayFields?: string[]                    // 数组字段（自动 string[] ↔ 逗号分隔）
    timeFields?: Array<{ field, prefix }>     // 时间范围字段
    messageApi?: Partial<MessageApi>          // 自定义消息 API
    isSuccess?: (res: any) => boolean         // 业务成功判断（默认识别 code ∈ [0, 200, 1, '0', '200', '1']）
    onDeleteSuccess?: (row: T) => void
    onBatchDeleteSuccess?: (rows: T[]) => void
  }
}
```

---

### `useTablePage<T>(fetchApi, searchForm?, config?, deleteConfig?, exportConfig?)`

独立表格管理 Hook。

| 参数 | 类型 | 说明 |
|------|------|------|
| `fetchApi` | `(params) => Promise<any>` | 列表查询接口 |
| `searchForm` | `Record<string, any>` | 搜索表单初始值 |
| `config` | `TablePageConfig` | 配置项（见下文） |
| `deleteConfig` | `DeleteConfig` | 删除配置 |
| `exportConfig` | `ExportConfig` | 导出配置 |

**`TablePageConfig`：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `customTableConfig` | `CustomTableConfig` | 用于生成 `CustomTable` 组件的配置 |
| `dataKey` | `string` | 响应数据字段名，默认 `'rows'` |
| `totalKey` | `string` | 响应总数字段名，默认 `'total'` |
| `autoDetect` | `boolean` | 自动检测响应结构，默认 `true` |
| `autoFetch` | `boolean` | 自动获取数据，默认 `true` |
| `beforeSearch` | `(params) => any` | 搜索前参数转换，返回 `false` 阻止请求 |
| `isSuccess` | `(res) => boolean` | 业务成功判断，默认自动识别 `code ∈ [0, 200, 1, '0', '200', '1']` |
| `transformResponse` | `(res) => { data, total } \| null` | 自定义列表响应解析，返回 `null` 回退默认解析 |
| `arrayFields` | `string[]` | 数组字段，搜索时自动 `join(',')` |
| `timeFields` | `Array` | 时间范围字段，自动拆分为 `startAt`/`endAt` |
| `exportUrl` | `string` | 导出下载 URL（未配置 exportFunction 时使用） |

**返回值：**

| 返回值 | 说明 | 类型 |
|-------|------|------|
| `tableBindings` | 一键绑定到 `CustomTable`（含 `config`/`data`/`loading` + 事件） | `ComputedRef` |
| `tableData` | 表格数据 | `Ref<T[]>` |
| `loading` | 加载状态 | `Ref<boolean>` |
| `deleteLoading` | 删除操作加载状态 | `Ref<boolean>` |
| `pageInfo` | 分页信息 `{ pageNum, pageSize, total }` | `Reactive` |
| `searchParams` | 搜索参数（响应式，可直接绑定表单） | `Reactive` |
| `selectedRows` / `selectedIds` | 选中行数据 / ID 列表 | `Ref` |
| `sortInfo` / `filterInfo` | 服务端排序 / 筛选信息（启用 `sortable`/`filterable` 后维护） | `Reactive` |
| `getTableData` | 手动刷新列表 | `() => Promise<void>` |
| `handleSearch` / `handleReset` | 搜索 / 重置 | `() => void` |
| `handleSortChange` / `handleFilterChange` | 排序 / 筛选变化处理 | `(sort) => void` / `(filters) => void` |
| `handleDelete` / `handleBatchDelete` | 删除 / 批量删除 | `(row) => Promise<void>` / `() => Promise<void>` |
| `handleExport` / `exportLoading` | 导出 / 导出加载状态 | `(options?) => void` / `Ref<boolean>` |
| `setTableColumns` | 动态更新列配置 | `(columns) => void` |
| `toggleColumn` / `getVisibleColumns` | 列显隐切换 / 获取可见列 | `(prop, visible?) => void` / `() => TableColumnConfig[]` |

---

### `useFormDialog<T>(config: FormDialogConfig<T>)`

独立表单弹窗管理 Hook。

> 配置项 `FormDialogConfig<T>` 中的表单初始数据支持 `initialData`(推荐,与 `CrudPageConfig.form.initialData` 命名一致)或兼容旧名称 `initialFormData`,二选一,`initialData` 优先。

| 返回值 | 说明 |
|--------|------|
| `dialogVisible` / `dialogMode` | 弹窗状态 |
| `formData` / `formRef` / `formRules` | 表单数据、引用与校验规则（`formRules` 绑定到 el-form `:rules`） |
| `submitLoading` / `formLoading` | 加载状态 |
| `openDialog(mode, row?)` | 打开弹窗（编辑模式自动回显） |
| `submitForm()` | 验证 + 转换 + 提交 |
| `resetForm()` | 重置表单 |
| `handleDialogClose()` | 关闭弹窗 |

---

### `CustomTable` 组件

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `config` | `CustomTableConfig \| null` | `{ columns: [] }` | 表格配置（列定义、分页、序号等） |
| `data` | `any[]` | `[]` | 表格数据 |
| `loading` | `boolean` | `false` | 加载状态 |
| `props` | `Partial<TableProps>` | `{}` | 透传给 el-table 的属性（border, stripe 等） |
| `autoHeight` | `boolean \| AutoHeightOptions` | `true` | 表格自适应高度（**默认开启**）：不传即启用默认配置（minHeight 240/extraGap 40），传 `{ minHeight, extraGap, watchSources }` 自定义，传 `false` 关闭 |

> **所有未声明的属性和事件（如 `@row-click`、`highlight-current-row`、`@cell-click`）会自动透传到内层 el-table**，像使用原生 el-table 一样使用即可。

**表格自适应高度（内置，默认开启）**：`CustomTable` 开箱即用——无需任何配置，表格自动占满视口剩余空间（表格内部滚动、分页器固定底部、表格外部不出现滚动条），支持窗口缩放自适应、数据异步加载后分页器出现自动重算：

```vue
<!-- 零配置：默认即自适应（minHeight 240 / extraGap 40） -->
<CustomTable v-bind="tableBindings" />

<!-- 自定义：最小高度 / 额外间距 / 联动搜索栏等外部状态 -->
<CustomTable
  v-bind="tableBindings"
  :auto-height="{ minHeight: 240, extraGap: 24, watchSources: [showAdvancedSearch] }"
/>

<!-- 关闭自适应：表格高度由内容或透传的 height 决定 -->
<CustomTable v-bind="tableBindings" :auto-height="false" />
```

> 边界说明：`autoHeight` 开启时**覆盖透传的 `height`**；未配置分页器时按分页器高度 0 计算；默认 `extraGap: 40` 为常见后台布局（内容区 padding + 分页器间距）预留缓冲，需要更紧凑时传 `{ extraGap: 24 }`。**容器基准**：当 `CustomTable` 所在容器被 flex 布局约束（`flex-grow > 0` 或 `flex-basis: 0%`，常见于卡片布局中给容器 `flex: 1`）时，表格高度按容器可用空间计算、精确填满容器（与视口无关），外部滚动条不会出现。**多表格互不影响**：每个 `CustomTable` 实例拥有独立的高度计算与分页状态，同页面多个表格可各自自适应（见 demo「多表格」）。

#### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `pagination` | `{ currentPage, pageSize }` | 分页改变 |
| `action` | `(event, row, index)` | 操作按钮点击 |
| `selection-change` | `(selection)` | 多选改变 |
| `sort-change` | `({ column, prop, order })` | 排序改变 |
| `filter-change` | `(filters)` | 筛选改变 |

#### Slots

| 名称 | 作用域 | 说明 |
|------|--------|------|
| `[prop]` | `{ row, index, column }` | 自定义列内容 |
| `[prop]-header` | `{ column, $index }` | 自定义表头 |
| `action` | `{ row, index }` | 自定义操作列 |
| `append` | — | 表格底部插槽 |

#### 列配置 `CustomTableConfig`

```typescript
interface CustomTableConfig {
  columns: Array<{
    prop?: string            // 字段名
    label?: string           // 列标题
    width?: string | number
    minWidth?: string | number
    fixed?: boolean | 'left' | 'right'
    type?: 'default' | 'selection' | 'index' | 'expand' | 'action'
    align?: 'left' | 'center' | 'right'
    sortable?: boolean | 'custom'
    resizable?: boolean
    filters?: Array<{ text: string; value: any }>
    filterMethod?: (value: any, row) => boolean
    formatter?: (row, column, cellValue, index) => any
    buttons?: Array<{           // 操作列按钮（仅 type='action' 时有效）
      btnText: string
      event: string
      btnType?: 'link' | 'button'
      type?: 'primary' | 'success' | 'warning' | 'danger'
      disabled?: boolean | ((row) => boolean)
      visible?: (row) => boolean
      props?: Record<string, any>
    }>
    // 更多 el-table-column 原生属性（showOverflowTooltip, className 等）
    [key: string]: any
  }>
  selection?: boolean | Record<string, any>   // 是否展示选择列
  index?: boolean | Record<string, any>       // 是否展示序号列（自动翻页连续序号）
  pagination?: boolean | PaginationConfig     // 分页配置
  props?: Record<string, any>                 // 透传 el-table 属性
}
```

#### 分页配置 `PaginationConfig`

```typescript
interface PaginationConfig {
  currentPage?: number       // 当前页码，默认 1
  pageSize?: number          // 每页条数，默认 10
  total?: number             // 总条数
  pageSizes?: number[]       // 可选的每页条数选项
  layout?: string            // 分页布局
  autoScroll?: boolean       // 翻页时自动滚动到顶部
  align?: string             // 对齐方式，默认 'right'
}
```

---

### `Pagination` 组件

独立的 Element Plus 分页封装，支持 `v-bind` 透传：

```vue
<Pagination :total="100" :currentPage="1" :pageSize="20" @pagination="onPageChange" />
```

---

### `useDataTransform`

数据转换工具函数：

| 方法 | 说明 |
|------|------|
| `arrayToString(data, fields)` | 数组字段转逗号字符串（提交用） |
| `stringToArray(data, fields)` | 逗号字符串转数组（回显用） |
| `processTimeRange(params, field, prefix?)` | 时间范围拆分为 `beginTime`/`endTime` |
| `addDateRange(params, dateRange, fieldConfig?)` | 日期范围写入查询参数 `params.params` 子对象（默认 `beginTime`/`endTime`，支持字符串前缀或 `{ start, end }` 对象配置） |
| `cleanEmptyFields(data, fields?)` | 清理空值字段 |
| `convertNumbers(data, fields)` | 字段转数字类型 |

### `useMessage`

消息提示解耦层，默认使用 Element Plus 的 `ElMessage` / `ElMessageBox`，可通过 `messageApi` 替换为任意 UI 库：

```typescript
const message = useMessage({
  success: (msg) => myUI.showSuccess(msg),
  error: (msg) => myUI.showError(msg),
  confirm: (msg) => myUI.showConfirm(msg),
})
```

---

### `useTableHeight`

表格自适应高度 Hook：动态计算表格最大高度，使其恰好填满视口剩余空间（表格内部滚动、分页器固定底部），配合 `CustomTable` + `Pagination` 使用。

**纯计算函数 `calculateTableMaxHeight`：**

```typescript
calculateTableMaxHeight({
  viewportHeight, tableTop, paginationHeight, extraGap,
  containerPaddingBottom = 0, minHeight,
})
// 可用高度 = 视口高度 - 表格顶部偏移 - 分页器高度 - 额外间距 - 容器底部内边距,与最小高度取最大值
```

**Composable `useTableHeight(tableRef, paginationRef, options?)`：**

| 返回值 | 说明 |
|--------|------|
| `tableMaxHeight` | 表格最大高度（`Ref<number>`，绑定到 `el-table` 的 `height`） |
| `updateTableMaxHeight()` | 手动重算高度 |
| `initTableHeightObserver()` | 初始化监听 |

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `minHeight` | `number` | `240` | 表格最小高度（px），极端场景兜底 |
| `extraGap` | `number` | `24` | 页面额外间距补偿（px） |
| `containerRef` | `Ref` | — | 表格父容器引用：读取容器 `padding-bottom`；当容器被 flex 布局约束（`flex-grow > 0` 或 `flex-basis: 0%`）时，按容器可用空间计算高度（容器基准），表格精确填满所在区域 |
| `watchSources` | `WatchSource[]` | `[]` | 需要监听的响应式数据（`ref` / `computed` / getter，如搜索栏展开状态），变化时自动重算 |

**与 `CustomTable` 配合示例（height 直接透传给 el-table）：**

> ⚠️ 注意：`CustomTable` 的 `autoHeight` 默认开启并会覆盖透传的 `height`。手动用 `useTableHeight` 接管时需显式 `:auto-height="false"`；若使用原生 `<el-table>` 则无需此步。

```vue
<template>
  <div ref="wrapperRef">
    <CustomTable
      v-bind="tableBindings"
      :height="tableMaxHeight"
      :auto-height="false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCrudPage, CustomTable, useTableHeight } from 'vue3-crud-hooks'

const tableRef = ref()   // 绑定到 CustomTable 的 ref
const paginationRef = ref()
const wrapperRef = ref()

const { tableBindings } = useCrudPage({ /* ... */ })

// 分页器高度变化、窗口缩放、搜索栏展开收起时自动重算表格高度
const { tableMaxHeight } = useTableHeight(tableRef, paginationRef, {
  containerRef: wrapperRef,
  watchSources: [showAdvancedSearch],  // 你的搜索栏状态
})

// CustomTable 的 height 会透传到内层 el-table:
// 表格内容区域内部滚动,分页器固定在底部
</script>
```

> 说明：`tableRef` 传入 `CustomTable` 组件的 ref（组件实例，内部通过 `$el` 取 DOM）；`paginationRef` 传入 `Pagination` 组件的 ref。若表格/分页器使用原生 DOM 元素，直接传入元素 ref 即可。环境不支持 `ResizeObserver` 时自动降级为仅 `window.resize` 监听。

---

## 📦 子路径导入

```typescript
import { useCrudPage } from 'vue3-crud-hooks'
import { useTablePage } from 'vue3-crud-hooks/useTablePage'
import { useFormDialog } from 'vue3-crud-hooks/useFormDialog'
import CustomTable from 'vue3-crud-hooks/CustomTable'
import Pagination from 'vue3-crud-hooks/Pagination'
import { useDataTransform } from 'vue3-crud-hooks/useDataTransform'
import { useMessage } from 'vue3-crud-hooks/useMessage'
import { useTableHeight } from 'vue3-crud-hooks/useTableHeight'
```

> 注意:子路径 `vue3-crud-hooks/CustomTable` 与 `vue3-crud-hooks/Pagination` 为组件的 **default 导出**;命名导出 `CustomTable` / `Pagination` 仅通过主入口 `vue3-crud-hooks` 提供。

---

## 📄 License

MIT License © 2025 [YongHangPu](https://github.com/YongHangPu)
