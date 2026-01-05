<template>
  <div class="demo-container">
    <div class="operation-area">
      <el-button type="primary" @click="openDialog('add')">新增 (带数据转换)</el-button>
    </div>

    <!-- 数据列表 -->
    <CustomTable
      :config="tableConfig"
      :data="tableData"
      :loading="loading"
      @action="handleTableAction"
    >
      <!-- 自定义列展示 -->
      <template #techStack="{ row }">
        <el-tag
          v-for="tech in (row.techStack || '').split(',')"
          :key="tech"
          style="margin-right: 4px"
        >
          {{ tech }}
        </el-tag>
      </template>
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
    </CustomTable>

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增项目' : '编辑项目'"
      width="500px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        label-width="100px"
        v-loading="formLoading"
      >
        <el-form-item label="项目名称" prop="name" :rules="[{ required: true, message: '请输入名称' }]">
          <el-input v-model="formData.name" />
        </el-form-item>

        <el-form-item label="技术栈" prop="techStack">
          <el-select
            v-model="formData.techStack"
            multiple
            placeholder="请选择技术栈"
            style="width: 100%"
          >
            <el-option label="Vue" value="vue" />
            <el-option label="React" value="react" />
            <el-option label="Angular" value="angular" />
            <el-option label="Node.js" value="node" />
          </el-select>
          <div class="tips">前端是数组，提交时自动转为逗号分隔字符串</div>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="formData.status"
            active-text="启用"
            inactive-text="禁用"
          />
          <span class="tips" style="margin-left: 10px">前端是Boolean，提交时自动转为 1/0</span>
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
import { useFormDialog, CustomTable, type CustomTableConfig } from 'vue3-crud-hooks'

// ================= 模拟后端数据与接口 =================
interface ProjectData {
  id: number
  name: string
  techStack: string // 数据库存字符串
  status: number // 数据库存 1/0
}

const mockData = ref<ProjectData[]>([
  { id: 1001, name: 'Vue3 Admin', techStack: 'vue,node', status: 1 },
  { id: 1002, name: 'React App', techStack: 'react', status: 0 },
])

const mockApi = {
  list: () => new Promise<ProjectData[]>((resolve) => {
    setTimeout(() => resolve([...mockData.value]), 500)
  }),

  add: (data: any) => new Promise(resolve => {
    setTimeout(() => {
      // 模拟后端接收数据
      const newItem = {
        ...data,
        id: Date.now()
      }
      mockData.value.push(newItem)
      resolve({ msg: '保存成功' })
    }, 1000)
  }),

  update: (data: any) => new Promise(resolve => {
    setTimeout(() => {
      const index = mockData.value.findIndex(item => item.id === data.id)
      if (index > -1) {
        mockData.value[index] = { ...data }
      }
      resolve({ msg: '更新成功' })
    }, 1000)
  }),

  // 模拟获取详情
  get: (id: any) => new Promise((resolve) => {
    setTimeout(() => {
      const item = mockData.value.find(i => i.id === id)
      resolve({
        data: { ...item }
      })
    }, 1500) // 模拟网络延迟
  })
}

// ================= 列表逻辑 =================
const loading = ref(false)
const tableData = ref<ProjectData[]>([])

const tableConfig: CustomTableConfig = {
  index: { minWidth: 60, align: 'center' },
  columns: [
    { prop: 'name', label: '项目名称' },
    { prop: 'techStack', label: '技术栈', slotName: 'techStack', width: 200 },
    { prop: 'status', label: '状态', slotName: 'status', width: 100 },
    {
      prop: 'action',
      label: '操作',
      type: 'action',
      width: 100,
      buttons: [
        { event: 'edit', btnText: '编辑', type: 'primary', btnType: 'link' }
      ]
    }
  ]
}

const fetchList = async () => {
  loading.value = true
  tableData.value = await mockApi.list()
  loading.value = false
}

const handleTableAction = (event: string, row: any) => {
  if (event === 'edit') {
    // 传入 ID，会自动调用 getApi 并触发 formLoading
    openDialog('edit', { id: row.id })
  }
}

onMounted(fetchList)

// ================= 表单弹窗逻辑 =================
const {
  dialogVisible,
  dialogMode,
  formData,
  formRef,
  submitLoading,
  formLoading,
  openDialog,
  submitForm,
  handleDialogClose
} = useFormDialog({
  initialFormData: {
    name: '',
    techStack: [], // 表单中使用数组
    status: false
  },
  // 配置 API
  addApi: mockApi.add,
  updateApi: mockApi.update,
  getApi: mockApi.get,

  // 数据转换配置
  dataTransform: {
    // 提交前：将数组转换为字符串，boolean 转 number
    beforeSubmit: (data) => {
      return {
        ...data,
        techStack: data.techStack.join(','),
        status: data.status ? 1 : 0
      }
    },
    // 获取详情后：将字符串转换为数组，number 转 boolean
    afterGet: (data) => {
      return {
        ...data,
        techStack: data.techStack ? data.techStack.split(',') : [],
        status: data.status === 1
      }
    }
  },
  onSuccess: () => {
    fetchList()
  }
})
</script>

<style scoped>
.operation-area {
  margin-bottom: 20px;
}
.tips {
  font-size: 12px;
  color: #909399;
  line-height: 20px;
}
</style>
