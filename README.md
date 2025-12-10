# vue3-crud-hooks

基于 Vue 3 Composition API 和 Element Plus 的业务逻辑复用 Hooks 库，致力于简化 CRUD（增删改查）页面的开发流程。

[![npm version](https://img.shields.io/npm/v/vue3-crud-hooks.svg)](https://www.npmjs.com/package/vue3-crud-hooks)
[![License](https://img.shields.io/npm/l/vue3-crud-hooks.svg)](https://github.com/YongHangPu/vue3-crud-hooks/blob/main/LICENSE)

## ✨ 特性

- 🚀 **开箱即用**：提供 `useCrudPage`, `useTablePage`, `useFormDialog` 等核心 Hook，覆盖绝大多数业务场景
- 📦 **逻辑复用**：将表格管理、分页、搜索、表单弹窗、数据导出等繁琐逻辑高度封装
- 🌲 **按需引入**：支持 Tree Shaking 和子路径导入，确保包体积最小化
- 🛠 **高度可配置**：支持简化配置（快速开发）和完整配置（复杂场景），灵活应对各种需求
- 🧩 **TypeScript**：完全使用 TypeScript 编写，提供完整的类型推断和智能提示
- 🔌 **独立运行**：模块解耦，你可以单独使用 `useTablePage` 管理列表，或单独使用 `useFormDialog` 管理弹窗
- 📢 **消息解耦**：内置 `useMessage` Hook，支持自定义消息提示 UI，默认适配 Element Plus

## 📦 安装

```bash
# pnpm
pnpm add vue3-crud-hooks

# npm
npm install vue3-crud-hooks

# yarn
yarn add vue3-crud-hooks
```

## 🔨 快速开始

### 1. 完整 CRUD 页面 (`useCrudPage`)

最常用的 Hook，整合了列表和弹窗逻辑，适合标准的增删改查页面。

```vue
<script setup lang="ts">
import { useCrudPage } from 'vue3-crud-hooks'
import { getList, addData, updateData, deleteData, exportData } from '@/api/demo'

// 一行代码搞定 CRUD 逻辑
const {
  tableData,      // 表格数据
  pageInfo,       // 分页信息
  loading,        // 加载状态
  dialogVisible,  // 弹窗显示状态
  dialogMode,     // 弹窗模式 (add/edit)
  formData,       // 表单数据
  handleSearch,   // 搜索方法
  handleReset,    // 重置搜索
  handleDelete,   // 删除方法
  handleExport,   // 导出方法
  openDialog,     // 打开弹窗
  submitForm      // 提交表单
} = useCrudPage({
  // 1. API 配置（必填）
  apis: {
    list: getList,
    add: addData,
    update: updateData,
    delete: deleteData,
    export: exportData // 可选：导出接口
  },
  // 2. 表格配置
  table: {
    dataKey: 'list', // 接口返回的数据字段名
    totalKey: 'total' // 接口返回的总数字段名
  },
  // 3. 表单配置
  form: {
    // 表单初始数据
    initialData: {
      name: '',
      status: 1
    },
    // 提交前数据处理
    beforeSubmit: (data) => {
      return { ...data, updateTime: Date.now() }
    }
  },
  // 4. 搜索配置
  search: {
    initialData: { keyword: '' },
    // 搜索参数预处理
    beforeSearch: (params) => {
      // 可以在这里处理特殊参数，例如将数组转为字符串
      return params
    }
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
  handleExport
} = useTablePage(getListApi, searchForm, {
  // 配置项
  dataKey: 'rows',
  totalKey: 'count',
  beforeSearch: (params) => {
    // 参数处理
    return params
  }
}, {
  // 删除配置
  deleteApi: deleteApi
}, {
  // 导出配置
  exportFunction: ({ params, filename }) => {
    // 自定义导出逻辑
  }
})
```

### 3. 独立使用弹窗逻辑 (`useFormDialog`)

如果你只需要一个通用的表单弹窗，处理新增/编辑逻辑。

```typescript
import { useFormDialog } from 'vue3-crud-hooks'

const {
  dialogVisible,
  formData,
  openDialog,
  submitForm
} = useFormDialog({
  addApi: addData,
  updateApi: updateData,
  initialFormData: { name: '' },
  // 数据转换
  dataTransform: {
    beforeSubmit: (data) => data,
    afterGet: (data) => data
  }
})
```

### 4. 统一消息提示 (`useMessage`)

如果你想在 Hooks 外部使用统一的消息提示，或者自定义消息 UI。

```typescript
import { useMessage } from 'vue3-crud-hooks'

// 使用默认 Element Plus 提示
const { success, error, confirm } = useMessage()

// 使用自定义 UI
const { success } = useMessage({
  success: (msg) => MyToast.success(msg)
})
```

## 📚 核心 API

### `useCrudPage(config)`

整合了 `useTablePage` 和 `useFormDialog` 的功能。

#### 参数 (Config)

支持 **简化配置 (SimpleCrudConfig)** 和 **完整配置 (CrudPageConfig)**。

| 属性 | 说明 | 类型 | 必填 |
| --- | --- | --- | --- |
| `apis` | 接口配置 (list, add, update, delete, export...) | `CrudApiConfig` | ✅ |
| `table` | 表格配置 (dataKey, totalKey, exportUrl...) | `TableConfig` | ❌ |
| `form` | 表单配置 (initialData, beforeSubmit, afterGet...) | `FormConfig` | ✅ |
| `search` | 搜索配置 (initialData, beforeSearch) | `SearchConfig` | ❌ |
| `advanced` | 高级配置 (messageApi, arrayFields, timeFields) | `AdvancedConfig` | ❌ |

#### 返回值

包含 `useTablePage` 和 `useFormDialog` 的所有返回值，以及 `handleDelete`, `handleExport` 等组合方法。

---

### `useTablePage(fetchApi, searchForm, config, deleteConfig, exportConfig)`

#### 参数

| 参数名 | 说明 | 类型 |
| --- | --- | --- |
| `fetchApi` | 获取列表数据的接口函数 | `(params: any) => Promise<any>` |
| `searchForm` | 搜索表单的初始对象 | `object` |
| `config` | 基础配置 | `TablePageConfig` |
| `deleteConfig` | 删除相关配置 | `DeleteConfig` |
| `exportConfig` | 导出相关配置 | `ExportConfig` |

#### 配置项 (TablePageConfig)

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `dataKey` | 接口返回的数据字段名 | `'rows'` |
| `totalKey` | 接口返回的总数字段名 | `'total'` |
| `autoDetect` | 是否自动检测返回结构 | `true` |
| `autoFetch` | 是否自动获取数据 | `true` |
| `beforeSearch` | 搜索参数预处理函数 | `undefined` |
| `exportUrl` | 导出接口 URL | `undefined` |

#### 返回值

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `tableData` | 表格数据 | `Ref<any[]>` |
| `loading` | 加载状态 | `Ref<boolean>` |
| `pageInfo` | 分页信息 (pageNum, pageSize, total) | `Reactive` |
| `getTableData` | 获取数据方法 | `Function` |
| `handleSearch` | 搜索方法 | `Function` |
| `handleReset` | 重置搜索方法 | `Function` |
| `handleSelectionChange` | 表格多选处理 | `Function` |
| `handleExport` | 导出方法 | `(options?: { url?, filename?, params? }) => void` |

---

### `useFormDialog(config)`

#### 参数 (Config)

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `addApi` | 新增接口 | `Function` |
| `updateApi` | 编辑接口 | `Function` |
| `initialFormData` | 表单初始数据 | `object` |
| `dataTransform` | 数据转换配置 (beforeSubmit, afterGet) | `object` |
| `onSuccess` | 提交成功通用回调 | `Function` |
| `onSubmitSuccess` | 提交成功自定义回调 (可访问响应数据) | `Function` |

#### 返回值

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `dialogVisible` | 弹窗显示状态 | `Ref<boolean>` |
| `dialogMode` | 弹窗模式 ('add' \| 'edit') | `Ref<string>` |
| `formData` | 表单数据 | `Ref<T>` |
| `openDialog` | 打开弹窗方法 | `(mode, row?) => void` |
| `submitForm` | 提交表单方法 | `Function` |
| `resetForm` | 重置表单方法 | `Function` |

## 📄 License

MIT License © 2025 [YongHangPu](https://github.com/YongHangPu)
