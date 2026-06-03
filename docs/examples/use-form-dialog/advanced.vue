<template>
  <div class="demo-container">
    <el-button type="primary" @click="openDialog('add')">新增（带数据转换）</el-button>
    <el-divider />

    <CustomTable :config="tableConfig" :data="tableData" :loading="loading" @action="handleAction">
      <template #techStack="{ row }">
        <el-tag v-for="t in (row.techStack || '').split(',')" :key="t" style="margin-right:4px">{{ t }}</el-tag>
      </template>
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
      </template>
    </CustomTable>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增' : '编辑'" width="520px" :before-close="handleDialogClose">
      <el-form ref="formRef" :model="formData" label-width="100px" v-loading="formLoading">
        <el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入名称' }]">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="技术栈" prop="techStack">
          <el-select v-model="formData.techStack" multiple style="width:100%">
            <el-option label="Vue" value="vue" />
            <el-option label="React" value="react" />
            <el-option label="Angular" value="angular" />
            <el-option label="Node.js" value="node" />
          </el-select>
          <div class="tip">提交前自动 join 为 "vue,react"</div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" active-text="启用" inactive-text="禁用" />
          <span class="tip" style="margin-left:10px">提交前自动转为 1/0</span>
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
import { ref, onMounted } from 'vue'
import { useFormDialog, CustomTable, type CustomTableConfig } from 'vue3-crud-hooks'

// ─── 模拟数据 ───
interface Project { id: number; name: string; techStack: string; status: number }
const db = ref<Project[]>([
  { id: 1001, name: 'Vue3 Admin', techStack: 'vue,node', status: 1 },
  { id: 1002, name: 'React App', techStack: 'react', status: 0 },
])
const listApi = () => Promise.resolve([...db.value])
const addApi = (d: any) => { db.value.push({ ...d, id: Date.now() }); return Promise.resolve({ msg: '保存成功' }) }
const updateApi = (d: any) => { const i = db.value.findIndex((x) => x.id === d.id); if (i > -1) db.value[i] = d; return Promise.resolve({ msg: '更新成功' }) }
const getApi = (id: number) => {
  const item = db.value.find((i) => i.id === id)
  return Promise.resolve({ data: { ...item } })
}

// ─── 列表 ───
const tableData = ref<Project[]>([]); const loading = ref(false)
const fetchList = async () => { loading.value = true; tableData.value = await listApi(); loading.value = false }
onMounted(fetchList)

const tableConfig: CustomTableConfig = {
  index: { minWidth: 60, align: 'center' },
  columns: [
    { prop: 'name', label: '名称' },
    { prop: 'techStack', label: '技术栈', slotName: 'techStack', width: 200 },
    { prop: 'status', label: '状态', slotName: 'status', width: 100 },
    { type: 'action', label: '操作', width: 100, buttons: [
      { event: 'edit', btnText: '编辑', type: 'primary' },
    ]},
  ],
}
const handleAction = (event: string, row: Project) => {
  if (event === 'edit') openDialog('edit', { id: row.id })  // 传入 id，触发 getApi
}

// ─── 弹窗（带数据转换） ───
const {
  dialogVisible, dialogMode, formData, formRef, submitLoading, formLoading,
  openDialog, submitForm, handleDialogClose,
} = useFormDialog({
  initialFormData: { name: '', techStack: [] as string[], status: false },
  addApi, updateApi, getApi,
  dataTransform: {
    beforeSubmit: (data: any) => ({
      ...data,
      techStack: data.techStack.join(','),
      status: data.status ? 1 : 0,
    }),
    afterGet: (data: any) => ({
      ...data,
      techStack: data.techStack ? data.techStack.split(',') : [],
      status: data.status === 1,
    }),
  },
  onAfterSubmit: fetchList,
})
</script>

<style scoped>
.tip { font-size: 12px; color: #909399; line-height: 20px; }
</style>
