# useDataTransform

`useDataTransform` 是一个用于处理常见数据转换场景的 Hook，特别适用于表单提交前的数据处理和获取详情后的数据回显。

## 基础用法

```typescript
import { useDataTransform } from 'vue3-crud-hooks'

const { 
  arrayToString, 
  stringToArray, 
  processTimeRange, 
  cleanEmptyFields 
} = useDataTransform()
```

## 功能特性

### 1. 数组与字符串互转

常用于处理多选框（Checkbox）数据。前端使用数组，后端通常存储为逗号分隔的字符串。

```typescript
// 提交前：['a', 'b'] -> 'a,b'
const submitData = arrayToString(formData, ['tags', 'categories'])

// 回显时：'a,b' -> ['a', 'b']
const editData = stringToArray(backendData, ['tags', 'categories'])
```

### 2. 时间范围处理

将日期范围选择器（DateRangePicker）的数组值拆分为后端需要的两个独立字段。

```typescript
// 原始数据
const params = {
  dateRange: ['2024-01-01', '2024-01-31']
}

// 默认转换：添加 begin/end 前缀
// 结果: { beginDateRange: '2024-01-01', endDateRange: '2024-01-31' }
const res1 = processTimeRange(params, 'dateRange')

// 自定义后缀
// 结果: { startCreateTime: '...', endCreateTime: '...' }
const res2 = processTimeRange(params, 'createTime', 'CreateTime')

// 完全自定义字段名
// 结果: { startDate: '...', endDate: '...' }
const res3 = processTimeRange(params, 'dateRange', { 
  start: 'startDate', 
  end: 'endDate' 
})
```

### 3. 空值清理

清理对象中的空字符串、`null` 和 `undefined`，常用于搜索表单提交前清理无效参数。

```typescript
// 浅层清理
const params = { name: 'test', age: '', status: null }
const cleanParams = cleanEmptyFields(params) 
// 结果: { name: 'test' }

// 深度清理 (支持嵌套对象和数组)
import { deepCleanEmptyFields } from 'vue3-crud-hooks'
const deepClean = deepCleanEmptyFields(nestedObj)
```

### 4. 数字转换

将输入框的字符串数字转换为真正的 Number 类型。

```typescript
const data = { age: "18", price: "99.9" }
const res = convertNumbers(data, ['age', 'price'])
// 结果: { age: 18, price: 99.9 }
```

## 在线演示

::: demo 包含所有数据转换功能的综合演示
examples/use-data-transform/basic
:::

## API 参考

### arrayToString(data, fields, separator?)
*   **data**: 原始对象
*   **fields**: 需要转换的字段名数组 `string[]`
*   **separator**: 分隔符，默认为 `,`
*   **returns**: 新对象（不改变原对象）

### stringToArray(data, fields, separator?)
*   **data**: 原始对象
*   **fields**: 需要转换的字段名数组 `string[]`
*   **separator**: 分隔符，默认为 `,`
*   **returns**: 新对象

### processTimeRange(params, timeField, fieldConfig?)
*   **params**: 原始参数对象
*   **timeField**: 时间范围字段名（值为数组）
*   **fieldConfig**: 
    *   `string`: 作为后缀，生成 `begin{Suffix}` 和 `end{Suffix}`
    *   `{ start: string, end: string }`: 指定确切的开始和结束字段名
    *   `undefined`: 默认生成 `begin{Field}` 和 `end{Field}`

### cleanEmptyFields(data, fields?)
*   **data**: 原始数据
*   **fields**: 指定清理的字段数组，不传则检查所有字段
*   **returns**: 清理后的新对象

### convertNumbers(data, fields)
*   **data**: 原始数据
*   **fields**: 需要转换为数字的字段数组

### deepCleanEmptyFields(data)
*   **data**: 任意数据（对象、数组等）
*   **returns**: 递归清理后的数据
