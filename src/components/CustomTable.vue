<template>
  <div class="custom-table-container" :class="containerClass" :style="containerStyle">
    <el-table
      ref="tableRef"
      v-bind="forwardedAttrs"
      :data="tableData"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @filter-change="handleFilterChange"
      style="width: 100%;"
    >
      <!-- 选择列 -->
      <el-table-column v-if="config?.selection" type="selection" v-bind="typeof config.selection === 'object' ? config.selection : {}" />

      <!-- 索引列 -->
      <el-table-column v-if="config?.index" type="index" label="序号" v-bind="typeof config.index === 'object' ? config.index : {}" />

      <!-- 数据列 -->
      <template v-for="(column, index) in processedColumns" :key="index">
        <template v-if="!column.hidden">
          <!-- 1. 具有自定义插槽的列 -->
          <el-table-column
            v-if="hasCustomSlot(column)"
            v-bind="getColumnBindProps(column)"
          >
            <!-- 自定义表头 -->
            <template #header="scope" v-if="hasHeaderSlot(column)">
              <slot :name="(getColumnSlotName(column) || `column-${index}`) + '-header'" :column="scope.column" :$index="scope.$index" />
            </template>
            <!-- 自定义内容 -->
            <template #default="scope">
              <template v-if="scope && scope.row != null">
                <slot :name="getColumnSlotName(column) || `column-${index}`" :row="scope.row" :index="scope.$index" :column="column" />
              </template>
            </template>
          </el-table-column>

          <!-- 2. 操作列 -->
          <el-table-column
            v-else-if="column.type === 'action'"
            v-bind="getColumnBindProps(column)"
          >
            <!-- 自定义表头 -->
            <template #header="scope" v-if="hasHeaderSlot(column)">
              <slot :name="(getColumnSlotName(column) || 'column') + '-header'" :column="scope.column" :$index="scope.$index" />
            </template>
            <!-- 操作按钮 -->
            <template #default="scope">
              <slot name="action" :row="scope.row" :index="scope.$index">
                <template v-for="(btn, btnIndex) in column.buttons" :key="btnIndex">
                  <el-link
                    v-if="btn.btnType !== 'button'"
                    v-bind="getButtonProps(btn, scope.row)"
                    @click="handleAction(btn.event, scope.row, scope.$index)"
                    v-show="isButtonVisible(btn, scope.row)"
                  >
                    {{ btn.btnText }}
                  </el-link>
                  <el-button
                    v-else
                    v-bind="getButtonProps(btn, scope.row)"
                    @click="handleAction(btn.event, scope.row, scope.$index)"
                    v-show="isButtonVisible(btn, scope.row)"
                  >
                    {{ btn.btnText }}
                  </el-button>
                </template>
              </slot>
            </template>
          </el-table-column>

          <!-- 3. 普通列 (使用默认渲染) -->
          <el-table-column
            v-else
            v-bind="getColumnBindProps(column)"
          >
            <!-- 自定义表头 -->
            <template #header="scope" v-if="hasHeaderSlot(column)">
              <slot :name="(getColumnSlotName(column) || 'column') + '-header'" :column="scope.column" :$index="scope.$index" />
            </template>
          </el-table-column>
        </template>
      </template>

      <!-- 表尾 -->
      <template #append v-if="$slots.append">
        <slot name="append"></slot>
      </template>
    </el-table>

    <!-- 使用封装好的分页组件 - 只有在配置了分页且不为false时才显示 -->
    <pagination
      v-if="shouldShowPagination"
      v-bind="paginationProps"
      @pagination="handlePagination"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, useAttrs } from 'vue'
import { ElTable, ElTableColumn, ElLink, ElButton } from 'element-plus'
import type { TableProps } from 'element-plus'
import type { TableColumnCtx } from 'element-plus/es/components/table/src/table-column/defaults'
// 空类型导入解决 Element Plus 导致的 TS2742 类型推断错误
import type { } from 'lodash-unified'
import Pagination from './Pagination.vue'
import type { CustomTableConfig, TableButtonConfig } from '../types/table'
/**
 * 操作按钮配置（继承共享类型，强化 btnText 为必填）
 */
interface ActionButton extends TableButtonConfig {
  btnText: string
}

/**
 * 列配置（继承 Element Plus 原生列属性，获得 sortable/filters 等类型校验；
 * slotName/buttons/hidden 为库扩展字段）
 */
