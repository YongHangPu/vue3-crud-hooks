<template>
  <div class="demo-container">
    <div class="operation-area">
      <el-button type="primary" @click="openDialog('add')">新增用户</el-button>
      <el-button type="warning" :disabled="!selectedRows.length" @click="handleBatchDelete">批量删除</el-button>
    </div>

    <!-- 数据列表 -->
    <CustomTable
      :config="tableConfig"
      :data="tableData"
      :loading="loading"
      @action="handleTableAction"
      @selection-change="handleSelectionChange"
    />

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="formData.age" :min="1" :max="120" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFormDialog, CustomTable, type CustomTableConfig } from 'vue3-crud-hooks'

interface UserForm {
  id?: number
  username: string
  age: number
  email: string
}

// ================= 模拟后端数据与接口 =================
const mockData = ref<UserForm[]>([
  { id: 1, username: 'User1', age: 20, email: 'user1@example.com' },
  { id: 2, username: 'User2', age: 25, email: 'user2@example.com' },
])

const mockApi = {
  // 获取列表
  list: () => new Promise<UserForm[]>((resolve) => {
    setTimeout(() => resolve([...mockData.value]), 500)
  }),
  // 新增
  add: (data: UserForm) => new Promise((resolve) => {
    setTimeout(() => {
      const newId = Math.max(...mockData.value.map(i => i.id || 0), 0) + 1
      mockData.value.push({ ...data, id: newId })
      resolve({ msg: '新增成功' })
    }, 500)
  }),
  // 更新
  update: (data: UserForm) => new Promise((resolve) => {
    setTimeout(() => {
      const index = mockData.value.findIndex(item => item.id === data.id)
      if (index > -1) {
        mockData.value[index] = { ...data }
      }
      resolve({ msg: '更新成功' })
    }, 500)
  }),
  // 删除
  delete: (id: number) => new Promise((resolve) => {
    setTimeout(() => {
      mockData.value = mockData.value.filter(item => item.id !== id)
      resolve({ msg: '删除成功' })
    }, 300)
  })
}

// ================= 列表逻辑 =================
const loading = ref(false)
const tableData = ref<UserForm[]>([])
const selectedRows = ref<UserForm[]>([])

// 表格配置
const tableConfig: CustomTableConfig = {
  index: { minWidth: 60, align: 'center' },
  columns: [
    { prop: 'username', label: '用户名' },
    { prop: 'age', label: '年龄', width: 100 },
    { prop: 'email', label: '邮箱' },
    {
      prop: 'action',
      label: '操作',
      type: 'action',
      width: 150,
      buttons: [
        { event: 'edit', btnText: '编辑', type: 'primary', btnType: 'link' },
        { event: 'delete', btnText: '删除', type: 'danger', btnType: 'link' }
      ]
    }
  ]
}

const fetchList = async () => {
  loading.value = true
  tableData.value = await mockApi.list()
  loading.value = false
}

const handleSelectionChange = (rows: UserForm[]) => {
  selectedRows.value = rows
}

const handleTableAction = (event: string, row: UserForm) => {
  if (event === 'edit') {
    openDialog('edit', row)
  } else if (event === 'delete') {
    ElMessageBox.confirm('确认删除该用户吗？', '提示', { type: 'warning' })
      .then(async () => {
        await mockApi.delete(row.id!)
        ElMessage.success('删除成功')
        fetchList()
      })
  }
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条数据吗？`, '提示', { type: 'warning' })
    .then(async () => {
      for (const row of selectedRows.value) {
        await mockApi.delete(row.id!)
      }
      ElMessage.success('批量删除成功')
      selectedRows.value = []
      fetchList()
    })
}

onMounted(fetchList)

// ================= 表单弹窗逻辑 =================
const {
  dialogVisible,
  dialogMode,
  formData,
  formRef,
  submitLoading,
  openDialog,
  submitForm,
  handleDialogClose
} = useFormDialog<UserForm>({
  initialFormData: {
    username: '',
    age: 18,
    email: ''
  },
  addApi: mockApi.add,
  updateApi: mockApi.update,
  onSuccess: () => {
    // 提交成功后刷新列表
    fetchList()
  }
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}
</script>

<style scoped>
.operation-area {
  margin-bottom: 20px;
}
</style>
