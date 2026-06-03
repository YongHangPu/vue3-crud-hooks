<template>
  <div class="demo-container">
    <div style="display:flex;gap:10px;margin-bottom:16px;align-items:center">
      <span>当前页: {{ page }}，每页 {{ pageSize }} 条</span>
      <el-button size="small" @click="onChange({ currentPage:1, pageSize:10 })">跳到第 1 页</el-button>
    </div>

    <Pagination
      :total="100"
      :currentPage="page"
      :pageSize="pageSize"
      :pageSizes="[5, 10, 20, 50]"
      @pagination="onChange"
      autoScroll
    />

    <el-divider />

    <h4>事件日志</h4>
    <pre class="log">{{ log }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Pagination } from 'vue3-crud-hooks'

const page = ref(1)
const pageSize = ref(10)
const log = ref('等待操作...')

const onChange = (val: { currentPage: number; pageSize: number }) => {
  page.value = val.currentPage
  pageSize.value = val.pageSize
  log.value = JSON.stringify(val, null, 2)
}
</script>

<style scoped>
.log { background: #f5f7fa; padding: 12px; border-radius: 4px; }
</style>
