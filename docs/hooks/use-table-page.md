# useTablePage

独立表格管理 Hook，提供 **数据获取、分页、搜索、删除、批量删除、导出** 功能。适合不需要表单弹窗编辑的场景。

## 基础用法

::: preview
demo-preview=../examples/use-table-page/basic.vue
:::

## API 参考

### 入参

```typescript
useTablePage<T = any>(
  fetchData: (params: any) => Promise<any>,
  searchForm?: Record<string, any>,
  config?: TablePageConfig,
  deleteConfig?: DeleteConfig,
  exportConfig?: ExportConfig,
): TablePageHook<T>
```

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `fetchData` | 列表查询接口 | `(params) => Promise<any>` | (必填) |
| `searchForm` | 搜索表单初始值 | `Record<string, any>` | `{}` |
| `config` | 表格配置 | `TablePageConfig` | `{}` |
| `deleteConfig` | 删除配置 | `DeleteConfig` | `{}` |
| `exportConfig` | 导出配置 | `ExportConfig` | `{}` |

### 返回值

| 返回值 | 类型 | 说明 |
|-------|------|------|
| **`tableBindings`** | `ComputedRef` | ⭐ **一键绑定 `<CustomTable v-bind="tableBindings">`** |
| `tableData` | `Ref<T[]>` | 表格数据 |
| `loading` | `Ref<boolean>` | 加载状态 |
| `deleteLoading` | `Ref<boolean>` | 删除操作加载状态 |
| `pageInfo` | `Reactive` | `{ pageNum, pageSize, total }` |
| `searchParams` | `Reactive` | 搜索参数（响应式，支持 v-model） |
| `selectedRows` | `Ref<T[]>` | 选中的行数据 |
| `selectedIds` | `ComputedRef` | 选中行的 ID 列表 |
| `getTableData` | `() => Promise<void>` | 刷新列表 |
| `handleSearch` | `() => void` | 搜索（重置到第 1 页后刷新） |
| `handleReset` | `() => void` | 重置搜索条件并刷新 |
| `handlePageChange` | `(page) => void` | 切换页码 |
| `handleSizeChange` | `(size) => void` | 切换每页条数 |
| `handleSelectionChange` | `(selection) => void` | 选择变化 |
| `handleDelete` | `(row) => Promise<void>` | 删除单行 |
| `handleBatchDelete` | `() => Promise<void>` | 批量删除选中行 |
| `handleExport` | `(options?) => void` | 导出数据 |
| `setTableColumns` | `(columns) => void` | 动态更新列配置 |

### TablePageConfig

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `customTableConfig` | `CustomTableConfig` | — | CustomTable 配置（列、序号、分页等） |
| `dataKey` | `string` | `'rows'` | 接口响应列表字段名 |
| `totalKey` | `string` | `'total'` | 接口响应总数字段名 |
| `autoDetect` | `boolean` | `true` | 自动检测响应结构 |
| `autoFetch` | `boolean` | `true` | 是否挂载时自动获取数据 |
| `beforeSearch` | `(params) => any` | — | 搜索前参数处理，返回 `false` 阻止请求 |
| `arrayFields` | `string[]` | — | 数组字段（搜索时自动 join） |
| `timeFields` | `Array` | — | 时间范围字段（自动拆分为 start/end） |
| `messageApi` | `Partial<MessageApi>` | — | 自定义消息提示 |
| `exportUrl` | `string` | — | 导出下载 URL |

### DeleteConfig

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `deleteApi` | `(id) => Promise<any>` | — | 删除接口 |
| `batchDeleteApi` | `(ids) => Promise<any>` | — | 批量删除接口 |
| `deleteAllApi` | `() => Promise<any>` | — | 删除全部接口 |
| `idKey` | `string` | `'id'` | 主键字段名 |
| `confirmMessage` | `string` | `'确定要删除当前数据吗？'` | 删除确认提示 |
| `batchConfirmMessage` | `string` | `'确定要删除选中的数据吗？'` | 批量删除确认提示 |
| `onDeleteSuccess` | `(row) => void` | — | 删除成功回调（默认自动刷新列表） |
| `onBatchDeleteSuccess` | `(rows, isDeleteAll) => void` | — | 批量删除成功回调 |

### ExportConfig

| 属性 | 类型 | 说明 |
|------|------|------|
| `exportFunction` | `(options) => void` | 自定义导出函数 |
| `arrayFields` | `string[]` | 数组字段（导出时自动 join） |
| `timeFields` | `Array` | 时间范围字段 |
| `idKey` | `string` | 主键字段名 |

## 功能说明

### 响应数据自动检测

`useTablePage` 内置自动检测机制，会依次尝试以下字段名取值：

- 数据列表：`rows` → `data` → `list` → `records` → `items`
- 数据总数：`total` → `totalCount` → `count` → `totalElements`

也可通过 `dataKey` / `totalKey` 手动指定。

### 删除页码回退

当删除当前页最后一条数据且页码大于 1 时，自动回退到上一页后再刷新，避免出现空页面。

### 导出数据合并

`handleExport` 会自动合并搜索参数 + 选中行 ID，并执行 `arrayFields` / `timeFields` 转换后再传给导出函数。

## 完整示例

```vue
<template>
  <CustomTable v-bind="tableBindings" @row-click="handleRowClick" />
</template>

<script setup lang="ts">
import { useTablePage, CustomTable } from 'vue3-crud-hooks'

const { tableBindings, handleSearch, searchParams } = useTablePage(
  fetchList,
  { keyword: '' },
  {
    customTableConfig: {
      selection: true,
      columns: [
        { prop: 'name', label: '名称' },
        { type: 'action', buttons: [{ event: 'delete', btnText: '删除' }] },
      ],
    },
  },
  { deleteApi: removeItem },
)
</script>
```
