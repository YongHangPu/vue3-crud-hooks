---
title: useTablePage
---

# useTablePage

- 功能：提供表格数据管理、分页、搜索、删除、导出等完整能力
- 适用：需要快速构建带分页、搜索、删除功能的列表页

## 演示

:::preview 基础列表 || 分页/搜索/删除演示
demo-preview=../examples/demos/TablePageDemo.vue
:::

## API

- 入参
  - `fetchData(params): Promise<any>` 列表数据接口，返回对象需包含数据与总数
  - `searchForm = {}` 初始搜索参数
  - `config: TablePageConfig` 列表页配置（`dataKey`、`totalKey`、`autoFetch`、`timeFields`、`arrayFields`、`preprocessParams` 等）
  - `deleteConfig: DeleteConfig` 删除相关配置（单删/批删/清空、确认文案、回调等）
  - `exportConfig?: ExportConfig` 导出字段配置（数组与时间字段）

- 返回
  - `tableData, loading, pageInfo, searchParams, selectedRows, selectedIds`
  - 基础方法：`getTableData, handleSearch, handleReset, handlePageChange, handleSizeChange`
  - 删除方法：`handleSelectionChange, handleDelete, handleBatchDelete`
  - 导出方法：`handleExport`
  - 结合自定义表格：`tableConfig, tableEventHandlers, setTableColumns`

### 结构化参考

- 状态
  - `tableData`
  - `loading` / `deleteLoading`
  - `pageInfo`（`pageNum/pageSize/total`）
  - `searchParams`
  - `selectedRows` / `selectedIds`
- 方法
  - `getTableData()`
  - `handleSearch()` / `handleReset()`
  - `handlePageChange(page)` / `handleSizeChange(size)`
  - `handleSelectionChange(selection)`
  - `handleDelete(row)` / `handleBatchDelete()`
  - `handleExport(url, filename, params?)`
  - `setTableColumns(columns)`
- 事件
  - `tableEventHandlers.onAction(event, row, index)`：操作列事件分发（`delete` 走内置删除，其它走自定义）
- 类型
  - `TablePageConfig`、`DeleteConfig`、`CustomTableConfig`、`ExportConfig`

## 使用要点

- 时间范围处理：通过 `timeFields` 配置将 `daterange` 转换为后端所需字段
- 数组到字符串：通过 `arrayFields` 将数组查询项转换为指定分隔符的字符串
- 自动导入：配合 Element Plus 与 Vue 的自动导入，`ElMessage/ElMessageBox` 可直接使用

## 快速上手

```ts
/**
 * 最小示例：获取列表并分页
 * 功能：演示基本入参与返回值
 */
import useTablePage from '@/hooks/useTablePage'

const fetchData = async (params: any): Promise<{ rows: any[]; total: number }> => {
  // 调用后端接口
  return { rows: [], total: 0 }
}

const {
  tableData,
  loading,
  pageInfo,
  searchParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange
} = useTablePage(fetchData, { keyword: '' }, { dataKey: 'rows', totalKey: 'total', autoFetch: true })
```

```vue
<template>
  <el-input v-model="searchParams.keyword" placeholder="关键字" />
  <el-button type="primary" @click="handleSearch">搜索</el-button>
  <el-table :data="tableData" v-loading="loading">
    <el-table-column prop="id" label="ID" />
    <el-table-column prop="name" label="名称" />
  </el-table>
  <el-pagination :current-page="pageInfo.pageNum" :page-size="pageInfo.pageSize" :total="pageInfo.total" @current-change="handlePageChange" @size-change="handleSizeChange" />
  </template>
```

## 进阶用法

```ts
/**
 * 进阶：时间范围、数组字段、参数预处理与导出
 * 功能：展示完整配置的常见组合
 */
import useTablePage from '@/hooks/useTablePage'

const fetchData = async (params: any): Promise<{ rows: any[]; total: number }> => ({ rows: [], total: 0 })
const deleteApi = async (id: number) => ({ msg: '删除成功' })
const batchDeleteApi = async (ids: number[]) => ({ msg: `批量删除 ${ids.length} 条` })

const hook = useTablePage(
  fetchData,
  { keyword: '', tags: [], createRange: [] },
  {
    dataKey: 'rows',
    totalKey: 'total',
    autoFetch: true,
    arrayFields: ['tags'],
    timeFields: [{ field: 'createRange', prefix: { start: 'beginTime', end: 'endTime' } }],
    preprocessParams: (params) => {
      // 去空值、加默认排序等
      if (!params.keyword && (!params.tags || params.tags.length === 0)) return params
      return params
    }
  },
  { deleteApi, batchDeleteApi },
  { arrayFields: ['tags'], timeFields: [{ field: 'createRange', prefix: 'create' }], idKey: 'id' }
)

// 导出：调用 hook.handleExport('/api/export', '列表')
```

## 最佳实践

- 参数预处理：统一在 `preprocessParams` 中清理空值与转换类型，避免后端解析异常
```ts
const hook = useTablePage(fetchData, { keyword: '', range: [] }, {
  preprocessParams: (p) => {
    const { processTimeRange, cleanEmptyFields } = useDataTransform()
    const t = processTimeRange(p, 'range', { start: 'beginTime', end: 'endTime' })
    return cleanEmptyFields(t)
  }
})
```
- 删除体验：批量删除后检查当前页是否为空，必要时回退上一页（已内置处理）
- 导出安全：使用 `exportConfig.idKey` 指定唯一键，避免误删或错导
- 动态列：通过 `setTableColumns` 切换列展示，配合 `watch` 监听外部开关

## 常见问题

- 数据字段不一致：设置 `dataKey/totalKey` 与后端保持一致。
- 时间范围不兼容：通过 `timeFields` 将 `daterange` 转换为后端所需字段名。
- 删除后分页跳转：内部已处理“删除后当前页为空则回退上一页”。

## 更多资源

- 示例索引：/demos
- 相关：/hooks/use-form-dialog、/hooks/use-data-transform、/hooks/use-crud-page

## 高级预览：自定义列与操作按钮

:::preview 完整列表 || 完整配置/导出/自定义操作演示
demo-preview=../examples/demos/TablePageAdvancedDemo.vue
:::

### 说明

- 连续序号：配置 `customTableConfig.index` 后，内部为 `index` 列自动计算跨页连续序号（模板通过 `:index="tableConfig.index.index"` 使用）。
- 选择列：当 `customTableConfig.selection` 开启时，使用 `@selection-change` 配合 `tableEventHandlers.onSelectionChange` 更新选中状态。
- 操作列：在列配置中使用 `type: 'action'` 与 `buttons`，点击按钮通过 `onAction(event, row, index)` 触发；
  - 事件名为 `delete` 时，内置删除逻辑自动执行；
  - 其他事件通过 `customTableConfig.onCustomAction` 自定义处理（如弹出提示、打开弹窗等）。

## 高级预览：动态列/权限与展开

:::preview 复杂列表 || 高级搜索/批量操作/自定义列演示
demo-preview=../examples/demos/TablePageComplexDemo.vue
:::

### 说明

- 动态列：通过 `setTableColumns(columns)` 在运行时切换列集合；结合 `ref + watch` 可实现“列开关”。
- 权限控制：在按钮配置中使用 `visible(row)` 与 `disabled(row)` 实现可见性与禁用逻辑；也可读取外部权限开关。
- 展开列：使用 `type: 'expand'` 渲染详情区域，适合卡片或 `el-descriptions` 展示。
