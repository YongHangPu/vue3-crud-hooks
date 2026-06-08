# CustomTable

配置驱动的 el-table 封装组件，通过 `config` prop 声明列结构、操作按钮、分页、序号、多选等。支持 **el-table 所有原生属性和事件透传**，可像使用原生 `<el-table>` 一样使用。

## 独立使用

CustomTable 可脱离 Hooks 独立使用，只需要传入 `config` + `data` + `loading` 即可。

如果你在业务项目中直接使用 `CustomTable`，建议先引入组件库样式：

```ts
import 'vue3-crud-hooks/style.css'
```

否则表格操作列按钮之间的默认间距，以及表格底部分页区域的默认上边距不会生效。

::: preview
demo-preview=../examples/custom-table/standalone.vue
:::

## 属性透传

CustomTable 会将**未声明的属性和事件**自动透传到内层 `<el-table>`，这意味着你可以直接使用所有 el-table 的原生功能：

```vue
<CustomTable
  v-bind="tableBindings"
  @row-click="handleRowClick"
  @row-dblclick="handleDblClick"
  @cell-click="handleCellClick"
  @expand-change="handleExpand"
  highlight-current-row
  row-key="id"
  default-expand-all
  :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
/>
```

无需通过 `config.props` 中转，模板写法与原生 el-table 完全一致。

## API 参考

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `config` | `CustomTableConfig \| null` | `{ columns: [] }` | 表格配置（列定义、分页、序号、多选等） |
| `data` | `any[]` | `[]` | 表格数据 |
| `loading` | `boolean` | `false` | 加载状态（显示加载遮罩） |
| `props` | `Partial<TableProps>` | `{}` | 透传给 el-table 的属性（border, stripe 等，优先级高于 config.props） |

> 所有未在 Props 中声明的属性和事件都会透传到 `<el-table>`。

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `pagination` | `{ currentPage, pageSize }` | 分页改变时触发 |
| `action` | `(event, row, index)` | 操作列按钮点击时触发 |
| `selection-change` | `(selection)` | 多选框状态改变 |
| `sort-change` | `({ column, prop, order })` | 排序改变 |
| `filter-change` | `(filters)` | 筛选改变 |
| `size-change` | `(size)` | 每页条数改变 |
| `current-change` | `(page)` | 当前页改变 |

### Slots

| 插槽名 | 作用域 | 说明 |
|--------|--------|------|
| `[prop]` | `{ row, index, column }` | 自定义列内容，以列的 `slotName` 或 `prop` 命名 |
| `[prop]-header` | `{ column, $index }` | 自定义表头 |
| `action` | `{ row, index }` | 自定义整个操作列内容（覆盖按钮渲染） |
| `append` | — | 表格底部插槽 |

## CustomTableConfig

```typescript
interface CustomTableConfig {
  /** 列定义 */
  columns: TableColumnConfig[]
  /** 多选列，传对象可配置 el-table-column selection 属性 */
  selection?: boolean | Record<string, any>
  /** 序号列（自动翻页连续序号：(pageNum-1)*pageSize + index + 1） */
  index?: boolean | Record<string, any>
  /** 分页配置 */
  pagination?: boolean | PaginationConfig
  /** 自定义操作事件处理器 */
  onCustomAction?: (event: string, row: any, index: number) => void
  /** 透传给 el-table 的属性（border, stripe, height 等） */
  props?: Record<string, any>
}
```

### TableColumnConfig

| 属性 | 类型 | 说明 |
|------|------|------|
| `prop` | `string` | 字段名 |
| `label` | `string` | 列标题 |
| `width` / `minWidth` | `string \| number` | 列宽 |
| `type` | `'default' \| 'selection' \| 'index' \| 'expand' \| 'action'` | 列类型 |
| `slotName` | `string` | 插槽名（优先级高于 prop） |
| `align` / `headerAlign` | `'left' \| 'center' \| 'right'` | 对齐方式 |
| `fixed` | `boolean \| 'left' \| 'right'` | 固定列 |
| `sortable` | `boolean \| 'custom'` | 排序 |
| `filters` / `filterMethod` | — | 筛选 |
| `formatter` | `(row, column, cell, index) => any` | 格式化函数 |
| `showOverflowTooltip` | `boolean` | 溢出 tooltip |
| `buttons` | `TableButtonConfig[]` | 操作按钮（仅 `type='action'` 有效） |
| `hidden` | `boolean` | 隐藏该列 |
| `className` | `string` | 列 className |
| `selectable` | `(row, index) => boolean` | 是否可选（selection 列） |
| `reserveSelection` | `boolean` | 数据更新后保留选中 |
| `[key: string]` | `any` | 其他 el-table-column 原生属性 |

### TableButtonConfig

| 属性 | 类型 | 说明 |
|------|------|------|
| `event` | `string` | 事件名（触发 `@action` 事件） |
| `btnText` | `string` | 按钮文本 |
| `btnType` | `'link' \| 'button'` | 按钮类型，默认 `'link'`（渲染为 el-link） |
| `type` | `'primary' \| 'success' \| 'danger' \| 'warning' \| 'info'` | 样式 |
| `disabled` | `boolean \| (row) => boolean` | 禁用 |
| `visible` | `(row) => boolean` | 显示/隐藏 |
| `props` | `Record<string, any>` | 其他透传属性（如 `size`, `plain`, `round` 等） |

### 操作按钮示例

```typescript
{
  type: 'action',
  label: '操作',
  width: 280,
  buttons: [
    // ─── el-link 类型（btnType 默认 'link'）───
    // 直接传 type 即可指定样式颜色
    { event: 'view',  btnText: '查看', type: 'primary' },
    { event: 'edit',  btnText: '编辑', type: 'success' },

    // ─── el-button 类型（btnType: 'button'）───
    // 渲染为 <el-button>，可通过 props 传递 size / plain / round 等
    {
      event: 'delete',
      btnText: '删除',
      btnType: 'button',
      type: 'danger',
      props: { size: 'small', plain: true },
    },
    { event: 'copy',  btnText: '复制', btnType: 'button', type: 'warning', props: { size: 'small' } },

    // ─── 函数式 disabled / visible ───
    {
      event: 'publish',
      btnText: '发布',
      type: 'success',
      // 只有 status 为 'inactive' 时才可点击
      disabled: (row) => row.status === 'active',
      // 只有 status 为 'inactive' 时才显示
      visible: (row) => row.status === 'inactive',
    },
  ],
}
```

> **提示**：`btnType` 控制渲染为 `<el-link>` 还是 `<el-button>`。el-link 默认具有 `type: 'primary'`，适合轻量操作；el-button 默认 `size: 'small'`，适合需要更明显点击区域的场景。`props` 中可传递对应组件的任何原生属性。

## useTablePage 集成

CustomTable 推荐与 `useTablePage` 或 `useCrudPage` 配合使用，通过 `v-bind="tableBindings"` 一次性绑定所有属性和事件：

```vue
<CustomTable v-bind="tableBindings">
  <template #status="{ row }">
    <el-tag>{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
  </template>
</CustomTable>
```

## Pagination 组件

CustomTable 内部已集成 Pagination 分页组件，通常无需手动使用。如需独立分页，参见 [Pagination 组件](./pagination) 文档。
