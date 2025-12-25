<template>
  <div class="use-table-page-basic">
    <!-- 搜索区域 -->
    <div class="search-area">
      <el-form :inline="true" :model="searchParams">
        <el-form-item label="姓名">
          <el-input v-model="searchParams.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作按钮 -->
    <div class="action-area" style="margin-bottom: 16px;">
      <el-button type="danger" :disabled="!selection.length" @click="handleBatchDelete">批量删除</el-button>
    </div>

    <!-- 表格组件 -->
    <CustomTable
      v-if="tableConfig"
      :config="tableConfig"
      :data="tableData"
      :loading="loading"
      v-bind="tableEventHandlers"
    />
  </div>
</template>

<script setup lang="ts">
import { useTablePage, CustomTable } from 'vue3-crud-hooks'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟API接口
const mockApi = (params: any) => {
  console.log('API请求参数:', params)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        msg: 'success',
        data: {
          total: 100,
          rows: Array.from({ length: params.pageSize }).map((_, index) => ({
            id: (params.pageNum - 1) * params.pageSize + index + 1,
            name: `用户 ${(params.pageNum - 1) * params.pageSize + index + 1}`,
            age: Math.floor(Math.random() * 60) + 18,
            address: `北京市朝阳区第 ${index + 1} 号院`
          }))
        }
      })
    }, 500)
  })
}

// 模拟删除接口
const deleteApi = (id: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ code: 200, msg: '删除成功' })
    }, 500)
  })
}

// 模拟批量删除接口
const batchDeleteApi = (ids: any[]) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ code: 200, msg: '批量删除成功' })
    }, 500)
  })
}

// 使用 useTablePage Hook
const {
  tableData,
  loading,
  searchParams,
  selection,
  tableConfig,
  tableEventHandlers,
  handleSearch,
  handleReset,
  handleBatchDelete
} = useTablePage(
  mockApi,
  { name: '' }, // 初始搜索条件
  {
    // 表格配置
    customTableConfig: {
      selection: true,
      index: { label: '序号', width: 60 },
      columns: [
        { prop: 'name', label: '姓名', width: 120 },
        { prop: 'age', label: '年龄', width: 100 },
        { prop: 'address', label: '地址' },
        {
          label: '操作',
          width: 150,
          fixed: 'right',
          actions: [
            {
              label: '删除',
              type: 'danger',
              event: 'delete'
            }
          ]
        }
      ]
    },
    // 消息提示配置
    messageApi: {
      success: (msg) => ElMessage.success(msg),
      warning: (msg) => ElMessage.warning(msg),
      error: (msg) => ElMessage.error(msg),
      confirm: (msg) => ElMessageBox.confirm(msg, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    }
  },
  {
    // 删除配置
    deleteApi,
    batchDeleteApi,
    idKey: 'id'
  }
)
</script>

<style scoped>
.use-table-page-basic {
  width: 100%;
}
</style>
