<template>
  <div class="demo-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <el-input
        v-model="searchParams.keyword"
        placeholder="请输入名称"
        clearable
        style="width: 200px"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="openDialog('add')">新增</el-button>
      <el-button
        type="danger"
        :disabled="!selection.length"
        @click="handleBatchDelete"
      >
        批量删除
      </el-button>
    </div>

    <!-- 表格区域 -->
    <CustomTable
      :config="cusTableConfig"
      :data="tableData"
      :loading="loading"
      @selection-change="tableEventHandlers.onSelectionChange"
      @pagination="tableEventHandlers.onPagination"
    >
      <!-- 自定义操作列 -->
      <template #action="{ row }">
        <el-button type="primary" link @click="openDialog('edit', row)">
          编辑
        </el-button>
        <el-button type="danger" link @click="handleDelete(row)">
          删除
        </el-button>
      </template>
    </CustomTable>

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
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
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="submitForm"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useCrudPage, CustomTable } from 'vue3-crud-hooks'
import { reactive } from 'vue'


// 模拟数据
let mockData = Array.from({ length: 20 }).map((_, index) => ({
  id: index + 1,
  name: `User ${index + 1}`,
  status: index % 2,
  createTime: new Date().toLocaleString()
}))

// 模拟 API
const api = {
  getList: (params: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { pageNum, pageSize, keyword } = params
        let list = mockData
        if (keyword) {
          list = list.filter((item) => item.name.includes(keyword))
        }
        const start = (pageNum - 1) * pageSize
        const end = start + pageSize
        resolve({
          rows: list.slice(start, end),
          total: list.length
        })
      }, 500)
    })
  },
  add: (data: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockData.unshift({
          id: mockData.length + 1,
          ...data,
          createTime: new Date().toLocaleString()
        })
        resolve({ msg: '添加成功' })
      }, 500)
    })
  },
  update: (data: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockData.findIndex((item) => item.id === data.id)
        if (index > -1) {
          mockData[index] = { ...mockData[index], ...data }
        }
        resolve({ msg: '更新成功' })
      }, 500)
    })
  },
  delete: (id: number) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockData = mockData.filter((item) => item.id !== id)
        resolve({ msg: '删除成功' })
      }, 500)
    })
  },
  batchDelete: (ids: number[]) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockData = mockData.filter((item) => !ids.includes(item.id))
        resolve({ msg: '批量删除成功' })
      }, 500)
    })
  }
}

// 表单规则
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 使用 useCrudPage
const {
  // 表格状态
  cusTableConfig,
  tableData,
  loading,
  selection,
  searchParams,
  // 表格事件
  tableEventHandlers,
  // 表格操作
  handleSearch,
  handleReset,
  handleDelete,
  handleBatchDelete,
  // 表单状态
  dialogVisible,
  dialogMode,
  formData,
  formRef,
  submitLoading,
  // 表单操作
  openDialog,
  handleDialogClose,
  submitForm
} = useCrudPage({
  // 简化配置模式
  apis: {
    list: api.getList,
    add: api.add,
    update: api.update,
    delete: api.delete,
    batchDelete: api.batchDelete
  },
  table: {
    dataKey: 'rows',
    totalKey: 'total',
    config: {
      selection: true,
      index: { width: 60, align: 'center' },
      columns: [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'name', label: '名称' },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: any) => (row.status === 1 ? '启用' : '禁用')
        },
        { prop: 'createTime', label: '创建时间', width: 180 },
        { prop: 'action', label: '操作', width: 150, slotName: 'action' }
      ]
    }
  },
  form: {
    initialData: {
      name: '',
      status: 1
    },
    rules
  },
  search: {
    initialData: {
      keyword: ''
    }
  },
  advanced: {
    callbacks: {
      onDeleteSuccess: () => {
        handleSearch()
      },
      onBatchDeleteSuccess: () => {
        handleSearch()
      }
    }
  }
})
</script>

<style scoped>
.search-area {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>
