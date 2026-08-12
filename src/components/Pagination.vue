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
import { ElPagination } from 'element-plus';
import { scrollTo } from '@/utils/scroll-to';

interface Props {
  total?: number;
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

// defineModel(vue 3.4+ 宏):自动声明 currentPage/pageSize prop 及其 update:currentPage/update:pageSize 事件,
// 替代手写 computed get/set + emit 的样板代码
const currentPage = defineModel<number>('currentPage', { default: 1 });
const pageSize = defineModel<number>('pageSize', { default: 20 });
const emit = defineEmits(['pagination']);
function handleSizeChange(val: number) {
  // 先计算目标页码再 emit:pageSize 增大导致超出总页数时重置到第 1 页,
  // 避免 emit 的 currentPage 与 UI 显示不一致(否则父组件会按旧页码请求空页)
  const next = currentPage.value * val > props.total ? 1 : currentPage.value
  if (next !== currentPage.value) {
    currentPage.value = next
  }
  emit('pagination', { currentPage: next, pageSize: val });
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
  margin-top: 16px;

  .el-pagination {
    float: v-bind('props.align');
  }
}
.pagination-container.hidden {
  display: none;
}
</style>
