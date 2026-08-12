# useCrudPage

一站式 CRUD 页面 Hook，整合 **列表查询、分页搜索、新增、编辑、删除、批量删除、数据导出** 全流程。内部组合 `useTablePage` + `useFormDialog` + `useDataTransform`。

## 基础用法

一个 Hook + `v-bind="tableBindings"` 即可完成完整 CRUD 页面。

::: preview 基础 CRUD 示例
demo-preview=../examples/use-crud-page/basic.vue
:::

## API 参考

### 入参

```typescript
useCrudPage<T = any>(config: CrudPageConfig<T>): CrudPageHook<T>
```

### 返回值

| 返回值 | 类型 | 说明 |
|-------|------|------|
| **`tableBindings`** | `ComputedRef` | ⭐ **一键绑定到 `<CustomTable v-bind="tableBindings">`** |
| `tableData` | `Ref<T[]>` | 表格数据 |
| `loading` | `Ref<boolean>` | 表格加载状态 |
| `deleteLoading` | `Ref<boolean>` | 删除操作加载状态 |
| `pageInfo` | `Reactive` | `{ pageNum, pageSize, total }` 分页信息 |
| `searchParams` | `Reactive` | 搜索表单数据（响应式，支持 v-model） |
| `selectedRows` | `Ref<T[]>` | 当前选中的行数据 |
| `selectedIds` | `ComputedRef` | 选中行 ID 列表（基于 `idKey` 提取） |
| `getTableData` | `() => Promise<void>` | 手动刷新列表 |
| `handleSearch` | `() => void` | 搜索（页码重置为 1 后刷新） |
| `handleReset` | `() => void` | 重置搜索条件并刷新 |
| `handleSelectionChange` | `(selection) => void` | 选择变化 |
| `sortInfo` | `Reactive` | 服务端排序信息 `{ prop, order }`（启用 `sortable` 后维护） |
| `filterInfo` | `Reactive` | 服务端筛选信息 `{ [prop]: values[] }`（启用 `filterable` 后维护） |
| `handleSortChange` | `(sort) => void` | 排序变化处理（更新 `sortInfo` 并刷新） |
| `handleFilterChange` | `(filters) => void` | 筛选变化处理（合并更新 `filterInfo` 并刷新） |
| `handleDelete` | `(row: T) => Promise<void>` | 弹出确认框后删除 |
| `handleBatchDelete` | `() => Promise<void>` | 批量删除选中行 |
| `handleExport` | `(options?) => void` | 导出数据（自动合并搜索参数与选中 ID） |
| `exportLoading` | `Ref<boolean>` | 导出操作加载状态 |
| `setTableColumns` | `(columns) => void` | 动态更新列配置 |
| `toggleColumn` | `(prop, visible?) => void` | 切换列显隐（`visible` 缺省时取反当前状态） |
| `getVisibleColumns` | `() => TableColumnConfig[]` | 获取当前可见列 |
| `dialogVisible` | `Ref<boolean>` | 弹窗显示状态（支持 v-model） |
| `dialogMode` | `Ref<'add' \| 'edit'>` | 弹窗模式 |
| `formData` | `Ref<T>` | 表单数据 |
| `formRef` | `Ref` | el-form 引用（需手动绑定） |
| `formRules` | `ComputedRef` | 表单校验规则（绑定到 el-form 的 `:rules`） |
| `submitLoading` | `Ref<boolean>` | 提交按钮加载状态 |
| `formLoading` | `Ref<boolean>` | 编辑回显加载状态 |
| `openDialog` | `(mode, row?) => void` | 打开弹窗 |
| `submitForm` | `() => Promise<void>` | 提交表单（验证 + 转换 + API） |
| `resetForm` | `() => void` | 重置表单 |
| `handleDialogClose` | `() => void` | 关闭弹窗 |

### 配置项：`CrudPageConfig<T>`

