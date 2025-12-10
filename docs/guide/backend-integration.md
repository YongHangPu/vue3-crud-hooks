---
title: 后端对接指南
---

# 后端对接指南

- 目标：将 Hooks 与你的后端接口快速打通，确保分页、搜索、增删改查与详情回显一致

## 常见响应体与字段映射

- 响应数据字段（列表）：常见键名 `rows/data/list/records/items`
- 总数字段：常见键名 `total/totalCount/count/totalElements`
- 方案：
  - 若你的返回是 `{ rows, total }`，直接使用默认 `dataKey='rows'`、`totalKey='total'`
  - 若返回是 `{ list, totalCount }`，在 `tableConfig` 中设置 `dataKey='list'`、`totalKey='totalCount'`
  - 或开启 `autoDetect: true`，自动匹配上述通用键名

```ts
/**
 * 列表接口（示例）
 * 功能：向后端请求分页数据
 * 参数：params 包含分页与搜索条件
 * 返回值：Promise<{ list: any[]; totalCount: number }>
 */
const getList = async (params: any): Promise<{ list: any[]; totalCount: number }> => {
  const res = await fetch('/api/list', { method: 'POST', body: JSON.stringify(params) })
  return res.json()
}
```

## 服务层封装模板

```ts
/**
 * 服务层模板
 * 功能：统一封装接口，避免在组件中散落请求逻辑
 */
export const Api = {
  /** 获取列表 */
  list: async (params: any): Promise<{ list: any[]; totalCount: number }> => {
    const res = await fetch('/api/list', { method: 'POST', body: JSON.stringify(params) })
    return res.json()
  },
  /** 新增 */
  add: async (data: any): Promise<any> => {
    const res = await fetch('/api/add', { method: 'POST', body: JSON.stringify(data) })
    return res.json()
  },
  /** 更新 */
  update: async (data: any): Promise<any> => {
    const res = await fetch('/api/update', { method: 'POST', body: JSON.stringify(data) })
    return res.json()
  },
  /** 删除 */
  delete: async (id: number | string): Promise<any> => {
    const res = await fetch(`/api/delete/${id}`, { method: 'DELETE' })
    return res.json()
  },
  /** 获取详情 */
  get: async (id: number | string): Promise<any> => {
    const res = await fetch(`/api/get/${id}`)
    return res.json()
  }
}
```

## 与 useTablePage 对接

```ts
import { useTablePage } from 'vue3-crud-hooks'

/**
 * 列表 Hook 对接后端
 */
const hook = useTablePage(
  async (params) => Api.list(params),
  { keyword: '', range: [] },
  { dataKey: 'list', totalKey: 'totalCount', autoFetch: true, timeFields: [{ field: 'range', prefix: { start: 'beginTime', end: 'endTime' } }] },
  { deleteApi: Api.delete }
)
```

## 与 useFormDialog 对接

```ts
import { useFormDialog } from 'vue3-crud-hooks'

/** 表单 Hook 对接后端 */
const form = useFormDialog({
  initialFormData: { name: '', tags: [] },
  addApi: Api.add,
  updateApi: Api.update,
  getApi: Api.get,
  dataTransform: {
    beforeSubmit: (d) => ({ ...d, name: String(d.name).trim() }),
    afterGet: (d) => ({ ...d, tags: d.tags ? d.tags.split('、') : [] })
  }
})
```

## 与 useCrudPage 一步打通

```ts
import { useCrudPage } from 'vue3-crud-hooks'

const crud = useCrudPage({
  apis: { list: Api.list, add: Api.add, update: Api.update, delete: Api.delete, get: Api.get },
  form: { initialData: { name: '' }, rules: { name: [{ required: true }] } },
  search: { initialParams: { keyword: '', range: [] }, timeFields: [{ field: 'range', prefix: { start: 'beginTime', end: 'endTime' }] } },
  table: { autoFetch: true, dataKey: 'list', totalKey: 'totalCount' }
})
```

## 字段与转换对齐建议

- 分页：统一 `pageNum/pageSize` 命名，或在服务层转换为后端期望的键名
- 时间范围：统一在搜索参数中使用一个字段（如 `range`），由 `timeFields` 转换为后端开始/结束键
- 数组字段：查询串行化为字符串（`arrayToString`），详情回显反串（`stringToArray`）
- 空值处理：请求前使用 `cleanEmptyFields/deepCleanEmptyFields`，减少后端分支

