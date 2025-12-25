# useTablePage

`useTablePage` 是一个用于管理表格页面的 Hook，它提供了表格数据获取、分页、搜索、删除、批量删除等功能。相比于 `useCrudPage`，它更加专注于表格展示和基础操作，适合不需要表单编辑的场景。

## 基础用法

::: preview
demo-preview=@examples/use-table-page/basic.vue
:::

## API

### 参数说明

```typescript
function useTablePage<T = any>(
  fetchData: (params: any) => Promise<any>,
  searchForm: Record<string, any> = {},
  config: TablePageConfig = {},
  deleteConfig: DeleteConfig = {},
  exportConfig: ExportConfig = {}
): TablePageHook<T>
```

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| fetchData | 获取表格数据的接口函数 | `(params: any) => Promise<any>` | - |
| searchForm | 搜索表单初始值 | `Record<string, any>` | `{}` |
| config | 表格页面配置选项 | `TablePageConfig` | `{}` |
| deleteConfig | 删除操作配置选项 | `DeleteConfig` | `{}` |
| exportConfig | 导出配置选项 | `ExportConfig` | `{}` |

### TablePageConfig 配置项

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| dataKey | 接口返回数据列表的字段名 | `string` | `'rows'` |
| totalKey | 接口返回总条数的字段名 | `string` | `'total'` |
| autoDetect | 是否自动检测数据结构 | `boolean` | `true` |
| autoFetch | 是否在挂载时自动获取数据 | `boolean` | `true` |
| customTableConfig | CustomTable 组件的配置 | `CustomTableConfig` | - |
| messageApi | 消息提示 API | `MessageApi` | - |
| beforeSearch | 搜索前的参数处理函数 | `(params: any) => any` | - |
| timeFields | 时间范围字段配置 | `TimeFieldConfig[]` | `[]` |
| arrayFields | 数组字段配置 | `string[]` | `[]` |

### DeleteConfig 删除配置

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| deleteApi | 删除单条数据的接口 | `(id: any) => Promise<any>` | - |
| batchDeleteApi | 批量删除数据的接口 | `(ids: any[]) => Promise<any>` | - |
| deleteAllApi | 删除所有数据的接口 | `() => Promise<any>` | - |
| idKey | 数据的主键字段名 | `string` | `'id'` |
| confirmMessage | 删除确认提示语 | `string` | `'确定要删除当前数据吗？'` |
| batchConfirmMessage | 批量删除确认提示语 | `string` | `'确定要删除选中的数据吗？'` |
| onDeleteSuccess | 删除成功回调 | `(row: any) => void` | `undefined` |
| onBatchDeleteSuccess | 批量删除成功回调 | `(rows: any[], isDeleteAll: boolean) => void` | `undefined` |

### 返回值说明

| 属性/方法 | 说明 | 类型 |
| --- | --- | --- |
| tableData | 表格数据列表 | `Ref<T[]>` |
| loading | 表格加载状态 | `Ref<boolean>` |
| deleteLoading | 删除操作加载状态 | `Ref<boolean>` |
| pageInfo | 分页信息（当前页、每页条数、总数） | `Reactive<{ pageNum: number, pageSize: number, total: number }>` |
| searchParams | 当前搜索参数 | `Reactive<Record<string, any>>` |
| selection | 当前选中的数据行 | `Ref<T[]>` |
| selectedIds | 当前选中的 ID 列表 | `ComputedRef<any[]>` |
| getTableData | 获取表格数据 | `() => Promise<void>` |
| handleSearch | 执行搜索（重置页码到第一页） | `() => void` |
| handleReset | 重置搜索条件 | `() => void` |
| handlePageChange | 页码改变回调 | `(page: number) => void` |
| handleSizeChange | 每页条数改变回调 | `(size: number) => void` |
| handleSelectionChange | 表格选择改变回调 | `(selection: T[]) => void` |
| handleDelete | 删除单条数据 | `(row: T) => Promise<void>` |
| handleBatchDelete | 批量删除数据 | `() => Promise<void>` |
| handleExport | 导出数据 | `(options?: ExportOptions) => void` |
| tableConfig | CustomTable 组件的完整配置 | `ComputedRef<CustomTableConfig>` |
| tableEventHandlers | CustomTable 组件的事件处理器 | `Record<string, Function>` |

## 使用示例

### 基础表格

```vue
<template>
  <div>
    <!-- 搜索表单 -->
    <el-form :model="searchParams" inline>
      <el-form-item label="名称">
        <el-input v-model="searchParams.name" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <div class="mb-4">
      <el-button
        type="danger"
        :disabled="!selection.length"
        @click="handleBatchDelete"
      >
        批量删除
      </el-button>
    </div>

    <!-- 表格组件 -->
    <CustomTable
      v-if="tableConfig"
      :config="tableConfig"
      :data="tableData"
      :loading="loading"
      v-bind="tableEventHandlers"
    />
  </div>
</template>

<script setup lang="ts">
import { useTablePage, CustomTable } from 'vue3-crud-hooks'
import { getList, deleteItem, batchDeleteItems } from '@/api'

const {
  tableData,
  loading,
  searchParams,
  selection,
  tableConfig,
  tableEventHandlers,
  handleSearch,
  handleReset,
  handleBatchDelete
} = useTablePage(
  getList,
  { name: '' }, // 初始搜索参数
  {
    customTableConfig: {
      selection: true,
      columns: [
        { prop: 'name', label: '名称' },
        { prop: 'createTime', label: '创建时间' },
        {
          label: '操作',
          actions: [
            { label: '删除', type: 'danger', event: 'delete' }
          ]
        }
      ]
    }
  },
  {
    deleteApi: deleteItem,
    batchDeleteApi: batchDeleteItems
  }
)
</script>
```