#### `apis` — API 接口配置

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `list` | `(params) => Promise<any>` | ✅ | 列表查询接口 |
| `add` | `(data: T) => Promise<any>` | ✅ | 新增接口 |
| `update` | `(data: T) => Promise<any>` | ✅ | 编辑接口 |
| `delete` | `(id) => Promise<any>` | — | 删除接口（未提供时 handleDelete 不可用） |
| `batchDelete` | `(ids) => Promise<any>` | — | 批量删除接口 |
| `get` | `(id) => Promise<any>` | — | 获取详情接口（编辑回显示调用） |
| `export` | `(options) => Promise<any>` | — | 导出接口 |

#### `table` — 表格配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `config` | `CustomTableConfig` | — | CustomTable 组件配置（列定义、序号、分页等） |
| `idKey` | `string` | `'id'` | 数据主键字段名 |
| `dataKey` | `string` | `'rows'` | 接口响应中列表数据的字段名 |
| `totalKey` | `string` | `'total'` | 接口响应中总数字段名 |
| `autoFetch` | `boolean` | `true` | 是否在挂载时自动请求数据 |
| `autoDetect` | `boolean` | `true` | 是否自动检测响应数据结构 |
| `exportUrl` | `string` | — | 导出下载 URL（未配置 export 接口时使用） |
| `onCustomAction` | `(event, row, index) => void` | — | 自定义事件处理器 |
| `transformResponse` | `(result) => { data, total } \| null` | — | 自定义列表响应解析，返回 `null`/`undefined` 回退默认解析 |
| `sortable` | `boolean \| (sort) => params` | — | 服务端排序：`true` 启用默认映射（`{ orderByColumn, isAsc }`），传函数可自定义映射 |
| `filterable` | `boolean \| (filters) => params` | — | 服务端筛选：`true` 启用（筛选值数组展开进请求），传函数可自定义映射 |

#### `form` — 表单配置

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `initialData` | `T` | ✅ | 表单初始数据结构 |
| `rules` | `any` | — | Element Plus 表单校验规则 |
| `beforeSubmit` | `(data: T) => any` | — | 提交前数据转换 |
| `afterGet` | `(data: any) => T` | — | 获取详情后数据转换 |
| `onAfterSubmit` | `() => void` | — | 提交成功后回调（默认自动刷新列表） |
| `onSubmitSuccess` | `(res, mode, formData) => void` | — | API 调用成功后的回调 |

#### `search` — 搜索配置

| 属性 | 类型 | 说明 |
|------|------|------|
| `initialData` | `Record<string, any>` | 搜索表单初始值 |
| `beforeSearch` | `(params) => any` | 搜索前参数转换，返回 `false` 阻止请求 |

#### `advanced` — 高级配置

| 属性 | 类型 | 说明 |
|------|------|------|
| `arrayFields` | `string[]` | 数组字段（前端 `string[]` ↔ 后端逗号字符串自动转换） |
| `timeFields` | `Array<{ field, prefix }>` | 时间范围字段（自动拆分为 `start`/`end` 两个参数） |
| `messageApi` | `Partial<MessageApi>` | 自定义消息提示 API |
| `onDeleteSuccess` | `(row) => void` | 单行删除成功回调 |
| `onBatchDeleteSuccess` | `(rows) => void` | 批量删除成功回调 |
| `isSuccess` | `(result) => boolean` | 业务成功判断，默认自动识别 `code ∈ [0, 200, 1, '0', '200', '1']` |
| `onExportSuccess` | `(result) => void` | 导出成功回调（`apis.export` resolve 后触发） |
| `onExportError` | `(error) => void` | 导出失败回调（不配置时默认提示错误消息） |

## 配置详解

### apis：接口定义

CrudPage 围绕七个核心接口展开，全部通过 `apis` 配置：

