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
import { getList, addData, updateData, deleteData } from '@/api/demo'

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
  openDialog,     // 打开弹窗
  submitForm      // 提交表单
} = useCrudPage({
  // 1. API 配置（必填）
  apis: {
    list: getList,
    add: addData,
    update: updateData,
    delete: deleteData
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
    }
  }
})
</script>
```

### 2. 独立使用列表逻辑 (`useTablePage`)

如果你只需要管理一个表格列表，不需要弹窗功能。

```typescript
import { useTablePage } from 'vue3-crud-hooks'
// 或者子路径导入
import useTablePage from 'vue3-crud-hooks/useTablePage'

const {
  tableData,
  loading,
  pageInfo,
  getTableData,
  handleSearch,
  handleReset
} = useTablePage(getListApi, searchForm)
```

### 3. 独立使用弹窗逻辑 (`useFormDialog`)

如果你只需要一个通用的表单弹窗，处理新增/编辑逻辑。

```typescript
import { useFormDialog } from 'vue3-crud-hooks'
// 或者子路径导入
import useFormDialog from 'vue3-crud-hooks/useFormDialog'

const {
  dialogVisible,
  formData,
  openDialog,
  submitForm
} = useFormDialog({
  addApi: addData,
  updateApi: updateData,
  initialFormData: { name: '' }
})
```

### 4. 数据转换工具 (`useDataTransform`)

提供常用的数据转换方法，如数组转字符串、时间范围处理等。

```typescript
import { useDataTransform } from 'vue3-crud-hooks'
// 或者子路径导入
import useDataTransform from 'vue3-crud-hooks/useDataTransform'

const {
  arrayToString,
  stringToArray,
  processTimeRange,
  cleanEmptyFields
} = useDataTransform()

// 示例：处理时间范围
const params = processTimeRange(searchForm, 'createTime', { start: 'startTime', end: 'endTime' })
```

## 📚 核心 API

### `useCrudPage(config)`

整合了 `useTablePage` 和 `useFormDialog` 的功能。

#### 参数 (Config)

| 属性 | 说明 | 类型 | 必填 |
| --- | --- | --- | --- |
| `apis` | 接口配置 (list, add, update, delete) | `CrudApiConfig` | ✅ |
| `table` | 表格配置 (dataKey, totalKey, autoDetect...) | `TablePageConfig` | ❌ |
| `form` | 表单配置 (initialData, transform...) | `FormDialogConfig` | ❌ |
| `export` | 导出配置 (exportUrl) | `ExportConfig` | ❌ |

#### 返回值

包含 `useTablePage` 和 `useFormDialog` 的所有返回值，以及 `handleDelete` 等组合方法。

---

### `useTablePage(fetchApi, searchForm, config)`

#### 参数

| 参数名 | 说明 | 类型 |
| --- | --- | --- |
| `fetchApi` | 获取列表数据的接口函数 | `(params: any) => Promise<any>` |
| `searchForm` | 搜索表单的响应式对象 | `Ref<object>` |
| `config` | 配置项 | `TablePageConfig` |

#### 配置项 (config)

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `dataKey` | 接口返回的数据字段名 | `'list'` |
| `totalKey` | 接口返回的总数字段名 | `'total'` |
| `page` | 默认页码 | `1` |
| `size` | 默认每页条数 | `10` |
| `autoDetect` | 是否自动检测返回结构 | `false` |

#### 返回值

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `tableData` | 表格数据 | `Ref<any[]>` |
| `loading` | 加载状态 | `Ref<boolean>` |
| `pageInfo` | 分页信息 (current, size, total) | `Reactive` |
| `getTableData` | 获取数据方法 | `Function` |
| `handleSearch` | 搜索方法 | `Function` |
| `handleReset` | 重置搜索方法 | `Function` |
| `handleSelectionChange` | 表格多选处理 | `Function` |

---

### `useFormDialog(config)`

#### 参数 (Config)

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `addApi` | 新增接口 | `Function` |
| `updateApi` | 编辑接口 | `Function` |
| `initialFormData` | 表单初始数据 | `object` |
| `formRef` | 表单引用 (Element Plus Form) | `Ref` |
| `getDataTransform` | 获取详情后转换函数 | `Function` |
| `submitDataTransform` | 提交前数据转换函数 | `Function` |

#### 返回值

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `dialogVisible` | 弹窗显示状态 | `Ref<boolean>` |
| `dialogMode` | 弹窗模式 ('add' \| 'edit') | `Ref<string>` |
| `formData` | 表单数据 | `Ref<T>` |
| `openDialog` | 打开弹窗方法 | `Function` |
| `closeDialog` | 关闭弹窗方法 | `Function` |
| `submitForm` | 提交表单方法 | `Function` |

## 📄 License

MIT License © 2024 [YongHangPu](https://github.com/YongHangPu)
