# useDataTransform

数据转换工具 Hook，提供 **数组↔字符串互转、时间范围拆分、空值清理、数字类型转换** 等常见数据格式处理函数。独立于 UI 库，可单独使用。

## 基础用法

```typescript
import { useDataTransform, deepCleanEmptyFields } from 'vue3-crud-hooks'

const {
  arrayToString,
  stringToArray,
  processTimeRange,
  cleanEmptyFields,
  convertNumbers
} = useDataTransform()
```

## API 参考

### arrayToString(data, fields, separator?)

将指定字段从数组转换为分隔符字符串。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `Record<string, any>` | — | 原始数据对象 |
| `fields` | `string[]` | — | 要转换的字段名数组 |
| `separator` | `string` | `','` | 分隔符 |

```typescript
arrayToString({ tags: ['Vue', 'React'] }, ['tags'])
// → { tags: 'Vue,React' }
```

### stringToArray(data, fields, separator?)

将指定字段从分隔符字符串转换回数组。

```typescript
stringToArray({ tags: 'Vue,React' }, ['tags'])
// → { tags: ['Vue', 'React'] }

stringToArray({ tags: 'Vue|React' }, ['tags'], '|')
// → { tags: ['Vue', 'React'] }
```

### processTimeRange(params, timeField, fieldConfig?)

将时间范围数组 `[start, end]` 拆分为两个独立字段。

| 参数 | 类型 | 说明 |
|------|------|------|
| `params` | `Record<string, any>` | 参数对象 |
| `timeField` | `string` | 时间范围字段名 |
| `fieldConfig` | `string \| { start, end }` | 字段名配置 |

**不传 fieldConfig**：默认 `begin{Field}` / `end{Field}`
```typescript
processTimeRange({ date: ['2024-01-01', '2024-01-31'] }, 'date')
// → { beginDate: '2024-01-01', endDate: '2024-01-31' }
```

**传字符串**：拼接前缀
```typescript
processTimeRange({ t: ['a', 'b'] }, 't', 'Time')
// → { beginTime: 'a', endTime: 'b' }
```

**传对象**：精确指定字段名
```typescript
processTimeRange({ t: ['a', 'b'] }, 't', { start: 'startAt', end: 'endAt' })
// → { startAt: 'a', endAt: 'b' }
```

### cleanEmptyFields(data, fields?)

移除值为 `''` / `null` / `undefined` 的字段。

```typescript
cleanEmptyFields({ name: 'Tom', age: '', desc: null })
// → { name: 'Tom' }
```

不传 `fields` 时清理所有字段；传 `fields` 时仅清理指定字段。

### deepCleanEmptyFields(data)

递归清理嵌套对象和数组中的空值。

```typescript
deepCleanEmptyFields({
  name: 'Project',
  tags: ['', null, 'Vue'],
  meta: { version: '1.0', author: '' }
})
// → { name: 'Project', tags: ['Vue'], meta: { version: '1.0' } }
```

### convertNumbers(data, fields)

将指定字段从字符串转换为 `Number` 类型。

```typescript
convertNumbers({ age: '18', price: '99.9' }, ['age', 'price'])
// → { age: 18, price: 99.9 }
```

## 在线演示

::: preview
demo-preview=../examples/use-data-transform/basic.vue
:::
