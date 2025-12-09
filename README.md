# vue3-crud-hooks

基于 Vue 3 和 Element Plus 的业务逻辑复用 Hooks 库，致力于简化 CRUD 页面开发。

## 特性

- 🚀 **开箱即用**：提供 `useCrudPage`, `useTablePage`, `useFormDialog` 等核心 Hook
- 📦 **逻辑复用**：将表格、分页、搜索、表单弹窗、增删改查等逻辑高度封装
- 🛠 **高度可配置**：支持简化配置和完整配置，满足不同场景需求
- 🧩 **TypeScript**：完全使用 TypeScript 编写，提供完整的类型提示

## 安装

```bash
pnpm add vue3-crud-hooks
# 或者
npm install vue3-crud-hooks
```

## 快速开始

### 基础用法

```vue
<script setup lang="ts">
import { useCrudPage } from 'vue3-crud-hooks'
import { getList, addData, updateData, deleteData } from '@/api/demo'

const { 
  tableData, 
  pageInfo, 
  loading, 
  handleSearch, 
  handleReset,
  handlePageChange, 
  handleSizeChange,
  openDialog,
  handleDelete
} = useCrudPage({
  // API 配置
  apis: {
    list: getList,
    add: addData,
    update: updateData,
    delete: deleteData
  },
  // 表单配置
  form: {
    initialData: {
      name: '',
      status: 1
    }
  },
  // 表格配置
  table: {
    dataKey: 'list', // 接口返回的数据字段
    totalKey: 'total' // 接口返回的总数字段
  }
})
</script>

<template>
  <!-- 你的表格和弹窗组件 -->
</template>
```

更多详细文档请查看 `docs` 目录或在线文档。
