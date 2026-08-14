---
layout: home

hero:
  name: "vue3-crud-hooks"
  text: "Vue3 CRUD Hooks 库"
  tagline: 基于 Vue 3 Composition API + Element Plus 的 CRUD 业务逻辑复用方案
  actions:
    - theme: brand
      text: 快速开始
      link: /hooks/use-crud-page
    - theme: alt
      text: 架构说明
      link: /architecture

features:
  - title: useCrudPage
    details: 一站式 CRUD 页面方案，整合表格查询、搜索、分页、新增、编辑、删除全流程
    link: /hooks/use-crud-page
  - title: useTablePage
    details: 独立表格管理，分页/搜索/删除/导出，适合不需要弹窗编辑的场景
    link: /hooks/use-table-page
  - title: useFormDialog
    details: 独立表单弹窗，新增/编辑/数据回显/校验/提交全流程处理
    link: /hooks/use-form-dialog
  - title: useDataTransform
    details: 数据转换工具，数组↔字符串互转、时间范围拆分、空值清理
    link: /hooks/use-data-transform
  - title: useTableHeight
    details: 表格自适应高度，填满视口/容器剩余空间，表格内部滚动、分页器固定底部
    link: /hooks/use-table-height
  - title: CustomTable 组件
    details: 配置驱动 el-table 封装，支持 el-table 原生属性/事件透传
    link: /components/custom-table
  - title: Pagination 组件
    details: 基于 el-pagination 的分页封装，支持自动滚动
    link: /components/pagination
---

## 快速开始

### 安装

```bash
pnpm add vue3-crud-hooks
```

需要同级安装 `vue@^3.5`（库使用了 `defineModel` 特性）和 `element-plus@^2`。

如果你使用 `CustomTable` 或 `Pagination` 组件，请额外引入组件样式：

```ts
import 'vue3-crud-hooks/style.css'
```

这份样式主要包含操作列按钮间距、分页区域间距、分页对齐和隐藏态等组件内置布局样式。只使用 Hooks 时可不引入。

### 一个完整的 CRUD 页面

```vue
<script setup lang="ts">
import { useCrudPage, CustomTable } from 'vue3-crud-hooks'

const { tableBindings, searchParams, handleSearch, handleReset } = useCrudPage({
  apis: {
    list: (params) => fetch('/api/list', { params }).then(r => r.json()),
    add: (data) => fetch('/api/add', { method: 'POST', body: data }),
    update: (data) => fetch('/api/update', { method: 'PUT', body: data }),
    delete: (id) => fetch(`/api/delete/${id}`, { method: 'DELETE' }),
  },
  table: {
    config: {
      columns: [
        { prop: 'name', label: '名称' },
        { type: 'action', buttons: [{ event: 'delete', btnText: '删除' }] },
      ],
    },
  },
  form: { initialData: { name: '' } },
  search: { initialData: { keyword: '' } },
})
</script>

<template>
  <input v-model="searchParams.keyword" placeholder="搜索" />
  <button @click="handleSearch">搜索</button>
  <button @click="handleReset">重置</button>
  <CustomTable v-bind="tableBindings" />
</template>
```

> 详细用法请查看 [useCrudPage](./hooks/use-crud-page) 文档。

## 项目定位

`vue3-crud-hooks` 聚焦中后台管理系统中最常见的 **CRUD 页面**场景，通过组合式 API 将重复逻辑抽象为可复用的 Hooks，配合开箱即用的 `CustomTable` 组件，大幅减少模板代码。

> 🎮 想看真实效果?访问 [**在线示例项目**](https://yonghangpu.github.io/vue3-crud-hooks-demo)(完整后台管理演示:CRUD、排序筛选、多表格、暗色模式等)。

### 设计理念

- **组合式**：以 Hooks 为核心，将页面能力拆解为独立模块进行组合
- **配置驱动**：通过直观配置即可完成页面常见功能，减少模板代码
- **最小 API**：仅暴露必要的状态与方法，降低使用与维护成本
- **可插拔**：与 Element Plus 无侵入集成，`useMessage` 支持替换为任意 UI 库
- **类型安全**：完全 TypeScript 编写，完整的类型推导与 IDE 智能提示