interface ColumnConfig extends Partial<TableColumnCtx<any>> {
  /** 插槽名称，优先级高于 prop */
  slotName?: string
  /** 操作按钮配置（仅当 type 为 action 时有效） */
  buttons?: ActionButton[]
  /** 是否隐藏该列 */
  hidden?: boolean
  [key: string]: any
}

/**
 * 组件属性接口
 * @interface Props
 * @property config 表格配置（复用 types/table 中的 CustomTableConfig）
 * @property data 表格数据
 * @property props 表格属性
 * @property loading 加载状态
 */
interface Props {
  config: CustomTableConfig | null
  data: any[]
  props?: Partial<TableProps<any>>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({ columns: [] }),
  data: () => [],
  props: () => ({}),
  loading: false
})

// 关闭属性继承，手动转发 el-table 原生属性
defineOptions({
  inheritAttrs: false
})

// 插槽
const slots = useSlots()

// 透传属性：提取 class/style 到容器层，其余转发给 el-table
const attrs = useAttrs()
const containerClass = computed(() => (attrs as Record<string, any>).class)
const containerStyle = computed(() => (attrs as Record<string, any>).style)
// 组件已声明的事件不转发到 el-table（避免重复触发）
const EMIT_KEYS = new Set([
  'onSelectionChange', 'onSortChange', 'onFilterChange',
  'onPagination', 'onAction', 'onSizeChange', 'onCurrentChange'
])
// 合并 tableProps + 透传属性，仅用一个 v-bind 避免 Vue 模板编译冲突
const forwardedAttrs = computed(() => {
  const merged: Record<string, any> = { ...tableProps.value }
  for (const key of Object.keys(attrs)) {
    if (key !== 'class' && key !== 'style' && !EMIT_KEYS.has(key)) {
      merged[key] = attrs[key]
    }
  }
  return merged
})

// 表格引用
const tableRef = ref<any>(null)

// 表格属性
const tableProps = computed(() => ({
  ...(props.config?.props || {}), // 从配置中读取 props
  ...props.props, // 外部传入的 props 优先级更高
  border: props.props?.border !== undefined ? props.props.border : (props.config?.props?.border !== undefined ? props.config.props.border : true),
  stripe: props.props?.stripe !== undefined ? props.props.stripe : (props.config?.props?.stripe !== undefined ? props.config.props.stripe : false)
}))

// 表格数据
const tableData = computed(() => props.data)

/**
 * 处理后的列配置，为未指定type的列设置默认值
 * @returns 处理后的列配置数组
 */
const processedColumns = computed<ColumnConfig[]>(() => {
  return (props.config?.columns || []).map((column) => {
    const hasWidth = column.width || column.minWidth
    return {
      type: 'default',
      minWidth: hasWidth ? column.minWidth : 100,
      ...column
    } as ColumnConfig
  })
})

/**
 * 分页属性计算
 * @returns 分页组件属性
 */
const paginationProps = computed(() => {
  if (!props.config) {
    return { total: 0, currentPage: 1, pageSize: 10 }
  }

  const pagination = props.config.pagination
  if (typeof pagination === 'boolean' || !pagination) {
    return { total: 0, currentPage: 1, pageSize: 10 }
  }

  // PaginationConfig 与 Pagination.vue 字段名已统一，直接透传
  return pagination
})

/**
 * 判断是否应该显示分页组件
 * @description 只有在配置了分页、分页不为false、且有数据或总数大于0时才显示
 * @returns 是否显示分页
 */
const shouldShowPagination = computed(() => {
  // 如果没有配置分页或分页为false，不显示
  if (!props.config || props.config.pagination === false || !props.config.pagination) {
    return false
  }

  // 获取总数
  const total = typeof props.config.pagination === 'object'
    ? (props.config.pagination.total || 0)
    : 0

  // 有数据或总数大于0时显示分页
  return props.data.length > 0 || total > 0
})

// 定义事件
const emit = defineEmits<{
  (e: 'selection-change', val: any[]): void
  (e: 'sort-change', val: any): void
  (e: 'filter-change', val: any): void
  (e: 'size-change', val: number): void
  (e: 'current-change', val: number): void
  (e: 'action', event: string, row: any, index: number): void
  (e: 'pagination', val: { currentPage: number; pageSize: number }): void
}>()

/**
 * 获取列的插槽名，优先使用 slotName，其次是 prop
 */
