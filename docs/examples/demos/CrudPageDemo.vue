<template>
  <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
    <el-input v-model="searchParams.keyword" placeholder="关键字" style="width:220px" />
    <el-button type="primary" @click="handleSearch">搜索</el-button>
    <el-button @click="handleReset">重置</el-button>
    <el-button type="success" @click="openDialog('add')">新增</el-button>
    <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
  </div>

  <el-table :data="tableData" v-loading="loading" style="width:100%;" @selection-change="handleSelectionChange">
    <el-table-column type="selection" width="48" />
    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column prop="name" label="名称" />
    <el-table-column prop="createdAt" label="创建时间" width="180" />
    <el-table-column label="操作" width="220">
      <template #default="{ row }">
        <el-button size="small" @click="openDialog('edit', row)">编辑</el-button>
        <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <div style="display:flex; justify-content:flex-end; margin-top:10px;">
    <el-pagination
      :current-page="pageInfo.pageNum"
      :page-size="pageInfo.pageSize"
      :total="pageInfo.total"
      :page-sizes="[10,20,50]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
  </div>

  <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增' : '编辑'" width="500">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="88px" v-loading="formLoading">
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleDialogClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitForm">提交</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
/**
 * 示例组件：综合 CRUD Hook 演示
 * 功能：演示 useCrudPage 的列表、搜索、分页、增删改、编辑弹窗等能力
 * 参数：无
 * 返回值：无（SFC 组件）
 */
import { useCrudPage } from '@/hooks/useCrudPage'

/**
 * 表单规则常量
 * 功能：定义 Element Plus 表单校验规则
 * 取值范围：名称必填
 */
const rules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

/**
 * 模拟服务端数据源
 * 功能：在组件内维护一个可变的数组作为数据源
 * 取值范围：对象数组，包含 id/name/createdAt
 */
let mockData: Array<{ id: number; name: string; createdAt: string }> = Array.from({ length: 23 }).map((_, i) => ({
  id: i + 1,
  name: `条目-${i + 1}`,
  createdAt: new Date(Date.now() - i * 86400000).toLocaleString()
}))

/**
 * 列表接口
 * @param params 分页与搜索参数
 * @returns Promise<{ rows: any[]; total: number }>
 */
const listApi = async (params: any): Promise<{ rows: any[]; total: number }> => {
  const filtered = params.keyword ? mockData.filter(x => x.name.includes(params.keyword)) : mockData
  const start = (params.pageNum - 1) * params.pageSize
  const end = start + params.pageSize
  return new Promise(resolve => setTimeout(() => resolve({ rows: filtered.slice(start, end), total: filtered.length }), 200))
}

/**
 * 新增接口
 * @param data 表单数据
 * @returns Promise<{ msg: string }>
 */
const addApi = async (data: { name: string }): Promise<{ msg: string }> => {
  const id = (mockData.at(-1)?.id || 0) + 1
  mockData.unshift({ id, name: data.name, createdAt: new Date().toLocaleString() })
  return new Promise(resolve => setTimeout(() => resolve({ msg: '新增成功' }), 200))
}

/**
 * 更新接口
 * @param data 表单数据
 * @returns Promise<{ msg: string }>
 */
const updateApi = async (data: { id: number; name: string }): Promise<{ msg: string }> => {
  mockData = mockData.map(x => (x.id === data.id ? { ...x, name: data.name } : x))
  return new Promise(resolve => setTimeout(() => resolve({ msg: '更新成功' }), 200))
}

/**
 * 获取单条接口
 * @param id 数据ID
 * @returns Promise<{ data: any }>
 */
const getApi = async (id: number): Promise<{ data: any }> => {
  const found = mockData.find(x => x.id === id)
  return new Promise(resolve => setTimeout(() => resolve({ data: found }), 200))
}

/**
 * 删除接口
 * @param id 数据ID
 * @returns Promise<{ msg: string }>
 */
const deleteApi = async (id: number): Promise<{ msg: string }> => {
  mockData = mockData.filter(x => x.id !== id)
  return new Promise(resolve => setTimeout(() => resolve({ msg: '删除成功' }), 200))
}

/**
 * 批量删除接口
 * @param ids ID 列表
 * @returns Promise<{ msg: string }>
 */
const batchDeleteApi = async (ids: number[]): Promise<{ msg: string }> => {
  const set = new Set(ids)
  mockData = mockData.filter(x => !set.has(x.id))
  return new Promise(resolve => setTimeout(() => resolve({ msg: `批量删除 ${ids.length} 条` }), 200))
}

/**
 * 删除所有接口
 * @returns Promise<{ msg: string }>
 */
const deleteAllApi = async (): Promise<{ msg: string }> => {
  mockData = []
  return new Promise(resolve => setTimeout(() => resolve({ msg: '已清空' }), 200))
}

const {
  // 表格
  tableData,
  loading,
  pageInfo,
  searchParams,
  selectedRows,
  selectedIds,
  // 基础
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  // 删除
  handleSelectionChange,
  handleDelete,
  handleBatchDelete,
  // 弹窗
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
} = useCrudPage({
  apis: { list: listApi, add: addApi, update: updateApi, delete: deleteApi, batchDelete: batchDeleteApi, deleteAll: deleteAllApi, get: getApi },
  form: {
    initialData: { id: undefined as any, name: '' },
    rules,
    onSuccess: () => {}
  },
  search: { initialParams: { keyword: '' } },
  table: { autoFetch: true }
})
</script>

<style scoped>
/* 常量说明：该样式用于示例布局与间距控制 */
</style>

