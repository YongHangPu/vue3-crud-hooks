# vue3-crud-hooks

基于 Vue 3 Composition API 和 Element Plus 的 CRUD 业务逻辑复用库，帮助你在中后台项目中快速搭建表格、搜索、表单弹窗等标准功能。

[![npm version](https://img.shields.io/npm/v/vue3-crud-hooks.svg)](https://www.npmjs.com/package/vue3-crud-hooks)
[![License](https://img.shields.io/npm/l/vue3-crud-hooks.svg)](https://github.com/YongHangPu/vue3-crud-hooks/blob/main/LICENSE)

[贡献指南](./CONTRIBUTING.md) · [行为准则](./CODE_OF_CONDUCT.md)

---

## ✨ 特性

- 🚀 **声明式 CRUD** — 一个 `useCrudPage` Hook 接管表格查询、分页、搜索、新增、编辑、删除全流程
- 🧩 **开箱组件** — `CustomTable` + `Pagination` 组件与 Hooks 无缝配合，`v-bind="tableBindings"` 一行完成绑定
- 🔌 **模块解耦** — 可单独使用 `useTablePage` 管理列表，或单独使用 `useFormDialog` 管理弹窗
- 📦 **Tree Shaking** — 支持子路径按需导入（`vue3-crud-hooks/useTablePage`），不引入冗余代码
- 🛠 **分层配置** — `apis / table / form / search / advanced` 各层独立，兼顾快速开发与复杂场景
- 🧠 **自动检测** — 自动识别后端返回的 `rows/data/list` 等常见字段名，零配置接入
- 📝 **TypeScript** — 完备的类型推导，`CustomTable` 支持 el-table 原生属性/事件透传（`@row-click` / `highlight-current-row` 等）
- 🔄 **数据转换** — 内置数组↔字符串、时间范围、空值清理等转换工具
- 📢 **消息解耦** — `useMessage` 抽象消息提示，默认 Element Plus，可替换为任意 UI 库

---

## 📦 安装

```bash
pnpm add vue3-crud-hooks
```

需要同级安装 `vue@^3` 和 `element-plus@^2`。

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
      <el-form :model="formData" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="formData.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
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
  handleSearch,
  handleReset,
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
| `pageInfo` | 分页信息 `{ pageNum, pageSize, total }` | `Reactive` |
| `searchParams` | 搜索参数（响应式，可直接绑定到表单） | `Reactive` |
| `selectedRows` / `selectedIds` | 当前选中行数据 / ID 列表 | `Ref` |
| `getTableData` | 手动刷新列表 | `() => Promise<void>` |
| `handleSearch` | 搜索（重置页码后刷新） | `() => void` |
| `handleReset` | 重置搜索条件 | `() => void` |
| `handleDelete` | 单行删除 | `(row: T) => Promise<void>` |
| `handleBatchDelete` | 批量删除 | `() => Promise<void>` |
| `handleExport` | 导出数据 | `(options?) => void` |
| `dialogVisible` | 弹窗显示状态 | `Ref<boolean>` |
| `dialogMode` | 弹窗模式 `'add' \| 'edit'` | `Ref` |
| `formData` | 表单数据 | `Ref<T>` |
| `openDialog` | 打开弹窗 | `(mode, row?) => Promise<void>` |
| `submitForm` | 提交表单 | `() => Promise<void>` |

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
    exportUrl?: string                        // 导出下载 URL
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
| `arrayFields` | `string[]` | 数组字段，搜索时自动 `join(',')` |
| `timeFields` | `Array` | 时间范围字段，自动拆分为 `startAt`/`endAt` |
| `exportUrl` | `string` | 导出下载 URL（未配置 exportFunction 时使用） |

---

### `useFormDialog<T>(config: FormDialogConfig<T>)`

独立表单弹窗管理 Hook。

| 返回值 | 说明 |
|--------|------|
| `dialogVisible` / `dialogMode` | 弹窗状态 |
| `formData` / `formRef` | 表单数据与引用 |
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

> **所有未声明的属性和事件（如 `@row-click`、`highlight-current-row`、`@cell-click`）会自动透传到内层 el-table**，像使用原生 el-table 一样使用即可。

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

## 📦 子路径导入

```typescript
import { useCrudPage } from 'vue3-crud-hooks'
import { useTablePage } from 'vue3-crud-hooks/useTablePage'
import { useFormDialog } from 'vue3-crud-hooks/useFormDialog'
import { CustomTable } from 'vue3-crud-hooks/CustomTable'
import { Pagination } from 'vue3-crud-hooks/Pagination'
import { useDataTransform } from 'vue3-crud-hooks/useDataTransform'
import { useMessage } from 'vue3-crud-hooks/useMessage'
```

---

## 📄 License

MIT License © 2025 [YongHangPu](https://github.com/YongHangPu)
