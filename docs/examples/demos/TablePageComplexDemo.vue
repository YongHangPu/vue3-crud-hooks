<template>
  <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px; flex-wrap: wrap;">
    <el-input v-model="searchParams.keyword" placeholder="关键字" style="width:220px" />
    <el-button type="primary" @click="handleSearch">搜索</el-button>
    <el-button @click="handleReset">重置</el-button>
    <el-divider direction="vertical" />
    <el-switch v-model="showStatus" active-text="显示状态列" />
    <el-switch v-model="showCreatedAt" active-text="显示创建时间列" />
    <el-divider direction="vertical" />
    <el-switch v-model="canEdit" active-text="允许编辑" />
    <el-switch v-model="canDelete" active-text="允许删除" />
  </div>

  <el-table :data="tableData" v-loading="loading" style="width:100%;" @selection-change="tableEventHandlers.onSelectionChange">
    <el-table-column v-if="tableConfig?.selection" type="selection" width="48" />
    <el-table-column v-if="tableConfig?.index" type="index" :index="tableConfig.index.index" label="序号" width="80" />

    <template v-for="col in (tableConfig?.columns || [])" :key="col.prop || col.label">
      <!-- 展开列 -->
      <el-table-column v-if="col.type === 'expand'" type="expand">
        <template #default="{ row }">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="ID">{{ row.id }}</el-descriptions-item>
            <el-descriptions-item label="名称">{{ row.name }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ row.status }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ row.createdAt }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>

      <!-- 普通列 -->
      <el-table-column v-else-if="col.type !== 'action'" :prop="col.prop" :label="col.label" :width="col.width" :min-width="col.minWidth" />

      <!-- 操作列 -->
      <el-table-column v-else :label="col.label || '操作'" :width="col.width || 260">
        <template #default="{ row, $index }">
          <el-button v-for="btn in (col.buttons || [])"
                     :key="btn.btnText + $index"
                     :type="btn.type || 'primary'"
                     size="small"
                     :disabled="typeof btn.disabled === 'function' ? btn.disabled(row) : btn.disabled"
                     v-show="btn.visible ? btn.visible(row) : true"
                     @click="onAction(btn.event, row, $index)">
            {{ btn.btnText || '操作' }}
          </el-button>
        </template>
      </el-table-column>
    </template>
  </el-table>

  <div style="display:flex; justify-content:flex-end; margin-top:10px;">
    <el-pagination
      :current-page="pageInfo.pageNum"
      :page-size="pageInfo.pageSize"
      :total="pageInfo.total"
      :page-sizes="[10,20,50]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script lang="ts" setup>
/**
 * 示例组件：复杂演示（动态列、权限控制、展开列、操作按钮）
 * 功能：演示 useTablePage 的 setTableColumns、index/selection/expand/action 组合与权限控制
 * 参数：无
 * 返回值：无（SFC 组件）
 */
import { useTablePage } from 'vue3-crud-hooks'
import { ElMessage } from 'element-plus'

/**
 * 模拟列表接口
 * @param params 请求参数
 * @returns Promise<{ rows: any[]; total: number }>
 */
const fetchData = async (params: any): Promise<{ rows: any[]; total: number }> => {
  const total = 42
  const start = (params.pageNum - 1) * params.pageSize
  const end = start + params.pageSize
  const all = Array.from({ length: total }).map((_, i) => ({
    id: i + 1,
    name: `复杂-${i + 1}`,
    status: i % 3 === 0 ? '停用' : '启用',
    createdAt: new Date(Date.now() - i * 43200000).toLocaleString()
  }))
  const filtered = params.keyword ? all.filter(x => x.name.includes(params.keyword)) : all
  return new Promise(resolve => setTimeout(() => resolve({ rows: filtered.slice(start, end), total: filtered.length }), 200))
}

/**
 * 模拟删除接口
 * @param id 要删除的行ID
 * @returns Promise<{ msg: string }>
 */
const deleteApi = async (id: number): Promise<{ msg: string }> => new Promise(resolve => setTimeout(() => resolve({ msg: `删除 ${id} 成功` }), 200))

const {
  tableData,
  loading,
  pageInfo,
  searchParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  tableConfig,
  tableEventHandlers,
  setTableColumns
} = useTablePage(
  fetchData,
  { keyword: '' },
  {
    autoFetch: true,
    dataKey: 'rows',
    totalKey: 'total',
    customTableConfig: {
      selection: true,
      index: { label: '序号', width: 80 },
      columns: [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'name', label: '名称', minWidth: 160 },
        { prop: 'status', label: '状态', width: 100 },
        { prop: 'createdAt', label: '创建时间', width: 180 },
        { type: 'expand', label: '详情' },
        {
          type: 'action',
          label: '操作',
          width: 280,
          buttons: [
            { btnText: '查看', event: 'view', type: 'info' },
            { btnText: '编辑', event: 'edit', type: 'primary', disabled: (row: any) => !canEdit.value },
            { btnText: '删除', event: 'delete', type: 'danger', visible: () => canDelete.value, disabled: (row: any) => row.status === '停用' }
          ]
        }
      ],
      onCustomAction: (event: string, row: any) => {
        if (event === 'view') {
          ElMessage.info(`查看：${row.id}`)
        } else if (event === 'edit') {
          ElMessage.success(`编辑：${row.id}`)
        }
      },
      pagination: true
    }
  },
  { deleteApi }
)

/**
 * 动态列开关
 * 功能：通过 setTableColumns 在运行时切换列显示
 * 返回值：void
 */
const showStatus = ref(true)
const showCreatedAt = ref(true)
watch([showStatus, showCreatedAt], () => {
  const base = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'name', label: '名称', minWidth: 160 },
    ...(showStatus.value ? [{ prop: 'status', label: '状态', width: 100 }] : []),
    ...(showCreatedAt.value ? [{ prop: 'createdAt', label: '创建时间', width: 180 }] : []),
    { type: 'expand', label: '详情' },
    {
      type: 'action',
      label: '操作',
      width: 280,
      buttons: [
        { btnText: '查看', event: 'view', type: 'info' },
        { btnText: '编辑', event: 'edit', type: 'primary', disabled: (row: any) => !canEdit.value },
        { btnText: '删除', event: 'delete', type: 'danger', visible: () => canDelete.value, disabled: (row: any) => row.status === '停用' }
      ]
    }
  ]
  setTableColumns(base as any)
})

/**
 * 权限开关
 * 功能：控制按钮的可见与可用
 */
const canEdit = ref(true)
const canDelete = ref(true)

/**
 * 操作事件桥接
 * 功能：触发 useTablePage 的统一 onAction 以支持删除等默认逻辑与自定义事件
 * @param event 事件名
 * @param row 行数据
 * @param index 行索引
 * @returns void
 */
const onAction = (event: string, row: any, index: number): void => {
  tableEventHandlers.onAction(event, row, index)
}
</script>

<style scoped>
/* 常量说明：该样式用于示例布局与间距控制 */
</style>

