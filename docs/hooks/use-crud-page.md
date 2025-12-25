# useCrudPage

集成表格展示、表单弹窗、数据转换等功能的综合性 Hook。它组合了 `useTablePage` 和 `useFormDialog` 的功能，提供了一站式的 CRUD 页面解决方案。

## 基础用法

通过 `useCrudPage` 可以快速构建具备列表展示、搜索、分页、新增、编辑、删除、批量删除等功能的 CRUD 页面。

::: preview
demo-preview=@examples/use-crud-page/basic.vue
:::

## API

### 参数

`useCrudPage` 接受一个泛型参数 `T` (表单数据类型) 和一个配置对象参数。配置对象支持 **简化配置** 和 **完整配置** 两种模式。

#### 简化配置 (SimpleCrudConfig)

适用于大多数标准 CRUD 场景。

| 属性 | 说明 | 类型 | 是否必填 |
| --- | --- | --- | --- |
| apis | API 接口集合 | `SimpleApis` | 是 |
| table | 表格配置 | `SimpleTableConfig` | 是 |
| form | 表单配置 | `SimpleFormConfig` | 是 |
| search | 搜索配置 | `SimpleSearchConfig` | 否 |
| advanced | 高级配置 | `SimpleAdvancedConfig` | 否 |

**apis 配置**

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| list | 列表查询接口 | `(params: any) => Promise<any>` |
| add | 新增接口 | `(data: any) => Promise<any>` |
| update | 更新接口 | `(data: any) => Promise<any>` |
| delete | 删除接口 | `(id: any) => Promise<any>` |
| batchDelete | 批量删除接口 | `(ids: any[]) => Promise<any>` |
| get | 获取详情接口 | `(id: any) => Promise<any>` |
| export | 导出接口 | `(params: any) => Promise<any>` |

**table 配置**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| config | CustomTable 组件配置 (包含 columns, selection, index, pagination 等) | `CustomTableConfig` | - |
| dataKey | 列表数据在响应中的字段名 | `string` | `'rows'` |
| totalKey | 总条数在响应中的字段名 | `string` | `'total'` |
| exportUrl | 导出 URL（如果不使用 export 接口） | `string` | - |
| autoFetch | 是否自动获取数据 | `boolean` | `true` |
| onCustomAction | 自定义操作列事件处理 | `(event: string, row: any, index: number) => void` | - |

**form 配置**

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| initialData | 表单初始数据 | `T` |
| rules | 表单校验规则 | `FormRules` |
| beforeSubmit | 提交前数据转换 | `(data: T) => any` |
| afterGet | 获取详情后数据转换 | `(data: any) => T` |
| onSuccess | 提交成功回调 | `() => void` |
| onSubmitSuccess | 自定义提交成功处理 | `(res: any, mode: 'add' \| 'edit', formData: T) => void` |

> **注意**：如果不配置 `apis.get` (获取详情接口)，在编辑时系统会尝试直接使用表格行数据 (`row`) 进行回显。此时请确保表格行数据中包含表单所需的所有字段。

#### 完整配置 (CrudPageConfig)

适用于需要精细控制的场景，参数直接透传给内部的 `useTablePage` 和 `useFormDialog`。

> 详细参数请参考 `useTablePage` 和 `useFormDialog` 文档。

### CustomTableConfig 配置详解

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| selection | 是否显示选择列，支持对象配置宽度等属性 | `boolean \| { width?: number; [key: string]: any }` |
| index | 是否显示索引列(序号)，支持对象配置属性 | `boolean \| { label?: string; [key: string]: any }` |
| columns | 列配置数组 | `TableColumnConfig[]` |
| pagination | 分页配置，设为 false 可隐藏分页 | `boolean \| PaginationConfig` |
| props | 透传给 el-table 的属性 (如 border, stripe, height, rowKey 等) | `Record<string, any>` |

#### PaginationConfig 分页配置

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| pageSize | 每页条数 | `number` | `10` |
| pageSizes | 每页条数选项 | `number[]` | `[10, 20, 30, 50]` |
| layout | 分页组件布局 | `string` | `'total, sizes, prev, pager, next, jumper'` |
| background | 是否带有背景色 | `boolean` | `true` |
| autoScroll | 翻页后是否自动滚动到顶部 | `boolean` | `false` |
| pagerCount | 页码按钮的数量 | `number` | `7` |
| float | 分页组件浮动方向 | `'right' \| 'left'` | `'right'` |

### 高级用法

展示了数据转换（数组转字符串、时间范围处理）、导出功能、自定义插槽等高级特性。

::: preview
demo-preview=@examples/use-crud-page/advanced.vue
:::

### 返回值

Hook 返回一个对象，包含以下属性和方法：

#### 表格状态与操作

| 属性/方法 | 说明 | 类型 |
| --- | --- | --- |
| tableData | 表格数据列表 | `Ref<any[]>` |
| total | 数据总条数 | `Ref<number>` |
| loading | 表格加载状态 | `Ref<boolean>` |
| pageInfo | 分页信息 | `Reactive<{ pageNum: number; pageSize: number }>` |
| searchParams | 搜索参数 | `Reactive<any>` |
| selection | 当前选中的行 | `Ref<any[]>` |
| cusTableConfig | CustomTable 组件的完整配置 | `ComputedRef<CustomTableConfig>` |
| getTableData | 获取列表数据 | `() => Promise<void>` |
| handleSearch | 执行搜索 | `() => void` |
| handleReset | 重置搜索 | `() => void` |
| handlePageChange | 切换页码 | `(val: number) => void` |
| handleSizeChange | 切换每页条数 | `(val: number) => void` |
| handleSelectionChange | 处理表格多选 | `(val: any[]) => void` |
| handleSortChange | 处理表格排序 | `(data: { prop: string; order: string }) => void` |
| handleDelete | 删除单条数据 | `(row: any) => void` |
| handleBatchDelete | 批量删除数据 | `() => void` |
| handleExport | 导出数据 | `() => void` |

#### 表单状态与操作

| 属性/方法 | 说明 | 类型 |
| --- | --- | --- |
| dialogVisible | 弹窗显示状态 | `Ref<boolean>` |
| dialogMode | 弹窗模式 ('add' \| 'edit' \| 'view') | `Ref<string>` |
| formData | 表单数据 | `Ref<T>` |
| formRef | 表单实例 Ref | `Ref<FormInstance>` |
| submitLoading | 提交按钮 loading 状态 | `Ref<boolean>` |
| openDialog | 打开弹窗 | `(mode: string, row?: any) => void` |
| handleDialogClose | 关闭弹窗 | `() => void` |
| submitForm | 提交表单 | `() => Promise<void>` |

#### 数据转换

| 属性/方法 | 说明 | 类型 |
| --- | --- | --- |
| arrayToString | 数组转字符串工具 | `(data: any, fields: string[]) => any` |
| stringToArray | 字符串转数组工具 | `(data: any, fields: string[]) => any` |