```typescript
useCrudPage({
  apis: {
    // 列表查询：接收 { pageNum, pageSize, ...searchParams } 返回 { rows, total }
    list: (params) => request.get('/api/users', { params }),
    // 新增：接收表单数据
    add: (data) => request.post('/api/users', data),
    // 编辑：接收表单数据
    update: (data) => request.put(`/api/users/${data.id}`, data),
    // 删除：接收主键值
    delete: (id) => request.delete(`/api/users/${id}`),
    // 可选：批量删除
    batchDelete: (ids) => request.post('/api/users/batch-delete', { ids }),
    // 可选：获取详情（编辑时回显）
    get: (id) => request.get(`/api/users/${id}`),
    // 可选：导出（返回 Blob 或 { blob } 时库自动触发浏览器下载）
    export: ({ params }) => request.download('/api/users/export', params),
  }
})
```

### table.config：CustomTable 列配置

通过 `table.config` 配置表格的列、序号、多选、分页：

```typescript
useCrudPage({
  table: {
    config: {
      // 多选列
      selection: true,
      // 序号列（自动翻页连续序号）
      index: { label: '#', width: 60, align: 'center' },
      // 列定义
      columns: [
        // 普通列
        { prop: 'name', label: '名称', minWidth: 120 },
        // 使用插槽的自定义列
        { prop: 'status', label: '状态', slotName: 'status' },
        // 操作列（内置按钮事件）
        {
          type: 'action',
          label: '操作',
          width: 200,
          buttons: [
            { event: 'edit', btnText: '编辑', type: 'primary' },
            { event: 'delete', btnText: '删除', type: 'danger' },
          ],
        },
      ],
      // 分页配置
      pagination: { currentPage: 1, pageSize: 20 },
    },
  },
})
```

操作列的 `buttons` 按钮支持以下属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| `event` | `string` | 事件名：`edit`/`delete` 自动绑定对应操作，其他触发 `onCustomAction` |
| `btnText` | `string` | 按钮文本 |
| `btnType` | `'link' \| 'button'` | 按钮展现类型 |
| `type` | `'primary' \| 'danger' \| ...` | 按钮样式 |
| `disabled` | `boolean \| (row) => boolean` | 是否禁用 |
| `visible` | `(row) => boolean` | 是否可见 |
| `props` | `Record<string, any>` | 其他透传到 el-button / el-link 的属性 |

### form：表单初始数据与校验

```typescript
useCrudPage({
  form: {
    // 必须提供初始数据结构
    initialData: { name: '', status: 1, tags: [] },
    // Element Plus 校验规则
    rules: {
      name: [{ required: true, message: '请输入名称' }],
    },
    // 提交前转换（用于数据格式化）
    beforeSubmit: (data) => ({
      ...data,
      status: data.status ? 1 : 0,
    }),
  },
})
```

### search：搜索配置

```typescript
useCrudPage({
  search: {
    // 搜索栏初始值
    initialData: { keyword: '', status: undefined, createTime: [] },
    // 搜索前参数处理
    beforeSearch: (params) => {
      if (!params.keyword) delete params.keyword
      return params
    },
  },
})
```

`searchParams` 是响应式对象，可直接通过 `v-model` 绑定到搜索表单。

### advanced：数据自动转换

**数组字段自动转换**：

当 `arrayFields: ['tags']` 配置后：
- 搜索时：`{ tags: ['Vue', 'React'] }` → `{ tags: 'Vue,React' }`
- 编辑回显时：后端返回 `{ tags: 'Vue,React' }` → 表单中 `{ tags: ['Vue', 'React'] }`

**时间范围自动拆分**：

当 `timeFields: [{ field: 'createTime', prefix: { start: 'startTime', end: 'endTime' } }]` 配置后：
- 搜索时：`{ createTime: ['2024-01-01', '2024-01-31'] }` → `{ startTime: '2024-01-01', endTime: '2024-01-31' }`

## 高级示例

::: preview 包含数据转换、时间范围、导出的综合示例
demo-preview=../examples/use-crud-page/advanced.vue
:::