const getColumnSlotName = (column: ColumnConfig): string | undefined => {
  return column.slotName || column.prop
}

/**
 * 检查是否有自定义内容插槽
 * @param column 列配置
 * @returns 是否有自定义插槽
 */
const hasCustomSlot = (column: ColumnConfig): boolean => {
  const slotName = getColumnSlotName(column)
  return !!(slotName && slots[slotName])
}

/**
 * 检查是否有自定义表头插槽
 * @param column 列配置
 * @returns 是否有自定义表头插槽
 */
const hasHeaderSlot = (column: ColumnConfig): boolean => {
  const slotName = getColumnSlotName(column)
  const headerSlotName = slotName ? `${slotName}-header` : undefined
  return !!(headerSlotName && slots[headerSlotName])
}

/**
 * 处理选择变化
 * @param val 选中的数据
 */
const handleSelectionChange = (val: any[]) => {
  emit('selection-change', val)
}

/**
 * 处理排序变化
 * @param val 排序信息
 */
const handleSortChange = (val: any) => {
  emit('sort-change', val)
}

/**
 * 处理筛选变化
 * @param val 筛选信息
 */
const handleFilterChange = (val: any) => {
  emit('filter-change', val)
}

/**
 * 处理分页变化
 * @param val 分页信息
 */
const handlePagination = (val: { currentPage: number; pageSize: number }) => {
  emit('pagination', val)
  emit('size-change', val.pageSize)
  emit('current-change', val.currentPage)
}

/**
 * 处理操作按钮点击
 * @param event 事件名
 * @param row 行数据
 * @param index 行索引
 */
const handleAction = (event: string, row: any, index: number) => {
  emit('action', event, row, index)
}

/**
 * 判断按钮是否可见
 * @param btn 按钮配置
 * @param row 行数据
 * @returns 是否可见
 */
const isButtonVisible = (btn: ActionButton, row: any): boolean => {
  if (typeof btn.visible === 'function') {
    return btn.visible(row)
  }
  return true
}

/**
 * 获取按钮属性，处理disabled函数和不同按钮类型的默认属性
 * @param btn 按钮配置
 * @param row 行数据
 * @returns 按钮属性
 */
const getButtonProps = (btn: ActionButton, row: any): Record<string, any> => {
  // 根据按钮类型设置默认属性
  const defaultProps: Record<string, any> =
    btn.btnType === 'button'
      ? { size: 'small' } // el-button 默认属性
      : { type: 'primary' } // el-link 默认属性

  // 处理disabled属性
  const disabled = typeof btn.disabled === 'function' ? btn.disabled(row) : btn.disabled

  // 提取按钮配置中的非特殊属性
  const { btnText, event, btnType, visible, props: btnProps, ...restProps } = btn

  // 合并属性：默认属性 < restProps < disabled处理 < btnProps配置（最高优先级）
  const mergedProps: Record<string, any> = {
    ...defaultProps,
    ...restProps,
    ...(disabled !== undefined && { disabled }), // 只在有 disabled 时才添加
    ...(btnProps || {})
  }

  return mergedProps
}

/**
 * 获取列绑定的属性，过滤掉自定义属性
 * @param column 列配置
 * @returns 绑定到 el-table-column 的属性
 */
const getColumnBindProps = (column: ColumnConfig) => {
  const { type, buttons, ...rest } = column
  const validTypes = ['selection', 'index', 'expand']

  // 如果是有效的 Element Plus 列类型，则保留 type
  if (type && validTypes.includes(type)) {
    return { type, ...rest }
  }

  // 否则移除 type (例如 'action', 'default')
  return rest
}

// 暴露方法给父组件
defineExpose({
  tableRef
})
</script>

<style scoped>
.custom-table-container {
  position: relative;
}

.custom-table-container :deep(.pagination-container) {
  margin-top: 20px;
}

/* 操作列按钮间距 */
/* 注意：使用平铺选择器而非 CSS 嵌套，确保在未配置 postcss-nesting 的构建中也能生效 */
.custom-table-container :deep(.el-table__cell .el-link + .el-link),
.custom-table-container :deep(.el-table__cell .el-button + .el-button),
.custom-table-container :deep(.el-table__cell .el-link + .el-button),
.custom-table-container :deep(.el-table__cell .el-button + .el-link) {
  margin-left: 8px;
}
</style>
