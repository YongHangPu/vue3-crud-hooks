import { ref, nextTick, onMounted, onUnmounted, watch, type Ref, type ComputedRef } from 'vue'

/**
 * 表格自适应高度 Hook
 * @description 动态计算表格最大高度,使其恰好填满视口剩余空间(表格内部滚动、分页器固定底部)。
 * 思路借鉴公众号「前端打铁铺」《useTableHeight:一个优雅的 Vue 3 表格自适应高度解决方案》
 * (作者已开源),在此之上补充 TypeScript 类型、原生 DOM ref 兼容、ResizeObserver 存在性守卫。
 */

/** 表格高度计算参数 */
export interface TableMaxHeightOptions {
  /** 浏览器视口高度 */
  viewportHeight: number
  /** 表格顶部距离视口顶部的偏移量 */
  tableTop: number
  /** 分页器高度 */
  paginationHeight: number
  /** 自定义额外间距补偿(px) */
  extraGap: number
  /** 容器底部内边距(px),默认 0 */
  containerPaddingBottom?: number
  /** 表格最小高度(px),极端场景兜底 */
  minHeight: number
}

/**
 * 纯高度计算函数
 * @description 可用高度 = 视口高度 - 表格顶部偏移 - 分页器高度 - 额外间距 - 容器底部内边距,
 * 与最小高度取最大值兜底极端布局
 */
export function calculateTableMaxHeight({
  viewportHeight,
  tableTop,
  paginationHeight,
  extraGap,
  containerPaddingBottom = 0,
  minHeight,
}: TableMaxHeightOptions): number {
  const availableHeight =
    viewportHeight - tableTop - paginationHeight - extraGap - containerPaddingBottom
  return Math.max(minHeight, Math.floor(availableHeight))
}

/** 可监听的响应式数据:ref / computed / getter 函数 */
type WatchSource = Ref | ComputedRef | (() => unknown)

/** useTableHeight 配置项 */
export interface UseTableHeightOptions {
  /** 表格最小高度(px),默认 240 */
  minHeight?: number
  /** 页面额外间距补偿(px),默认 24 */
  extraGap?: number
  /** 表格父容器 DOM 引用,用于读取 padding-bottom 样式 */
  containerRef?: Ref<HTMLElement | null | undefined>
  /** 需要监听的响应式数据列表(如搜索栏展开状态),变化时自动重算 */
  watchSources?: WatchSource[]
}

/**
 * 表格高度自适应 Composable
 * @param tableRef 表格组件/DOM 引用(兼容组件实例 $el 与原生元素)
 * @param paginationRef 分页器 DOM/组件引用
 * @param options 配置项
 * @returns 表格最大高度与更新方法
 */
export function useTableHeight(
  tableRef: Ref<unknown>,
  paginationRef: Ref<unknown>,
  options: UseTableHeightOptions = {}
) {
  const tableMaxHeight = ref(0)
  // 默认配置项
  const minHeight = options.minHeight ?? 240
  const extraGap = options.extraGap ?? 24
  const containerRef = options.containerRef
  const watchSources = Array.isArray(options.watchSources) ? options.watchSources : []
  let resizeObserver: ResizeObserver | null = null

  /** 取元素真实 DOM:兼容组件实例(通过 $el)与原生 DOM 元素 */
  const resolveEl = (refValue: unknown): unknown => {
    if (!refValue) return undefined
    return (refValue as { $el?: unknown }).$el ?? refValue
  }

  /**
   * 更新表格最大高度核心方法
   * @description 先 await nextTick 确保 Vue 完成本轮 DOM 更新,再读取元素位置/尺寸
   */
  const updateTableMaxHeight = async () => {
    await nextTick()
    const tableEl = resolveEl(tableRef.value) as Element
    const paginationEl = resolveEl(paginationRef.value) as Element
    if (!tableEl || !paginationEl) return

    // 获取元素布局信息
    const tableRect = tableEl.getBoundingClientRect()
    const paginationHeight = paginationEl.getBoundingClientRect().height || 0
    const containerEl = containerRef?.value
    const containerPaddingBottom = containerEl
      ? Number.parseFloat(window.getComputedStyle(containerEl).paddingBottom) || 0
      : 0

    // 执行高度计算
    tableMaxHeight.value = calculateTableMaxHeight({
      viewportHeight: window.innerHeight,
      tableTop: tableRect.top,
      paginationHeight,
      extraGap,
      containerPaddingBottom,
      minHeight,
    })
  }

  /**
   * 初始化元素尺寸监听
   * @description 立即计算一次,并通过 ResizeObserver 监听表格/分页器/容器尺寸变化;
   * 环境不支持 ResizeObserver(老浏览器/测试环境)时降级为仅 window resize 监听
   */
  const initTableHeightObserver = () => {
    updateTableMaxHeight()
    if (typeof ResizeObserver === 'undefined') return
    // 创建 ResizeObserver 监听表格、分页器、容器尺寸变化
    resizeObserver = new ResizeObserver(() => {
      updateTableMaxHeight()
    })
    const tableEl = resolveEl(tableRef.value) as Element
    if (tableEl) resizeObserver.observe(tableEl)
    const paginationEl = resolveEl(paginationRef.value) as Element
    if (paginationEl) resizeObserver.observe(paginationEl)
    if (containerRef?.value) resizeObserver.observe(containerRef.value as Element)
  }

  // 挂载生命周期
  onMounted(() => {
    initTableHeightObserver()
    window.addEventListener('resize', updateTableMaxHeight)
  })

  // 卸载生命周期，清理监听
  onUnmounted(() => {
    window.removeEventListener('resize', updateTableMaxHeight)
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  // 监听外部响应式状态变化（如搜索栏展开收起）
  watch(watchSources, async () => {
    await nextTick()
    updateTableMaxHeight()
  })

  return { tableMaxHeight, updateTableMaxHeight, initTableHeightObserver }
}
