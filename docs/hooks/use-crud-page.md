# useCrudPage

集成表格展示、表单弹窗、数据转换等功能的综合性 Hook。它组合了 `useTablePage` 和 `useFormDialog` 的功能，提供了一站式的 CRUD 页面解决方案。

## 基础用法

通过 `useCrudPage` 可以快速构建具备列表展示、搜索、分页、新增、编辑、删除、批量删除等功能的 CRUD 页面。

::: preview 基础 CRUD 示例
demo-preview=@examples/use-crud-page/basic.vue
:::

## 简化配置模式 (SimpleCrudConfig)

`useCrudPage` 推荐使用简化配置模式，它将配置分为五个核心部分：`apis`、`table`、`form`、`search` 和 `advanced`。

### 1. apis - 接口配置

定义 CRUD 所需的所有 API 接口。

```typescript
const { ... } = useCrudPage({
  apis: {
    // 列表查询 (必填)
    list: (params) => request.get('/api/list', { params }),

    // 新增 (必填)
    add: (data) => request.post('/api/add', data),

    // 更新 (必填)
    update: (data) => request.put('/api/update', data),

    // 删除 (必填)
    delete: (id) => request.delete(`/api/delete/${id}`),

    // 批量删除 (可选)
    batchDelete: (ids) => request.post('/api/batch-delete', { ids }),

    // 获取详情 (可选)
    // 如果不提供，编辑回显时将直接使用表格行数据
    get: (id) => request.get(`/api/detail/${id}`),

    // 导出 (可选)
    export: (params) => request.download('/api/export', params)
  },
  // ...
})
```

### 2. table - 表格配置

基于 `CustomTable` 组件的配置。

```typescript
const { ... } = useCrudPage({
  table: {
    // 响应数据中的字段映射
    dataKey: 'rows', // 列表数据字段，默认 'rows'
    totalKey: 'total', // 总数字段，默认 'total'

    // 是否挂载时自动请求数据，默认 true
    autoFetch: true,

    // CustomTable 组件配置
    config: {
      selection: true, // 开启多选
      index: { label: '#', width: 60, align: 'center' }, // 开启序号

      // 列配置
      columns: [
        { prop: 'name', label: '名称', minWidth: 120 },
        // 使用自定义插槽 (slotName)
        { prop: 'status', label: '状态', width: 100, slotName: 'status' },
        // 操作列 (type: 'action')
        {
          prop: 'action',
          label: '操作',
          type: 'action',
          width: 150,
          buttons: [
            // 自动绑定 edit 事件
            { event: 'edit', btnText: '编辑' },
            // 自动绑定 delete 事件
            { event: 'delete', btnText: '删除', type: 'danger' }
          ]
        }
      ]
    },

    // 自定义操作列事件处理 (非 edit/delete 事件)
    onCustomAction: (event, row, index) => {
      if (event === 'view') {
        console.log('查看详情', row)
      }
    }
  }
})
```

### 3. form - 表单配置

控制新增/编辑弹窗的行为。

```typescript
const { ... } = useCrudPage({
  form: {
    // 表单初始数据 (必填)
    initialData: {
      name: '',
      status: 1,
      tags: []
    },

    // 表单校验规则 (Element Plus 格式)
    rules: {
      name: [{ required: true, message: '请输入名称' }]
    },

    // 提交成功后的回调 (默认会自动刷新列表)
    onSuccess: () => {
      ElMessage.success('操作成功')
    },

    // 提交前的数据转换 (手动模式)
    beforeSubmit: (data) => {
      return { ...data, status: data.status ? 1 : 0 }
    }
  }
})
```

### 4. search - 搜索配置

管理顶部的搜索栏状态。

```typescript
const { ... } = useCrudPage({
  search: {
    // 搜索表单初始数据
    initialData: {
      keyword: '',
      createTime: []
    },

    // 搜索前的参数处理 (例如格式化日期)
    beforeSearch: (params) => {
      // 注意：推荐使用 advanced.timeFields 自动处理时间
      return params
    }
  }
})
```

### 5. advanced - 高级配置

集成了 `useDataTransform` 的自动化功能。

