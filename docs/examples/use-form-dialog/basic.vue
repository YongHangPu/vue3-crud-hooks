<template>
  <div class="demo-container">
    <el-button type="primary" @click="openDialog('add')">新增用户</el-button>
    <el-divider />

    <!-- 表格 + useTablePage 风格列表 -->
    <CustomTable
      :config="tableConfig"
      :data="tableData"
      :loading="loading"
      @action="handleAction"
    />

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增' : '编辑'" width="500px" :before-close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="username">
          <el-input v-model="formData.username" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="formData.age" :min="1" :max="120" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFormDialog, CustomTable, type CustomTableConfig } from 'vue3-crud-hooks'

interface User { id: number; username: string; age: number; email: string }

// ─── 模拟数据 ───
const db = ref<User[]>([
  { id: 1, username: 'Alice', age: 20, email: 'alice@test.com' },
  { id: 2, username: 'Bob', age: 25, email: 'bob@test.com' },
  { id: 3, username: 'Charlie', age: 30, email: 'charlie@test.com' },
])
const listApi = () => Promise.resolve([...db.value])
const addApi = (d: User) => { db.value.push({ ...d, id: Date.now() }); return Promise.resolve({ msg: '新增成功' }) }
const updateApi = (d: User) => { const i = db.value.findIndex((x) => x.id === d.id); if (i > -1) db.value[i] = d; return Promise.resolve({ msg: '更新成功' }) }
const delApi = (id: number) => { db.value = db.value.filter((x) => x.id !== id); return Promise.resolve({ msg: '删除成功' }) }

// ─── 列表 ───
const tableData = ref<User[]>([])
const loading = ref(false)
const fetchList = async () => { loading.value = true; tableData.value = await listApi(); loading.value = false }
onMounted(fetchList)

const tableConfig: CustomTableConfig = {
  index: { minWidth: 60, align: 'center' },
  columns: [
    { prop: 'username', label: '用户名' },
    { prop: 'age', label: '年龄', width: 100 },
    { prop: 'email', label: '邮箱' },
    { type: 'action', label: '操作', width: 150, buttons: [
      { event: 'edit', btnText: '编辑', type: 'primary' },
      { event: 'delete', btnText: '删除', type: 'danger' },
    ]},
  ],
}

const handleAction = (event: string, row: User) => {
  if (event === 'edit') openDialog('edit', row)
  if (event === 'delete') {
    ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' }).then(async () => {
      await delApi(row.id); ElMessage.success('删除成功'); fetchList()
    })
  }
}

// ─── 弹窗 ───
const rules = {
  username: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '格式错误', trigger: 'blur' }],
}
const { dialogVisible, dialogMode, formData, formRef, submitLoading, openDialog, submitForm, handleDialogClose } = useFormDialog<User>({
  initialFormData: { id: 0, username: '', age: 18, email: '' },
  addApi, updateApi,
  onAfterSubmit: fetchList,
})
</script>
