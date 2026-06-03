<template>
  <div class="demo-container">
    <!-- 搜索：支持关键词 + 状态 + 时间范围 -->
    <div class="search-area">
      <el-input v-model="searchParams.keyword" placeholder="名称" clearable style="width: 160px" />
      <el-select v-model="searchParams.status" placeholder="状态" clearable style="width: 110px">
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-date-picker v-model="searchParams.createTime" type="daterange" range-separator="至"
        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 230px" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="openDialog('add')">新增</el-button>
      <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">批量删除</el-button>
      <el-button type="warning" @click="handleExport">导出</el-button>
    </div>

    <!-- 表格 -->
    <CustomTable v-bind="tableBindings">
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
      </template>
      <template #tags="{ row }">
        <el-tag v-for="t in (row.tags || '').split(',')" :key="t" size="small" style="margin-right:4px">{{ t }}</el-tag>
      </template>
    </CustomTable>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增' : '编辑'" width="520px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select v-model="formData.tags" multiple filterable allow-create style="width:100%">
            <el-option label="Vue" value="Vue" />
            <el-option label="React" value="React" />
            <el-option label="Angular" value="Angular" />
          </el-select>
          <div class="tip">数组字段提交时自动转为逗号字符串</div>
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

let mockData = Array.from({ length: 26 }).map((_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  status: i % 2,
  tags: [['Vue'], ['React'], ['Vue', 'React']][i % 3].join(','),
  createTime: '2025-01-01',
}))

const api = {
  getList: (params: any) => new Promise<any>((resolve) => {
    setTimeout(() => {
      let list = [...mockData]
      if (params.keyword) list = list.filter((i) => i.name.includes(params.keyword))
      if (params.status !== undefined && params.status !== '') list = list.filter((i) => i.status === params.status)
      if (params.startTime && params.endTime) list = list.filter((i) => i.createTime >= params.startTime && i.createTime <= params.endTime)
      const start = (params.pageNum - 1) * params.pageSize
      resolve({ rows: list.slice(start, start + params.pageSize), total: list.length })
    }, 400)
  }),
  add: (data: any) => new Promise((resolve) => {
    mockData.unshift({ ...data, id: Date.now(), createTime: '2025-06-01' })
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
  export: (_params: any) => new Promise((resolve) => {
    setTimeout(() => { alert('导出触发，查看控制台'); resolve({}) }, 400)
  }),
}

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  tags: [{ required: true, message: '请选择标签', trigger: 'change', type: 'array' as const }],
}

const {
  tableBindings,
  searchParams,
  selectedRows,
  handleSearch,
  handleReset,
  handleDelete,
  handleBatchDelete,
  handleExport,
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
    export: api.export,
  },
  table: {
    config: {
      selection: true,
      index: { label: '序号', width: 60, align: 'center' },
      columns: [
        { prop: 'name', label: '名称', minWidth: 120 },
        { prop: 'status', label: '状态', width: 100, slotName: 'status' },
        { prop: 'tags', label: '标签', minWidth: 160, slotName: 'tags' },
        { prop: 'createTime', label: '创建时间', width: 180 },
        {
          type: 'action',
          label: '操作',
          width: 300,
          fixed: 'right' as const,
          buttons: [
            // el-link 类型（btnType 默认 'link'），适合轻量操作
            { btnText: '编辑', event: 'edit', type: 'primary' },
            { btnText: '查看', event: 'view', type: 'success' },
            // el-button 类型：btnType: 'button'，适合需要明显点击区域的场景
            // 可通过 props 传递 size / plain / round 等原生属性
            { btnText: '删除', event: 'delete', btnType: 'button', type: 'danger', props: { size: 'small', plain: true } },
          ],
        },
      ],
      // 自定义事件处理：内置 edit/delete 由 useCrudPage 自动处理，
      // 其他自定义事件（如 view）通过 onCustomAction 接管
      onCustomAction: (event, row) => {
        if (event === 'view') {
          ElMessage.info(`查看: ${row.name}`)
        }
      },
    },
  },
  form: {
    initialData: { name: '', status: 1, tags: [] },
    rules,
  },
  search: {
    initialData: { keyword: '', status: undefined, createTime: [] },
  },
  advanced: {
    // 数组字段自动转换：['Vue','React'] ↔ "Vue,React"
    arrayFields: ['tags'],
    // 时间范围自动拆分：[start, end] → { startTime, endTime }
    timeFields: [{ field: 'createTime', prefix: { start: 'startTime', end: 'endTime' } }],
  },
})
</script>

<style scoped>
.search-area { margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.tip { font-size: 12px; color: #909399; }
</style>
