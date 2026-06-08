# Pagination

基于 Element Plus `el-pagination` 的封装组件，支持 `v-bind` 属性透传和翻页自动滚动。

如果你独立使用 `Pagination`，建议先引入组件库样式：

```ts
import 'vue3-crud-hooks/style.css'
```

否则分页容器的宽度、默认右对齐，以及 `hidden` 隐藏态样式不会生效。

## 基础用法

::: preview
demo-preview=../examples/pagination/basic.vue
:::

## API 参考

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `total` | `number` | `0` | 数据总数 |
| `currentPage` | `number` | `1` | 当前页码 |
| `pageSize` | `number` | `20` | 每页条数 |
| `pageSizes` | `number[]` | `[10, 20, 30, 50]` | 每页条数切换选项 |
| `pagerCount` | `number` | `7` | 页码按钮数量 |
| `layout` | `string` | `'total, sizes, prev, pager, next, jumper'` | 分页布局 |
| `background` | `boolean` | `true` | 是否显示背景色 |
| `autoScroll` | `boolean` | `false` | 翻页时自动滚动到页面顶部 |
| `align` | `string` | `'right'` | 对齐方式 |
| `hidden` | `boolean` | `false` | 隐藏分页 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `pagination` | `{ currentPage, pageSize }` | 分页改变时触发 |
| `update:currentPage` | `(page)` | 页码 v-model 更新 |
| `update:pageSize` | `(size)` | 每页条数 v-model 更新 |

### 在 CustomTable 中使用

Pagination 已集成在 CustomTable 组件内部，通过 `config.pagination` 配置即可：

```typescript
const config = {
  columns: [...],
  pagination: {
    currentPage: 1,
    pageSize: 20,
    layout: 'total, sizes, prev, pager, next',
  }
}
```

使用 `useTablePage` 或 `useCrudPage` 时，分页状态由 Hook 自动管理，无需手动绑定：

```vue
<CustomTable v-bind="tableBindings" />
```