```typescript
const { ... } = useCrudPage({
  advanced: {
    // 数组字段自动转换
    // 提交时：['Vue', 'React'] -> "Vue,React"
    // 回显时： "Vue,React" -> ['Vue', 'React']
    arrayFields: ['tags', 'roles'],

    // 时间范围字段自动拆分
    // 搜索/提交时：{ date: ['2024-01-01', '2024-01-31'] }
    // -> { startDate: '2024-01-01', endDate: '2024-01-31' }
    timeFields: [
      // 方式 1: 默认生成 beginDate/endDate
      { field: 'date' },
      // 方式 2: 指定前后缀
      { field: 'createTime', prefix: { start: 'start', end: 'end' } }
    ],

    // 更多回调
    callbacks: {
      onDeleteSuccess: () => console.log('删除成功'),
      onBatchDeleteSuccess: () => console.log('批量删除成功')
    }
  }
})
```

### 综合配置示例 (SimpleCrudConfig)

以下是一个包含所有配置项的简化配置示例：

```typescript
const {
  // 1. 表格相关状态
  tableData,       // 表格列表数据
  total,           // 数据总条数
  loading,         // 表格加载 loading
  pageInfo,        // 分页信息 { pageNum, pageSize }
  selection,       // 当前选中的行数组

  // 2. 表单相关状态
  dialogVisible,   // 弹窗显示状态
  dialogMode,      // 弹窗模式：'add' | 'edit' | 'view'
  formData,        // 表单数据对象
  submitLoading,   // 提交按钮 loading

  // 3. 搜索相关状态
  searchParams,    // 搜索表单数据

  // 4. 操作方法
  getTableData,    // 手动刷新列表
  handleSearch,    // 触发搜索 (重置页码为1)
  handleReset,     // 重置搜索条件
  openDialog,      // 打开弹窗：openDialog('add') 或 openDialog('edit', row)
  handleDelete,    // 处理单条删除：handleDelete(row)
  handleBatchDelete, // 处理批量删除
  handleExport,    // 触发导出
  submitForm,      // 提交表单

  // 5. 绑定到组件的属性 (通常直接透传)
  cusTableConfig,     // 计算后的表格配置，绑定到 <CustomTable :config="cusTableConfig">
  tableEventHandlers, // 表格事件处理，绑定到 <CustomTable v-on="tableEventHandlers">
  handleDialogClose   // 弹窗关闭事件，绑定到 <el-dialog @close="handleDialogClose">
} = useCrudPage({
  // 1. 接口配置 (apis)
  apis: {
    list: api.getList,         // 列表接口：需返回 { rows: [], total: 100 } 格式
    add: api.add,              // 新增接口
    update: api.update,        // 更新接口
    delete: api.delete,        // 删除接口
    batchDelete: api.batchDelete, // 批量删除接口 (可选)
    export: api.export         // 导出接口 (可选)
  },

  // 2. 表格配置 (table)
  table: {
    dataKey: 'rows',           // 列表数据在接口响应中的字段名，默认为 'rows'
    config: {
      selection: true,         // 开启多选框列
      columns: [
        { prop: 'name', label: '名称' }, // 普通文本列
        { prop: 'action', label: '操作', type: 'action', buttons: [
           // 操作列按钮配置
           { event: 'edit', btnText: '编辑' }, // 触发编辑弹窗
           { event: 'delete', btnText: '删除', type: 'danger' } // 触发删除确认
        ] }
      ]
    }
  },

  // 3. 表单配置 (form)
  form: {
    // 弹窗表单的初始数据结构
    initialData: { name: '', tags: [] },
    // 表单校验规则 (Element Plus 格式)
    rules: { name: [{ required: true }] },
    // 提交成功后的回调
    onSuccess: () => ElMessage.success('操作成功')
  },

  // 4. 搜索配置 (search)
  search: {
    // 搜索表单的初始数据结构
    initialData: { keyword: '' }
  },

  // 5. 高级配置 (advanced)
  advanced: {
    // 指定需要自动转换格式的字段 (数组 <-> 逗号分隔字符串)
    arrayFields: ['tags']
  }
})
```

## 高级用法示例

该示例展示了：
*   **数据自动转换**：数组转字符串 (`arrayFields`)、时间范围拆分 (`timeFields`)。
*   **自定义表格列**：使用插槽自定义状态和标签展示。
*   **复杂搜索与表单联动**。

