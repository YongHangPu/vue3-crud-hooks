---
title: useDataTransform
---

# useDataTransform

- 功能：提供数组/字符串互转、时间范围处理、空值清理、数字转换等常用工具
- 适用：搜索参数预处理、表单数据映射

## 演示

:::preview 数据转换 Hook || 数组/字符串/时间范围/空值清理演示
demo-preview=../examples/demos/DataTransformDemo.vue
:::

## API

- 返回
  - `arrayToString(data, fields, separator?)`
  - `stringToArray(data, fields, separator?)`
  - `processTimeRange(params, timeField, fieldConfig?)`
  - `cleanEmptyFields(data, fields?)`
  - `convertNumbers(data, fields)`
  - 以及 `deepCleanEmptyFields(data)`（独立导出）

### 结构化参考

- 方法
  - `arrayToString` / `stringToArray`
  - `processTimeRange`
  - `cleanEmptyFields` / `deepCleanEmptyFields`
  - `convertNumbers`
- 事件
  - 无（纯工具方法）
- 类型
  - 无强约束类型；参数与返回为通用对象/数组

## 使用要点

- `processTimeRange` 与 `docs/examples/utils/index.ts` 中的 `addDateRange` 配合，将 `daterange` 转换为后端字段
- 建议与列表/表单 Hook 搭配使用，统一前后端数据结构

## 示例代码

```ts
/**
 * 示例：数组/字符串互转
 */
import { useDataTransform, deepCleanEmptyFields } from '@/hooks/useDataTransform'
const { arrayToString, stringToArray, processTimeRange, cleanEmptyFields, convertNumbers } = useDataTransform()

const data1 = arrayToString({ tags: ['A', 'B'] }, ['tags'], '、')
const data2 = stringToArray({ tags: 'A、B' }, ['tags'], '、')
const data3 = processTimeRange({ range: [123, 456] }, 'range', { start: 'beginTime', end: 'endTime' })
const data4 = cleanEmptyFields({ a: '', b: null, c: undefined, d: 0, e: 'x' })
const data5 = convertNumbers({ age: '18', price: '9.9' }, ['age', 'price'])
const data6 = deepCleanEmptyFields({ a: '', b: null, obj: { c: '', d: 1 } })
```

## 最佳实践

- 统一分隔符：前后端约定统一分隔符（默认 `、`），避免解析差异
- 时间范围：使用 `processTimeRange` 将选择器值映射到后端字段名并删除原字段
```ts
const { processTimeRange } = useDataTransform()
const params = processTimeRange({ range: [ts1, ts2] }, 'range', { start: 'beginTime', end: 'endTime' })
```
- 请求前清理：在发起请求前应用 `deepCleanEmptyFields`，减少后端分支判断
- 数值转换：在参与计算或排序前，使用 `convertNumbers` 保证字段类型一致

## 常见问题

- 分隔符不一致：前后端分隔符需统一，默认使用 `、`。
- 时间字段丢失：`processTimeRange` 会删除原始 `timeField`，确保后端只接收转换后的键。
- 清理空值影响：`cleanEmptyFields` 会移除空值键，注意与后端必填策略一致。

## 更多资源

- 示例索引：/demos
- 相关：/hooks/use-table-page、/hooks/use-form-dialog、/hooks/use-crud-page
