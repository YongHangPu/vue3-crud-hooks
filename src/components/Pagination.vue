<template>
  <div :class="{ hidden: hidden }" class="pagination-container" v-bind="$attrs">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :background="background"
      :layout="layout"
      :page-sizes="pageSizes"
      :pager-count="pagerCount"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElPagination } from 'element-plus';
import { scrollTo } from '@/utils/scroll-to';

interface Props {
  total?: number;
  page?: number;
  limit?: number;
  pageSizes?: number[];
  pagerCount?: number;
  layout?: string;
  background?: boolean;
  autoScroll?: boolean;
  hidden?: boolean;
  float?: string;
}

const props = withDefaults(defineProps<Props>(), {
  total: 0,
  page: 1,
  limit: 20,
  pageSizes: () => [10, 20, 30, 50],
  // 移动端页码按钮的数量端默认值5
  pagerCount: () => 7,
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  autoScroll: false,
  hidden: false,
  float: 'right',
});

// 允许属性继承，避免警告
defineOptions({
  inheritAttrs: true
});

const emit = defineEmits(['update:page', 'update:limit', 'pagination']);
const currentPage = computed({
  get() {
    return props.page;
  },
  set(val) {
    emit('update:page', val);
  }
});
const pageSize = computed({
  get() {
    return props.limit;
  },
  set(val) {
    emit('update:limit', val);
  }
});
function handleSizeChange(val: number) {
  if (currentPage.value * val > props.total) {
    currentPage.value = 1;
  }
  emit('pagination', { page: currentPage.value, limit: val });
  if (props.autoScroll) {
    scrollTo(0, 800);
  }
}
function handleCurrentChange(val: number) {
  emit('pagination', { page: val, limit: pageSize.value });
  if (props.autoScroll) {
    scrollTo(0, 800);
  }
}
</script>

<style lang="scss" scoped>
.pagination-container {
  .el-pagination {
    float: v-bind('props.float');
  }
}
.pagination-container.hidden {
  display: none;
}
</style>
