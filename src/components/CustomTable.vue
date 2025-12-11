<template>
  <div class="custom-table-container">
    <el-table
      ref="tableRef"
      v-bind="tableProps"
      :data="tableData"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @filter-change="handleFilterChange"
      style="width: auto; min-width: 100%;"
    >
      <!-- 选择列 -->
      <el-table-column v-if="config.selection" type="selection" v-bind="typeof config.selection === 'object' ? config.selection : {}" />

      <!-- 索引列 -->
      <el-table-column v-if="config.index" type="index" v-bind="typeof config.index === 'object' ? config.index : {}" />

      <!-- 数据列 -->
      <template v-for="(column, index) in processedColumns" :key="index">
        <!-- 1. 具有自定义插槽的列 -->
        <el-table-column
          v-if="!column.hidden && hasCustomSlot(column)"
          v-bind="getColumnBindProps(column)"
        >
          <!-- 自定义表头 -->
          <template #header="scope" v-if="hasHeaderSlot(column)">
            <slot :name="`${column.prop}-header`" :column="scope.column" :$index="scope.$index" />
          </template>
          <!-- 自定义内容 -->
          <template #default="scope">
            <template v-if="scope && scope.row != null">
              <slot :name="column.prop || `column-${index}`" :row="scope.row" :index="scope.$index" :column="column" />
            </template>
          </template>
        </el-table-column>

        <!-- 2. 操作列 -->
        <el-table-column
          v-else-if="!column.hidden && column.type === 'action'"
          v-bind="getColumnBindProps(column)"
        >
          <!-- 自定义表头 -->
          <template #header="scope" v-if="hasHeaderSlot(column)">
            <slot :name="`${column.prop}-header`" :column="scope.column" :$index="scope.$index" />
          </template>
          <!-- 操作按钮 -->
          <template #default="scope">
            <slot name="action" :row="scope.row" :index="scope.$index">
              <template v-for="(btn, btnIndex) in column.buttons" :key="btnIndex">
                <!-- 根据按钮类型渲染不同的组件 -->
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
          v-else-if="!column.hidden"
          v-bind="getColumnBindProps(column)"
        >
          <!-- 自定义表头 -->
          <template #header="scope" v-if="hasHeaderSlot(column)">
            <slot :name="`${column.prop}-header`" :column="scope.column" :$index="scope.$index" />
          </template>
        </el-table-column>
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
import { ref, computed, useSlots } from 'vue'
import type { TableProps } from 'element-plus'
import type { TableColumnCtx } from 'element-plus/es/components/table/src/table-column/defaults'
import type { } from 'lodash-unified' // 解决 Element Plus 类型推断导致的构建错误 (TS2742)
/**
 * 操作按钮配置接口
 * @interface ActionButton
 * @property btnText 按钮文本
 * @property event 按钮事件名
 * @property btnType 按钮类型（'link' 或 'button'），默认为 'link'
 * @property type 按钮样式类型（'primary'、'danger'、'info'、'success' 等）
 * @property disabled 是否禁用（可以是布尔值或函数）
 * @property visible 是否可见（函数）
 * @property props 按钮额外属性
 */
interface ActionButton {
  btnText: string
  event: string
  btnType?: 'link' | 'button'
  type?: string
  disabled?: boolean | ((row: any) => boolean)
  visible?: (row: any) => boolean
  props?: Record<string, any>
  [key: string]: any
}

/**
 * 列配置接口
 * @interface ColumnConfig
 * @extends Partial<TableColumnCtx<any>>
 * @property prop 列属性名
 * @property label 列标题
 * @property type 列类型
 * @property hidden 是否隐藏
 * @property buttons 操作按钮配置（仅当type为action时有效）
 */
interface ColumnConfig extends Partial<TableColumnCtx<any>> {
  prop?: string
  label?: string
  type?: 'default' | 'selection' | 'index' | 'expand' | 'action'
  hidden?: boolean
  buttons?: ActionButton[]
  [key: string]: any
}

/**
 * 分页配置接口
 * @interface PaginationConfig
 * @property total 总条数
 * @property pageSize 每页条数
 * @property currentPage 当前页码
 */
interface PaginationConfig {
  total?: number
  pageSize?: number
  currentPage?: number
  [key: string]: any
}

/**
 * 表格配置接口
 * @interface TableConfig
 * @property selection 选择列配置
 * @property index 索引列配置
 * @property columns 列配置数组
 * @property pagination 分页配置
 */
interface TableConfig {
  selection?: boolean | object
  index?: boolean | object
  columns: ColumnConfig[]
  pagination?: PaginationConfig | boolean
  [key: string]: any
}

/**
 * 组件属性接口
 * @interface Props
 * @property config 表格配置
 * @property data 表格数据
 * @property props 表格属性
 * @property loading 加载状态
 */
interface Props {
  config: TableConfig
  data: any[]
  props?: Partial<TableProps<any>>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  props: () => ({}),
  loading: false
})

// 插槽
const slots = useSlots()

// 表格引用
const tableRef = ref<any>(null)

// 表格属性
const tableProps = computed(() => ({
  ...props.props,
  border: props.props?.border !== undefined ? props.props.border : true,
  stripe: props.props?.stripe !== undefined ? props.props.stripe : false
}))

// 表格数据
const tableData = computed(() => props.data)

/**
 * 处理后的列配置，为未指定type的列设置默认值
 * @returns 处理后的列配置数组
 */
const processedColumns = computed<ColumnConfig[]>(() => {
  return props.config.columns.map((column) => {
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
  if (typeof props.config.pagination === 'boolean') {
    return {
      total: 0,
      page: 1,
      limit: 10
    }
  }

  return {
    total: props.config.pagination?.total || 0,
    page: props.config.pagination?.currentPage || 1,
    limit: props.config.pagination?.pageSize || 10,
    ...props.config.pagination
  }
})

/**
 * 判断是否应该显示分页组件
 * @description 只有在配置了分页、分页不为false、且有数据或总数大于0时才显示
 * @returns 是否显示分页
 */
const shouldShowPagination = computed(() => {
  // 如果没有配置分页或分页为false，不显示
  if (props.config.pagination === false || !props.config.pagination) {
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
  (e: 'pagination', val: { page: number; limit: number }): void
}>()

/**
 * 检查是否有自定义内容插槽
 * @param column 列配置
 * @returns 是否有自定义插槽
 */
const hasCustomSlot = (column: ColumnConfig): boolean => {
  return !!(column.prop && slots[column.prop])
}

/**
 * 检查是否有自定义表头插槽
 * @param column 列配置
 * @returns 是否有自定义表头插槽
 */
const hasHeaderSlot = (column: ColumnConfig): boolean => {
  const headerSlotName = `${column.prop}-header`
  return !!(column.prop && slots[headerSlotName])
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
const handlePagination = (val: { page: number; limit: number }) => {
  emit('pagination', val)
  emit('size-change', val.limit)
  emit('current-change', val.page)
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
  min-width: 1000px;
}

.custom-table-container :deep(.pagination-container) {
  margin-top: 20px;
}

/* 操作列按钮样式优化 */
.custom-table-container :deep(.el-table__cell) {
  .el-link + .el-link {
    margin-left: 8px;
  }

  .el-button + .el-button {
    margin-left: 8px;
  }

  .el-link + .el-button,
  .el-button + .el-link {
    margin-left: 8px;
  }
}
</style>