::: preview 包含数据转换与自定义列的综合示例
demo-preview=@examples/use-crud-page/advanced.vue
:::

## 完整配置模式 (CrudPageConfig)

如果你需要更精细的控制，可以使用完整配置模式。此模式下，参数将直接透传给底层的 `useTablePage` 和 `useFormDialog`。

`CrudPageConfig` 继承自 `FormDialogConfig`, `TablePageConfig`, `DeleteConfig` 和 `ExportConfig`。

### 1. 基础 API 配置

```typescript
const { ... } = useCrudPage({
  // 获取列表数据的 API (必填)
  listApi: (params) => request.get('/list', { params }),

  // 新增数据的 API (必填)
  addApi: (data) => request.post('/add', data),

  // 更新数据的 API (必填)
  updateApi: (data) => request.put('/update', data),

  // 获取详情的 API (可选)
  getApi: (id) => request.get(`/detail/${id}`),

  // 删除数据的 API (可选)
  deleteApi: (id) => request.delete(`/delete/${id}`),

  // 批量删除数据的 API (可选)
  batchDeleteApi: (ids) => request.post('/batch-delete', { ids }),

  // 导出 URL (可选)
  exportUrl: '/api/export'
})
```

### 2. 表单配置 (FormDialogConfig)

```typescript
const { ... } = useCrudPage({
  // 表单初始数据 (必填)
  initialFormData: { name: '', age: 0 },

  // 表单校验规则 (可选)
  formRules: { name: [{ required: true, message: 'Required' }] },

  // 数据转换 (可选)
  dataTransform: {
    // 提交前转换：T -> any
    beforeSubmit: (data) => ({ ...data, status: 1 }),
    // 获取后转换：any -> T
    afterGet: (data) => ({ ...data, tags: data.tags.split(',') })
  },

  // 提交成功回调 (可选)
  onSuccess: () => { console.log('Refresh list') },

  // 自定义提交成功处理 (可选)
  onSubmitSuccess: (res, mode, formData) => { ... }
})
```

### 3. 表格配置 (TablePageConfig)

```typescript
const { ... } = useCrudPage({
  // CustomTable 组件配置 (可选)
  customTableConfig: {
    columns: [...],
    selection: true,
    pagination: { pageSize: 20 }
  },

  // 响应数据字段映射 (可选)
  dataKey: 'data.list', // 默认为 'rows'
  totalKey: 'data.total', // 默认为 'total'

  // 是否自动获取数据 (可选)
  autoFetch: false, // 默认为 true

  // 搜索参数预处理 (可选)
  beforeSearch: (params) => ({ ...params, type: 1 })
})
```

### 4. 其他配置

```typescript
const { ... } = useCrudPage({
  // 删除确认提示文字 (可选)
  confirmMessage: '确定要删除该项吗？',

  // 批量删除确认提示文字 (可选)
  batchConfirmMessage: '确定要删除选中项吗？',

  // 数据主键字段名 (可选)
  idKey: 'uuid', // 默认为 'id'

  // 数组字段 (用于自动转换和导出)
  arrayFields: ['tags'],

  // 时间字段 (用于自动拆分和导出)
  timeFields: [{ field: 'date', prefix: 'create' }]
})
```

### 综合配置示例 (CrudPageConfig)

以下是一个包含所有配置项的完整配置示例：

