<template>
  <div class="demo-container">
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <el-button type="primary" @click="addRow">添加行</el-button>
      <el-tag>{{ selectedInfo }}</el-tag>
    </div>

    <CustomTable
      :config="tableConfig"
      :data="tableData"
      :loading="loading"
      @pagination="onPagination"
      @action="onAction"
      @selection-change="onSelection"
      @row-click="onRowClick"
      highlight-current-row
    >
      <template #status="{ row }">
        <el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag>
      </template>
    </CustomTable>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CustomTable, type CustomTableConfig } from 'vue3-crud-hooks'

const loading = ref(false)

const tableData = ref(
  Array.from({ length: 46 }).map((_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    status: i % 3 === 0 ? 'inactive' : 'active',
    value: Math.floor(Math.random() * 1000),
  }))
)

const page = ref(1)
const pageSize = ref(10)

const tableConfig: CustomTableConfig = {
  selection: true,
  index: { label: '#', width: 60, align: 'center' },
  columns: [
    { prop: 'name', label: '名称', minWidth: 140, sortable: true },
    { prop: 'status', label: '状态', width: 100, slotName: 'status', filters: [
      { text: 'Active', value: 'active' },
      { text: 'Inactive', value: 'inactive' },
    ]},
    { prop: 'value', label: '数值', width: 120, sortable: true },
    {
      type: 'action',
      label: '操作',
      width: 280,
      buttons: [
        // el-link 类型（默认）：btnType 不传或传 'link'
        { event: 'view', btnText: '查看', type: 'primary' },
        { event: 'edit', btnText: '编辑', type: 'success' },
        { event: 'copy', btnText: '复制', btnType: 'link', type: 'warning' },
        // el-button 类型：需要设置 btnType: 'button'
        // 可通过 props 传递 el-button 原生属性，如 size, plain, round 等
        { event: 'delete', btnText: '删除', btnType: 'button', type: 'danger', props: { size: 'small', plain: true } },
      ],
    },
  ],
  pagination: {
    currentPage: 1,
    pageSize: 10,
  },
}

const selectedInfo = ref('未选中')
const onSelection = (sel: any[]) => {
  selectedInfo.value = sel.length ? `已选中 ${sel.length} 行` : '未选中'
}
const onRowClick = (row: any) => {
  ElMessage.info(`点击行: ${row.name}`)
}
const onAction = (event: string, row: any) => {
  const actions: Record<string, string> = {
    view: '查看',
    edit: '编辑',
    copy: '复制',
    delete: '删除',
  }
  ElMessage.info(`${actions[event] || event}: ${row.name}`)
}
const onPagination = (val: { currentPage: number; pageSize: number }) => {
  page.value = val.currentPage
  pageSize.value = val.pageSize
  loading.value = true
  setTimeout(() => { loading.value = false }, 300)
}

const addRow = () => {
  const newId = tableData.value.length + 1
  tableData.value.unshift({ id: newId, name: `New ${newId}`, status: 'active', value: 0 })
}
</script>

<style scoped>
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
