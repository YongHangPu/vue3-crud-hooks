<template>
  <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
    <el-input v-model="searchParams.keyword" placeholder="关键字" style="width:220px" />
    <el-date-picker v-model="searchParams.createRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" />
    <el-button type="primary" @click="handleSearch">搜索</el-button>
    <el-button @click="handleReset">重置</el-button>
    <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
  </div>

  <el-table :data="tableData" v-loading="loading" style="width:100%;">
    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column prop="name" label="名称" />
    <el-table-column prop="createdAt" label="创建时间" width="180" />
    <el-table-column label="操作" width="180">
      <template #default="{ row }">
        <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </el-table-column>
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
 * 示例组件：表格页 Hook 演示
 * 功能：演示 useTablePage 的搜索、分页、删除等能力
 * 参数：无
 * 返回值：无（SFC 组件）
 */
import useTablePage from '@/hooks/useTablePage'

/**
 * 模拟列表数据接口
 * @param params 请求参数（包含 pageNum/pageSize/keyword/createRange 等）
 * @returns Promise<{ rows: any[]; total: number }>
 */
const fetchData = async (params: any): Promise<{ rows: any[]; total: number }> => {
  const total = 53
  const start = (params.pageNum - 1) * params.pageSize
  const end = start + params.pageSize
  const all = Array.from({ length: total }).map((_, i) => ({
    id: i + 1,
    name: `示例数据-${i + 1}`,
    createdAt: new Date(Date.now() - i * 86400000).toLocaleString()
  }))
  const filtered = params.keyword ? all.filter(x => x.name.includes(params.keyword)) : all
  return new Promise(resolve => setTimeout(() => resolve({ rows: filtered.slice(start, end), total: filtered.length }), 300))
}

/**
 * 模拟删除接口
 * @param id 要删除的行 id
 * @returns Promise<{ msg: string }>
 */
const deleteApi = async (id: number): Promise<{ msg: string }> =>
  new Promise(resolve => setTimeout(() => resolve({ msg: `已删除 ${id}` }), 300))

/**
 * 模拟批量删除接口
 * @param ids 要删除的 id 列表
 * @returns Promise<{ msg: string }>
 */
const batchDeleteApi = async (ids: number[]): Promise<{ msg: string }> =>
  new Promise(resolve => setTimeout(() => resolve({ msg: `批量删除 ${ids.length} 条` }), 300))

const {
  tableData,
  loading,
  pageInfo,
  searchParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  handleDelete,
  handleBatchDelete
} = useTablePage(
  fetchData,
  { keyword: '', createRange: [] },
  {
    autoFetch: true,
    dataKey: 'rows',
    totalKey: 'total',
    timeFields: [{ field: 'createRange', prefix: { start: 'beginTime', end: 'endTime' } }]
  },
  { deleteApi, batchDeleteApi }
)
</script>

<style scoped>
/* 常量说明：该样式用于示例布局与间距控制 */
</style>

