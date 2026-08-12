<template>
  <!-- 固定高度的 flex 容器:让内层 demo-container 成为被 flex 约束的容器(容器基准) -->
  <div class="preview-box">
    <div class="demo-container" ref="demoRef">
      <div class="toolbar">
        <el-button size="small" @click="showSearch = !showSearch">
          {{ showSearch ? '收起' : '展开' }}搜索栏
        </el-button>
        <el-tag size="small" type="info">当前表格高度: {{ tableMaxHeight }}px</el-tag>
      </div>

      <!-- 模拟搜索栏:展开/收起改变页面布局,useTableHeight 通过 watchSources 自动重算 -->
      <div v-if="showSearch" class="fake-search">
        模拟高级搜索栏:展开/收起会改变布局,表格高度通过 watchSources 联动重算
      </div>

      <!-- 原生 el-table,height 绑定 tableMaxHeight(容器基准:填满 demo-container 剩余空间) -->
      <el-table ref="tableRef" :data="rows" :height="tableMaxHeight" border>
        <el-table-column prop="name" label="名称" min-width="100" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="role" label="角色" width="100" />
      </el-table>

      <Pagination ref="paginationRef" :total="total" :current-page="page" :page-size="pageSize" @pagination="onPage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTableHeight, Pagination } from 'vue3-crud-hooks'

const tableRef = ref()
const paginationRef = ref()
const demoRef = ref() // 容器引用:传给 useTableHeight 做容器基准(表格填满容器)
const showSearch = ref(true)
const rows = ref<any[]>([])
const total = ref(50)
const page = ref(1)
const pageSize = ref(10)

const { tableMaxHeight } = useTableHeight(tableRef, paginationRef, {
  containerRef: demoRef,     // 容器基准:表格高度 = 容器可用空间
  watchSources: [showSearch], // 搜索栏展开/收起时联动重算
  minHeight: 160,
  extraGap: 24,
})

// 模拟列表接口
const fetchList = (p: number, s: number) => {
  const list = Array.from({ length: s }).map((_, i) => ({
    id: (p - 1) * s + i + 1,
    name: `用户 ${(p - 1) * s + i + 1}`,
    email: `user${(p - 1) * s + i + 1}@demo.com`,
    role: ['admin', 'user', 'editor'][i % 3],
  }))
  rows.value = list
}
fetchList(page.value, pageSize.value)

const onPage = (p: { currentPage: number; pageSize: number }) => {
  page.value = p.currentPage
  pageSize.value = p.pageSize
  fetchList(p.currentPage, p.pageSize)
}
</script>

<style scoped>
.preview-box {
  display: flex;
  flex-direction: column;
  height: 420px;
}
.demo-container {
  flex: 1; /* 被 preview-box(flex)约束 → useTableHeight 容器基准 */
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.demo-container .el-table {
  flex-shrink: 0; /* 高度由 tableMaxHeight 决定,不被 flex 压缩 */
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.fake-search {
  height: 40px;
  line-height: 40px;
  padding: 0 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}
</style>
