# vue3-crud-hooks

基于 Vue 3 Composition API 和 Element Plus 的业务逻辑复用 Hooks 库，致力于简化 CRUD（增删改查）页面的开发流程。

[![npm version](https://img.shields.io/npm/v/vue3-crud-hooks.svg)](https://www.npmjs.com/package/vue3-crud-hooks)
[![License](https://img.shields.io/npm/l/vue3-crud-hooks.svg)](https://github.com/YongHangPu/vue3-crud-hooks/blob/main/LICENSE)

## ✨ 特性

- 🚀 **开箱即用**：提供 `useCrudPage`, `useTablePage`, `useFormDialog` 等核心 Hook，覆盖绝大多数业务场景
- 📦 **逻辑复用**：将表格管理、分页、搜索、表单弹窗、数据导出等繁琐逻辑高度封装
- 🧩 **组件支持**：内置 `CustomTable` 和 `Pagination` 组件，与 Hooks 完美配合，进一步减少模板代码
- 🌲 **按需引入**：支持 Tree Shaking 和子路径导入，确保包体积最小化
- 🛠 **高度可配置**：统一使用分层配置，兼顾快速开发与复杂场景扩展
- 📝 **TypeScript**：完全使用 TypeScript 编写，提供完整的类型推断和智能提示
- 🔌 **独立运行**：模块解耦，你可以单独使用 `useTablePage` 管理列表，或单独使用 `useFormDialog` 管理弹窗
- 📢 **消息解耦**：内置 `useMessage` Hook，支持自定义消息提示 UI，默认适配 Element Plus

## 📦 安装

```bash
# pnpm
pnpm add vue3-crud-hooks
```

## 🔨 快速开始

### 1. 完整 CRUD 页面 (`useCrudPage` + `CustomTable`)

最常用的方式，结合 Hook 和组件，极大地简化代码。

```vue
<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <div class="search-container">
      <el-input v-model="searchParams.keyword" placeholder="搜索关键字" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" @click="openDialog('add')">新增</el-button>
    </div>

    <!-- 表格组件 -->
    <CustomTable
      :config="tableConfig"
      :data="tableData"
      :loading="loading"
      v-bind="tableEventHandlers"
    >
      <!-- 自定义列插槽 -->
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
    </CustomTable>

    <!-- 弹窗组件 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增' : '编辑'">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useCrudPage, CustomTable } from 'vue3-crud-hooks'
import { getList, addData, updateData, deleteData } from '@/api/demo'

const {
  // 状态
  tableData,
  loading,
  searchParams,
  dialogVisible,
  dialogMode,
  formData,

  // 方法
  handleSearch,
  handleReset,
  openDialog,
  submitForm,

  // 组件配置与事件
  tableConfig,
  tableEventHandlers
} = useCrudPage({
  apis: {
    list: getList,
    add: addData,
    update: updateData,
    delete: deleteData
  },
  table: {
    config: {
      selection: true,
      index: true,
      columns: [
        { prop: 'name', label: '名称', minWidth: 120 },
        { prop: 'status', label: '状态', width: 100 },
        { prop: 'createTime', label: '创建时间', width: 180 },
        {
          type: 'action',
          label: '操作',
          width: 150,
          buttons: [
            { btnText: '编辑', event: 'edit', type: 'primary' },
            { btnText: '删除', event: 'delete', type: 'danger' }
          ]
        }
      ]
    }
  },
  form: {
    initialData: { name: '', status: 1 }
  }
})
</script>
```

### 2. 独立使用列表逻辑 (`useTablePage`)

如果你只需要管理一个表格列表，不需要弹窗功能。

```typescript
import { useTablePage } from 'vue3-crud-hooks'

const {
  tableData,
  loading,
  pageInfo,
  getTableData,
  handleSearch,
  handleReset,
  tableConfig,      // 传给 CustomTable
  tableEventHandlers // 传给 CustomTable
} = useTablePage(getListApi, searchForm, {
  // 配置项
  dataKey: 'rows',
  totalKey: 'count',
  customTableConfig: {
    columns: [
       // ... 列配置
    ]
  }
})
```

### 3. 独立使用组件 (`CustomTable`)

你也可以单独使用 `CustomTable` 组件，而不依赖 Hook。

```vue
<template>
  <CustomTable
    :config="config"
    :data="data"
    :loading="loading"
    @selection-change="onSelectionChange"
    @pagination="onPagination"
    @action="onAction"
  />
</template>

<script setup lang="ts">
import { CustomTable } from 'vue3-crud-hooks'

const config = {
  selection: true,
  index: true,
  columns: [
    { prop: 'name', label: 'Name' },
    {
      type: 'action',
      buttons: [{ btnText: 'Edit', event: 'edit' }]
    }
  ],
  pagination: {
    pageSize: 20
  }
}
</script>
```

## 📚 核心 API

### `useCrudPage(config)`

#### 返回值更新

除了原有的返回值外，新增：

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `tableConfig` | 生成的表格配置，直接传给 CustomTable 的 config 属性 | `ComputedRef` |
| `tableEventHandlers` | 表格事件处理器，包含分页、选择、操作等事件处理 | `object` |

---

### `useTablePage(fetchApi, searchForm, config, deleteConfig, exportConfig)`

#### 配置项 (TablePageConfig) 新增

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `customTableConfig` | 用于生成 CustomTable 组件的配置 | `CustomTableConfig` |

#### 返回值新增

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `tableConfig` | CustomTable 组件配置对象 | `ComputedRef` |
| `tableEventHandlers` | CustomTable 事件监听对象 (v-bind绑定) | `object` |
| `setTableColumns` | 动态设置表格列配置 | `Function` |

---

### 组件: `CustomTable`

#### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `config` | 表格配置对象 | `TableConfig` | Required |
| `data` | 表格数据 | `Array` | `[]` |
| `loading` | 加载状态 | `Boolean` | `false` |
| `props` | 原生 el-table 属性 (border, stripe等) | `Object` | `{}` |

#### Events

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| `selection-change` | 多选框状态改变 | `selection` |
| `sort-change` | 排序改变 | `{ column, prop, order }` |
| `filter-change` | 筛选改变 | `filters` |
| `pagination` | 分页改变 | `{ page, limit }` |
| `action` | 操作按钮点击 | `event, row, index` |

#### Slots

- **Default Slots**: `[prop]` - 自定义列内容插槽
- **Header Slots**: `[prop]-header` - 自定义表头插槽
- **Action Slot**: `action` - 自定义操作列内容
- **Append Slot**: `append` - 表格底部插槽

## 📄 License

MIT License © 2025 [YongHangPu](https://github.com/YongHangPu)
