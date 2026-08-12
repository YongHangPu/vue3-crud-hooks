<template>
  <div class="demo-container">
    <!-- 搜索区域：searchParams 支持 v-model -->
    <div class="search-area">
      <el-input v-model="searchParams.keyword" placeholder="名称搜索" clearable style="width: 200px" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="openDialog('add')">新增</el-button>
      <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">批量删除</el-button>
    </div>

    <!-- 表格：v-bind 一键绑定 -->
    <CustomTable v-bind="tableBindings">
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
    </CustomTable>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增' : '编辑'" width="500px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useCrudPage, CustomTable } from 'vue3-crud-hooks'

// ─── 模拟数据 ───
let mockData = Array.from({ length: 26 }).map((_, i) => ({
  id: i + 1, name: `User ${i + 1}`, status: i % 2,
  createTime: new Date().toLocaleString(),
}))

const api = {
  getList: (params: any) => new Promise<any>((resolve) => {
    setTimeout(() => {
      let list = [...mockData]
      if (params.keyword) list = list.filter((i) => i.name.includes(params.keyword))
      const start = (params.pageNum - 1) * params.pageSize
      resolve({ rows: list.slice(start, start + params.pageSize), total: list.length })
    }, 400)
  }),
  add: (data: any) => new Promise((resolve) => {
    mockData.unshift({ ...data, id: Date.now(), createTime: new Date().toLocaleString() })
    setTimeout(() => resolve({ msg: '添加成功' }), 400)
  }),
  update: (data: any) => new Promise((resolve) => {
    const idx = mockData.findIndex((i) => i.id === data.id)
    if (idx > -1) mockData[idx] = { ...mockData[idx], ...data }
    setTimeout(() => resolve({ msg: '更新成功' }), 400)
  }),
  delete: (id: number) => new Promise((resolve) => {
    mockData = mockData.filter((i) => i.id !== id)
    setTimeout(() => resolve({ msg: '删除成功' }), 400)
  }),
  batchDelete: (ids: number[]) => new Promise((resolve) => {
    mockData = mockData.filter((i) => !ids.includes(i.id))
    setTimeout(() => resolve({ msg: '批量删除成功' }), 400)
  }),
}

// ─── 表单规则 ───
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

// ─── 使用 useCrudPage ───
const {
  tableBindings,      // ⭐ v-bind 一键绑定
  searchParams,
  selectedRows,
  handleSearch,
  handleReset,
  handleDelete,
  handleBatchDelete,
  dialogVisible,
  dialogMode,
  formData,
  formRef,
  submitLoading,
  openDialog,
  handleDialogClose,
  submitForm,
} = useCrudPage({
  apis: {
    list: api.getList,
    add: api.add,
    update: api.update,
    delete: api.delete,
    batchDelete: api.batchDelete,
  },
  table: {
    config: {
      selection: true,
      index: { label: '#', width: 60, align: 'center' },
      columns: [
        { prop: 'name', label: '名称', minWidth: 120 },
        { prop: 'status', label: '状态', width: 100, slotName: 'status' },
        { prop: 'createTime', label: '创建时间', width: 180 },
        {
          type: 'action',
          label: '操作',
          width: 280,
          buttons: [
            // el-link 类型（默认），type 控制颜色
            { event: 'edit', btnText: '编辑', type: 'primary' },
            { event: 'view', btnText: '查看', type: 'success' },
            // el-button 类型，使用 btnType: 'button' + props 传原生属性
            { event: 'delete', btnText: '删除', btnType: 'button', type: 'danger', props: { size: 'small', plain: true } },
          ],
        },
      ],
      // 自定义事件（如 view）通过 onCustomAction 处理
      onCustomAction: (event, row) => {
        if (event === 'view') ElMessage.info(`查看: ${row.name}`)
      },
    },
  },
  form: { initialData: { name: '', status: 1 }, rules },
  search: { initialData: { keyword: '' } },
})
</script>

<style scoped>
.search-area { margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; }

/* 文档预览:约束表格高度(容器基准),避免分页器溢出预览区域 */
.demo-container {
  height: 420px;
  display: flex;
  flex-direction: column;
}
.demo-container .custom-table-container {
  flex: 1;
  min-height: 0;
}
</style>