```typescript
const {
  // 1. 表格相关状态
  tableData,       // 表格列表数据
  total,           // 数据总条数
  loading,         // 表格加载 loading
  pageInfo,        // 分页信息 { pageNum, pageSize }
  selection,       // 当前选中的行数组

  // 2. 表单相关状态
  dialogVisible,   // 弹窗显示状态
  dialogMode,      // 弹窗模式：'add' | 'edit' | 'view'
  formData,        // 表单数据对象
  submitLoading,   // 提交按钮 loading

  // 3. 搜索相关状态
  searchParams,    // 搜索表单数据

  // 4. 操作方法
  getTableData,    // 手动刷新列表
  handleSearch,    // 触发搜索 (重置页码为1)
  handleReset,     // 重置搜索条件
  openDialog,      // 打开弹窗：openDialog('add') 或 openDialog('edit', row)
  handleDelete,    // 处理单条删除：handleDelete(row)
  handleBatchDelete, // 处理批量删除
  handleExport,    // 触发导出
  submitForm,      // 提交表单

  // 5. 绑定到组件的属性 (通常直接透传)
  cusTableConfig,     // 计算后的表格配置，绑定到 <CustomTable :config="cusTableConfig">
  tableEventHandlers, // 表格事件处理，绑定到 <CustomTable v-on="tableEventHandlers">
  handleDialogClose   // 弹窗关闭事件，绑定到 <el-dialog @close="handleDialogClose">
} = useCrudPage({
  // 1. API 配置
  listApi: api.getList,        // 获取列表数据的 API
  addApi: api.add,             // 新增数据的 API
  updateApi: api.update,       // 更新数据的 API
  deleteApi: api.delete,       // 删除数据的 API
  batchDeleteApi: api.batchDelete, // 批量删除数据的 API

  // 2. 表格配置
  customTableConfig: {
    selection: true,           // 是否显示多选框
    columns: [
      { prop: 'name', label: '名称' },
      { prop: 'action', label: '操作', type: 'action', buttons: [
         { event: 'edit', btnText: '编辑' },
         { event: 'delete', btnText: '删除', type: 'danger' }
      ] }
    ]
  },

  // 3. 表单配置
  initialFormData: { name: '', tags: [] }, // 表单初始数据
  formRules: { name: [{ required: true }] }, // 表单校验规则

  // 4. 数据转换
  dataTransform: {
    // 提交前：将数据转换为后端所需格式
    beforeSubmit: (data) => ({ ...data, status: 1 }),
    // 获取详情后：将数据转换为表单所需格式
    afterGet: (data) => ({ ...data, tags: data.tags.split(',') })
  },

  // 5. 其他配置
  idKey: 'uuid',               // 指定主键字段名，默认为 'id'
  confirmMessage: '确认删除？', // 删除确认框的提示文本
  arrayFields: ['tags'],       // 自动处理数组字段转换
  timeFields: [{ field: 'date', prefix: 'create' }] // 自动处理时间范围字段拆分
})
```

## 返回值详解

Hook 返回一个包含表格状态、表单状态和操作方法的对象。

### 表格相关

| 属性/方法 | 类型 | 说明 |
| --- | --- | --- |
| `tableData` | `Ref<any[]>` | 表格数据列表 |
| `total` | `Ref<number>` | 数据总条数 |
| `loading` | `Ref<boolean>` | 表格加载状态 |
| `pageInfo` | `Reactive` | 分页信息 `{ pageNum, pageSize }` |
| `searchParams` | `Reactive` | 搜索表单数据 |
| `selection` | `Ref<any[]>` | 当前选中的行数组 |
| `cusTableConfig` | `Computed` | 计算后的表格配置，传给 CustomTable |
| `tableEventHandlers` | `Object` | 包含 `onSelectionChange`, `onPagination`, `onAction` 等事件处理 |
| `getTableData` | `Function` | 手动触发列表刷新 |
| `handleSearch` | `Function` | 触发搜索（重置页码为1） |
| `handleReset` | `Function` | 重置搜索条件 |
| `handleDelete` | `Function` | 处理单条删除 |
| `handleBatchDelete` | `Function` | 处理批量删除 |
| `handleExport` | `Function` | 触发导出 |

### 表单相关

| 属性/方法 | 类型 | 说明 |
| --- | --- | --- |
| `dialogVisible` | `Ref<boolean>` | 弹窗是否可见 |
| `dialogMode` | `Ref<string>` | 模式：'add', 'edit', 'view' |
| `formData` | `Ref<T>` | 表单数据对象 |
| `submitLoading` | `Ref<boolean>` | 提交按钮 loading |
| `openDialog` | `Function` | 打开弹窗：`openDialog('add')` 或 `openDialog('edit', row)` |
| `handleDialogClose` | `Function` | 关闭弹窗 |
| `submitForm` | `Function` | 提交表单 |

### 辅助方法

| 属性/方法 | 类型 | 说明 |
| --- | --- | --- |
| `arrayToString` | `Function` | 工具：数组转字符串 |
| `stringToArray` | `Function` | 工具：字符串转数组 |
| `handleBatchImport` | `Function` | 触发批量导入（需自行实现 UI） |
