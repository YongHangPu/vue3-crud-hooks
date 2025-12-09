---
title: useCrudPage
---

# useCrudPage

- 功能：整合 `useTablePage` 与 `useFormDialog`，以统一配置驱动 CRUD 页面
- 适用：组件库/业务页面复用 CRUD 模板，简化配置

## 演示

:::preview 综合 CRUD Hook || 列表/搜索/分页/增删改/编辑弹窗演示
demo-preview=../examples/demos/CrudPageDemo.vue
:::

## API

- 支持两种配置方式
  - 简化配置 `SimpleCrudConfig<T>`：`apis`、`form`、`search`、`table`、`advanced`
  - 完整配置 `CrudPageConfig<T>`：与内部 Hook 保持一致，向后兼容

- 常用字段
  - `apis.list/add/update/delete/batchDelete/deleteAll/get`
  - `form.initialData/rules/onSuccess`
  - `search.initialParams/timeFields/arrayFields`
  - `table.autoFetch` 与 `customTableConfig`

- 返回（与内部 Hook 合并）
  - 列表：`tableData, loading, pageInfo, searchParams, selectedRows, selectedIds`
  - 表单：`dialogVisible, dialogMode, formRef, submitLoading, formLoading, formData`
  - 方法：`handleSearch, handleReset, handlePageChange, handleSizeChange, handleSelectionChange, handleDelete, handleBatchDelete, openDialog, submitForm, resetForm, handleDialogClose, handleExport`

### 结构化参考

- 状态
  - 列表：`tableData`、`loading`、`pageInfo`、`searchParams`、`selectedRows/selectedIds`
  - 表单：`dialogVisible/dialogMode`、`formRef`、`submitLoading/formLoading`、`formData`
- 方法
  - 列表：`getTableData`、`handleSearch/handleReset`、`handlePageChange/handleSizeChange`、`handleSelectionChange`、`handleDelete/handleBatchDelete`、`handleExport`
  - 表单：`openDialog`、`submitForm`、`resetForm`、`handleDialogClose`
- 事件
  - 操作列：`tableEventHandlers.onAction(event, row, index)`（在 CRUD 中扩展支持 `edit` 打开弹窗）
- 类型
  - `SimpleCrudConfig<T>`、`CrudPageConfig<T>`、`CustomTableConfig`

## 使用要点

- 若已有旧配置可直接传入 `CrudPageConfig<T>`，避免迁移成本
- 简化配置适合从零开始的页面，字段更直观

## 快速上手（简化配置）

```ts
/**
 * 简化配置：最小 CRUD 页面
 */
import { useCrudPage } from '@/hooks/useCrudPage'

const list = async (params: any) => ({ rows: [], total: 0 })
const add = async (data: any) => ({ msg: '新增成功' })
const update = async (data: any) => ({ msg: '更新成功' })
const del = async (id: number) => ({ msg: '删除成功' })

const hook = useCrudPage({
  apis: { list, add, update, delete: del },
  form: { initialData: { name: '' }, rules: { name: [{ required: true }] } },
  search: { initialParams: { keyword: '' } },
  table: { autoFetch: true }
})
```

## 完整配置（向后兼容）

```ts
/**
 * 完整配置：兼容旧配置结构
 */
import { useCrudPage } from '@/hooks/useCrudPage'

const hook = useCrudPage({
  listApi: async (p) => ({ rows: [], total: 0 }),
  addApi: async (d) => ({ msg: '新增成功' }),
  updateApi: async (d) => ({ msg: '更新成功' }),
  deleteApi: async (id) => ({ msg: '删除成功' }),
  getApi: async (id) => ({ data: { id, name: '示例' } }),
  initialFormData: { name: '' },
  initialSearchForm: { keyword: '' },
  formRules: { name: [{ required: true }] },
  arrayFields: ['tags'],
  timeFields: [{ field: 'range', prefix: { start: 'beginTime', end: 'endTime' } }],
  tableConfig: { dataKey: 'rows', totalKey: 'total', autoFetch: true }
})
```

## 最佳实践

- 配置选择：从零开始优先使用简化配置；项目内混合场景统一转换为完整配置
```ts
const hook = useCrudPage({
  apis: { list, add, update, delete: del, get },
  form: { initialData: { name: '' } },
  search: { initialParams: { keyword: '', range: [] } },
  table: { autoFetch: true, customTableConfig: { columns: [{ prop: 'name', label: '名称' }] } }
})
```
- 事件打通：在 CRUD 中扩展 `tableEventHandlers.onAction`，`edit` 直接打开弹窗，其它交由 `useTablePage` 处理
- 数据一致性：通过 `arrayFields/timeFields` 保持列表与表单的字段转换一致

## 常见问题

- 事件未分发：检查 `tableEventHandlers.onAction` 是否被覆盖或未调用。
- 配置冲突：简化与完整配置不要混用；若共存优先转换为完整配置后统一传入。
- 删除后刷新：建议通过 `onDeleteSuccess/onBatchDeleteSuccess` 或在默认逻辑里调用 `getTableData`。

## 更多资源

- 示例索引：/demos
- 相关：/hooks/use-table-page、/hooks/use-form-dialog、/hooks/use-data-transform
