---
title: 快速开始
---

# 快速开始

- 目标：帮助新开发者 10 分钟完成一个可用的 CRUD 列表与表单弹窗
- 前置要求：Node 16+、pnpm 已安装

## 安装与运行

```sh
pnpm install
pnpm run docs:dev
```

## 基础约定

- 别名：`@` 指向 `docs/examples`
- 自动导入：已配置 `Element Plus` 与 `Vue` API（`ElMessage` 等可直接使用）
- 预览容器：使用 `@vitepress-demo-preview` 的 `demo-preview`

## 列表页：useTablePage（最小可用）

```ts
import { useTablePage } from 'vue3-crud-hooks'

/**
 * 获取列表数据的函数
 * 功能：根据分页与搜索参数返回 rows/total
 * 参数：params 任意对象，包含 pageNum/pageSize/keyword 等
 * 返回值：Promise<{ rows: any[]; total: number }>
 */
const fetchData = async (params: any): Promise<{ rows: any[]; total: number }> => ({ rows: [], total: 0 })

/**
 * 列表页 Hook 初始化
 * 功能：提供分页/搜索/删除/导出等能力
 * 返回值：状态与方法集合（tableData/loading/pageInfo/...）
 */
const {
  tableData,
  loading,
  pageInfo,
  searchParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange
} = useTablePage(fetchData, { keyword: '' }, { autoFetch: true })
```

```vue
<template>
  <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px;">
    <el-input v-model="searchParams.keyword" placeholder="关键字" style="width:220px" />
    <el-button type="primary" @click="handleSearch">搜索</el-button>
    <el-button @click="handleReset">重置</el-button>
  </div>
  <el-table :data="tableData" v-loading="loading" style="width:100%">
    <el-table-column prop="id" label="ID" width="100" />
    <el-table-column prop="name" label="名称" />
  </el-table>
  <el-pagination
    :current-page="pageInfo.pageNum"
    :page-size="pageInfo.pageSize"
    :total="pageInfo.total"
    background layout="prev, pager, next, sizes, total"
    @current-change="handlePageChange"
    @size-change="handleSizeChange"
  />
</template>
```

## 表单弹窗：useFormDialog（最小可用）

```ts
import { useFormDialog } from 'vue3-crud-hooks'

/**
 * 表单接口
 * 功能：新增/更新/获取单条数据
 * 参数：data/id
 * 返回值：Promise<any>
 */
const addApi = async (data: any) => ({ msg: '新增成功' })
const updateApi = async (data: any) => ({ msg: '更新成功' })
const getApi = async (id: number) => ({ data: { id, name: '示例' } })

/**
 * 弹窗 Hook 初始化
 * 功能：提供 openDialog/submitForm/resetForm 等方法
 */
const {
  dialogVisible,
  dialogMode,
  formRef,
  submitLoading,
  formLoading,
  formData,
  openDialog,
  submitForm,
  resetForm,
  handleDialogClose
} = useFormDialog({ initialFormData: { name: '' }, addApi, updateApi, getApi, onSuccess: () => {} })
```

```vue
<template>
  <el-button type="primary" @click="openDialog('add')">新增</el-button>
  <el-button @click="openDialog('edit', { id: 1 })">编辑</el-button>
  <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增' : '编辑'" width="520px">
    <el-form ref="formRef" :model="formData" :rules="{ name: [{ required: true, message: '请输入名称' }] }">
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleDialogClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitForm">提交</el-button>
    </template>
  </el-dialog>
</template>
```

## 综合：useCrudPage（一步到位）

```ts
import { useCrudPage } from 'vue3-crud-hooks'

/**
 * 综合 CRUD Hook
 * 功能：整合列表与表单，统一配置驱动
 * 返回值：列表与表单的状态与方法合集
 */
const list = async (params: any) => ({ rows: [], total: 0 })
const add = async (data: any) => ({ msg: '新增成功' })
const update = async (data: any) => ({ msg: '更新成功' })
const del = async (id: number) => ({ msg: '删除成功' })

const hook = useCrudPage({
  apis: { list, add, update, delete: del },
  form: { initialData: { name: '' }, rules: { name: [{ required: true }] } },
  search: { initialParams: { keyword: '' } },
  table: { autoFetch: true }
})
```

## 常见操作与建议

- 时间范围：配合 `useDataTransform.processTimeRange` 映射后端字段
- 空值清理：在请求前用 `cleanEmptyFields/deepCleanEmptyFields` 减少后端分支
- 数组字段：查询用 `arrayToString`，详情回显用 `stringToArray`
- 事件处理：表格操作列统一走 `tableEventHandlers.onAction`

## 完整页面模板

:::preview 完整模板 || 列表/搜索/分页/增删改/编辑弹窗
demo-preview=../examples/demos/CrudPageDemo.vue
:::

### 目录建议

- 页面组件：`src/views/xxx/List.vue`
- 接口封装：`src/api/xxx.ts`
- 业务 Hooks：`src/hooks/xxx.ts`（可直接复用本项目 Hooks）

### 集成步骤

- 将 `useCrudPage` 的 `apis/list/add/update/delete/get` 指向你的后端接口
- 根据后端响应调整 `dataKey/totalKey`、时间字段前缀与数组分隔符
- 在 `customTableConfig.columns` 中配置操作列与按钮事件；`edit` 事件可直接打开弹窗
