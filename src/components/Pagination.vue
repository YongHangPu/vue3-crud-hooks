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
  currentPage?: number;
  pageSize?: number;
  pageSizes?: number[];
  pagerCount?: number;
  layout?: string;
  background?: boolean;
  autoScroll?: boolean;
  hidden?: boolean;
  /** 分页组件对齐方式，默认为 'right' */
  align?: string;
}

const props = withDefaults(defineProps<Props>(), {
  total: 0,
  currentPage: 1,
  pageSize: 20,
  pageSizes: () => [10, 20, 30, 50],
  // 移动端页码按钮的数量端默认值5
  pagerCount: () => 7,
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  autoScroll: false,
  hidden: false,
  align: 'right',
});

// 允许属性继承，避免警告
defineOptions({
  inheritAttrs: true
});

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'pagination']);
const currentPage = computed({
  get() {
    return props.currentPage;
  },
  set(val) {
    emit('update:currentPage', val);
  }
});
const pageSize = computed({
  get() {
    return props.pageSize;
  },
  set(val) {
    emit('update:pageSize', val);
  }
});
function handleSizeChange(val: number) {
  if (currentPage.value * val > props.total) {
    currentPage.value = 1;
  }
  emit('pagination', { currentPage: currentPage.value, pageSize: val });
  if (props.autoScroll) {
    scrollTo(0, 800);
  }
}
function handleCurrentChange(val: number) {
  emit('pagination', { currentPage: val, pageSize: pageSize.value });
  if (props.autoScroll) {
    scrollTo(0, 800);
  }
}
</script>

<style lang="scss" scoped>
.pagination-container {
  display: flow-root;
  width: 100%;

  .el-pagination {
    float: v-bind('props.align');
  }
}
.pagination-container.hidden {
  display: none;
}
</style>
