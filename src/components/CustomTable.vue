<template>
  <div class="custom-table-container" :class="containerClass" :style="containerStyle" ref="tableContainerRef">
    <el-table
      :ref="setTableRef"
      v-bind="tableBindAttrs"
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
                <!-- 按钮容器:flex + gap 控制间距(替代相邻兄弟 margin-left,
                     避免 v-show 隐藏按钮仍占据 DOM 位置导致第一个可见按钮被错误加间距) -->
                <div class="action-buttons">
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
                </div>
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
      :ref="setPaginationRef"
      v-bind="paginationProps"
      @pagination="handlePagination"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, useAttrs } from 'vue'
import { ElTable, ElTableColumn, ElLink, ElButton } from 'element-plus'
import type { TableInstance } from 'element-plus'
// 注意:element-plus 的 TableInstance/TableProps 类型链内部引用 lodash-unified。
// vue-tsc 生成组件声明(TS2742)时需要通过本文件显式引用该包才能生成可移植的类型名,
// 这是 vue-tsc 处理第三方组件模板类型的已知要求。lodash-unified 已声明为 dependencies,
// 消费方安装时(或通过 element-plus 传递依赖)必然可解析,不会出现类型断链。
import type {} from 'lodash-unified'
import Pagination from './Pagination.vue'
// 复用共享类型,避免在组件内重复定义列/按钮配置
import type { CustomTableConfig, TableColumnConfig, TableButtonConfig, ActionEvent, AutoHeightOptions } from '../types/table'
import { useTableHeight } from '../hooks/useTableHeight'

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
  /** 透传给 el-table 的属性（border、stripe 等，优先级高于 config.props） */
  props?: Record<string, any>
  loading?: boolean
  /**
   * 表格自适应高度:默认开启,一行内置即可让表格填满视口剩余空间(表格内部滚动、分页器固定底部)。
   * - 不传/传 `true`:启用默认配置(minHeight 240 / extraGap 24)
   * - 传 `AutoHeightOptions` 对象:自定义 minHeight / extraGap / watchSources
   * - 传 `false`:关闭自适应,表格高度由内容或透传的 height 决定
   */
  autoHeight?: boolean | AutoHeightOptions
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({ columns: [] }),
  data: () => [],
  props: () => ({}),
  loading: false,
  autoHeight: true
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

// 表格引用:使用 element-plus 公开的 TableInstance 类型,避免 d.ts 引用内部路径
// 采用函数式 ref 绑定,避免 vue-tsc 在模板推断中内联完整的 el-table 实例类型(会大幅膨胀 d.ts)
const tableRef = ref<TableInstance>()
const setTableRef = (el: any) => {
  tableRef.value = el
}

// 内部分页器引用:供 useTableHeight 等需要读取分页器尺寸的场景使用
const paginationRef = ref()
const setPaginationRef = (el: any) => {
  paginationRef.value = el
}

// 容器引用:传给 useTableHeight 做「容器基准」计算——
// 当容器被外部布局约束(flex-grow / 固定高度)时,表格高度精确填满容器,不依赖视口
const tableContainerRef = ref<HTMLElement>()

// ── 内置自适应高度 ──
// 解析 autoHeight 配置:true 用默认值,对象则合并默认值。
// 默认 extraGap 40:为常见后台布局(内容区 padding + 分页器间距)预留缓冲,保证表格外部不出现滚动条;
// 需要更紧凑时可传对象自定义,如 { extraGap: 24 }
const DEFAULT_AUTO_HEIGHT = { minHeight: 240, extraGap: 40 } as const
const autoHeightOption = computed<AutoHeightOptions | null>(() => {
  if (props.autoHeight === true) {
    return { ...DEFAULT_AUTO_HEIGHT }
  }
  if (props.autoHeight && typeof props.autoHeight === 'object') {
    return { ...DEFAULT_AUTO_HEIGHT, ...props.autoHeight }
  }
  return null
})
// 内部调用 useTableHeight:tableRef/paginationRef 均为组件内部引用,无需外部接线;
// enabled 跟随 autoHeight 配置,未开启时零开销(不注册监听)
const { tableMaxHeight } = useTableHeight(tableRef, paginationRef, {
  enabled: autoHeightOption.value !== null,
  minHeight: autoHeightOption.value?.minHeight ?? DEFAULT_AUTO_HEIGHT.minHeight,
  extraGap: autoHeightOption.value?.extraGap ?? DEFAULT_AUTO_HEIGHT.extraGap,
  watchSources: autoHeightOption.value?.watchSources,
  containerRef: tableContainerRef,
})
// autoHeight 启用时将计算出的高度注入 el-table,否则保持原有 height 透传
const tableBindAttrs = computed(() => {
  if (autoHeightOption.value) {
    return { ...forwardedAttrs.value, height: tableMaxHeight.value || undefined }
  }
  return forwardedAttrs.value
})

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
const processedColumns = computed<TableColumnConfig[]>(() => {
  return (props.config?.columns || []).map((column) => {
    const hasWidth = column.width || column.minWidth
    return {
      type: 'default',
      minWidth: hasWidth ? column.minWidth : 100,
      ...column
    } as TableColumnConfig
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
  (e: 'action', event: ActionEvent, row: any, index: number): void
  (e: 'pagination', val: { currentPage: number; pageSize: number }): void
}>()

/**
 * 获取列的插槽名，优先使用 slotName，其次是 prop
 */
const getColumnSlotName = (column: TableColumnConfig): string | undefined => {
  return column.slotName || column.prop
}

/**
 * 检查是否有自定义内容插槽
 * @param column 列配置
 * @returns 是否有自定义插槽
 */
const hasCustomSlot = (column: TableColumnConfig): boolean => {
  const slotName = getColumnSlotName(column)
  return !!(slotName && slots[slotName])
}

/**
 * 检查是否有自定义表头插槽
 * @param column 列配置
 * @returns 是否有自定义表头插槽
 */
const hasHeaderSlot = (column: TableColumnConfig): boolean => {
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
const handleAction = (event: ActionEvent, row: any, index: number) => {
  emit('action', event, row, index)
}

/**
 * 判断按钮是否可见
 * @param btn 按钮配置
 * @param row 行数据
 * @returns 是否可见
 */
const isButtonVisible = (btn: TableButtonConfig, row: any): boolean => {
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
const getButtonProps = (btn: TableButtonConfig, row: any): Record<string, any> => {
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
const getColumnBindProps = (column: TableColumnConfig) => {
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
// 暴露窄类型:tableRef 仍指向 el-table 实例、paginationRef 指向内部分页器组件实例(运行时),
// 但声明层收敛为 any,避免完整类型链(含 element-plus 内部路径与 lodash-unified)泄漏进 d.ts
defineExpose({
  tableRef: tableRef as any,
  paginationRef: paginationRef as any,
})
</script>

<style scoped>
.custom-table-container {
  position: relative;
}

.custom-table-container :deep(.pagination-container) {
  margin-top: 20px;
}

/* 防止 el-table 被外层 flex 布局压缩:autoHeight 注入的固定 height 必须生效,
   高度由 useTableHeight 计算控制,内容在表格内部滚动、分页器固定底部 */
.custom-table-container :deep(.el-table) {
  flex-shrink: 0;
}

/* 操作列按钮间距:flex gap 控制(替代相邻兄弟 margin-left)。
   注意:若用 margin-left + v-show(display:none)隐藏按钮,隐藏按钮仍占据 DOM 位置,
   会导致第一个可见按钮被误加间距;flex gap 下隐藏元素不占位、不产生 gap */
.custom-table-container :deep(.el-table__cell .action-buttons) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
