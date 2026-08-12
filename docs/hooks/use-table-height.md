# useTableHeight

表格自适应高度 Hook，动态计算表格最大高度，使其恰好填满视口（或所在容器）剩余空间——表格内容区内部滚动、分页器固定底部。配合 `CustomTable` + `Pagination` 使用；`CustomTable` 的 `autoHeight` 属性已内置本 Hook，无需手动接入。

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTableHeight, Pagination } from 'vue3-crud-hooks'

const tableRef = ref()          // el-table 的 ref
const paginationRef = ref()     // Pagination 组件的 ref

const { tableMaxHeight } = useTableHeight(tableRef, paginationRef, {
  minHeight: 240,
  extraGap: 24,
})
</script>

<template>
  <el-table ref="tableRef" :data="rows" :height="tableMaxHeight" border>
    <!-- 列定义 -->
  </el-table>
  <Pagination ref="paginationRef" :total="total" />
</template>
```

## API 参考

### `calculateTableMaxHeight(options)`

纯计算函数：

```typescript
calculateTableMaxHeight({
  viewportHeight, tableTop, paginationHeight, extraGap,
  containerPaddingBottom = 0, minHeight,
})
// 可用高度 = 基准高度 - 表格顶部偏移 - 分页器高度 - 额外间距 - 容器底部内边距,与最小高度取最大值
```

### `useTableHeight(tableRef, paginationRef, options?)`

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `tableMaxHeight` | `Ref<number>` | 表格最大高度，绑定到 `el-table` 的 `height` |
| `updateTableMaxHeight()` | `() => Promise<void>` | 手动重算高度 |
| `initTableHeightObserver()` | `() => void` | 初始化尺寸监听 |

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `minHeight` | `number` | `240` | 表格最小高度（px），极端场景兜底 |
| `extraGap` | `number` | `24` | 页面额外间距补偿（px） |
| `containerRef` | `Ref<HTMLElement>` | — | 表格父容器引用：读取容器 `padding-bottom`；**当容器被 flex 布局约束（`flex-grow > 0` 或 `flex-basis: 0%`）时，按容器可用空间计算高度（容器基准），表格精确填满所在区域** |
| `watchSources` | `WatchSource[]` | `[]` | 需要监听的响应式数据（`ref` / `computed` / getter，如搜索栏展开状态），变化时自动重算 |
| `enabled` | `boolean` | `true` | 是否启用；设为 `false` 时不注册监听、不计算 |

### 自动重算时机

- `window.resize`（窗口缩放）
- `ResizeObserver`（表格 / 分页器 / 容器尺寸变化；环境不支持时降级为仅 `resize` 监听）
- `watchSources` 变化（如搜索栏展开收起）
- **分页器延迟渲染**：数据异步加载后才出现的分页器（引用从 `undefined` 变为有值）会自动重算并补充监听

## 容器基准 vs 视口基准

`useTableHeight` 支持两种高度基准，自动选择：

| 场景 | 基准 | 说明 |
|------|------|------|
| 容器被 flex 布局约束（`flex-grow > 0` 或 `flex-basis: 0%`，如卡片内 `flex: 1`） | **容器基准** | 表格高度 = 容器可用空间，精确填满所在卡片/区域，与视口无关；多表格同页互不影响 |
| 其他（普通文档流） | 视口基准 | 表格高度 = 视口高度 − 表格顶部偏移 − 分页器 − 间距 |

## 在线演示

::: preview
demo-preview=../examples/use-table-height/basic.vue
:::

## 与 CustomTable 集成

`CustomTable` 的 `autoHeight` 属性（默认开启）内部已内置 `useTableHeight`，业务中直接使用 `CustomTable` 即可，无需手动接入。仅在需要**更精细控制**（如绑定多个表格、自定义容器基准、联动搜索栏状态）时才手动使用本 Hook。
