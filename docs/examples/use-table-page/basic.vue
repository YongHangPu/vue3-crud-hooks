<template>
  <div class="demo-container">
    <!-- 搜索栏 -->
    <div class="search-area">
      <el-input v-model="searchParams.name" placeholder="姓名" clearable style="width: 160px" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">批量删除</el-button>
    </div>

    <!-- 表格：v-bind 一键绑定 -->
    <CustomTable v-bind="tableBindings" />
  </div>
</template>

<script setup lang="ts">
import { useTablePage, CustomTable } from 'vue3-crud-hooks'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟列表接口
const fetchList = (params: any) => new Promise<any>((resolve) => {
  setTimeout(() => {
    const list = Array.from({ length: params.pageSize }).map((_, i) => ({
      id: (params.pageNum - 1) * params.pageSize + i + 1,
      name: `用户 ${(params.pageNum - 1) * params.pageSize + i + 1}`,
      age: Math.floor(Math.random() * 40) + 20,
      address: `地址 ${i + 1}`,
    }))
    resolve({ rows: list, total: 58 })
  }, 400)
})

const deleteItem = (id: number) => new Promise((resolve) => {
  setTimeout(() => resolve({ msg: '删除成功' }), 300)
})

const batchDeleteItems = (ids: number[]) => new Promise((resolve) => {
  setTimeout(() => resolve({ msg: '批量删除成功' }), 300)
})

const {
  tableBindings,
  searchParams,
  selectedRows,
  handleSearch,
  handleReset,
  handleBatchDelete,
} = useTablePage(
  fetchList,
  { name: '' },
  {
    customTableConfig: {
      selection: true,
      index: { label: '序号', width: 60 },
      columns: [
        { prop: 'name', label: '姓名', width: 120 },
        { prop: 'age', label: '年龄', width: 100 },
        { prop: 'address', label: '地址' },
        {
          type: 'action',
          label: '操作',
          width: 200,
          fixed: 'right',
          buttons: [
            { event: 'view', btnText: '查看', type: 'primary' },
            { event: 'delete', btnText: '删除', btnType: 'button', type: 'danger', props: { size: 'small', plain: true } },
          ],
        },
      ],
      // 自定义事件（如 view）通过 onCustomAction 处理
      onCustomAction: (event, row) => {
        if (event === 'view') ElMessage.info(`查看: ${row.name}`)
      },
    },
    messageApi: {
      success: (msg) => ElMessage.success(msg),
      warning: (msg) => ElMessage.warning(msg),
      error: (msg) => ElMessage.error(msg),
      confirm: (msg) => ElMessageBox.confirm(msg, '提示', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
      }),
    },
  },
  { deleteApi: deleteItem, batchDeleteApi: batchDeleteItems, idKey: 'id' },
)
</script>

<style scoped>
.demo-container { padding: 10px; }
.search-area { margin-bottom: 16px; display: flex; gap: 10px; }

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
