import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable } from './helpers/mountComposable'
import { calculateTableMaxHeight, useTableHeight } from '@/hooks/useTableHeight'

describe('calculateTableMaxHeight', () => {
  it('基本计算:视口高度减去各占位', () => {
    expect(
      calculateTableMaxHeight({
        viewportHeight: 900,
        tableTop: 100,
        paginationHeight: 50,
        extraGap: 24,
        minHeight: 240
      })
    ).toBe(726)
  })

  it('containerPaddingBottom 参与计算(默认 0)', () => {
    expect(
      calculateTableMaxHeight({
        viewportHeight: 900,
        tableTop: 100,
        paginationHeight: 50,
        extraGap: 24,
        containerPaddingBottom: 16,
        minHeight: 240
      })
    ).toBe(710)
  })

  it('可用高度小于最小高度时兜底', () => {
    expect(
      calculateTableMaxHeight({
        viewportHeight: 200,
        tableTop: 100,
        paginationHeight: 50,
        extraGap: 24,
        minHeight: 240
      })
    ).toBe(240)
  })

  it('结果向下取整', () => {
    expect(
      calculateTableMaxHeight({
        viewportHeight: 901,
        tableTop: 100,
        paginationHeight: 50,
        extraGap: 24,
        minHeight: 240
      })
    ).toBe(727)
  })
})

describe('useTableHeight', () => {
  class ResizeObserverMock {
    static instances: ResizeObserverMock[] = []
    observed: Element[] = []
    observe(el: Element) {
      this.observed.push(el)
    }
    unobserve() {}
    disconnect() {
      this.observed = []
    }
    constructor(_cb: ResizeObserverCallback) {
      ResizeObserverMock.instances.push(this)
    }
  }

  const createRefs = () => {
    const tableEl = { getBoundingClientRect: () => ({ top: 100 }) }
    const paginationEl = { getBoundingClientRect: () => ({ height: 50 }) }
    const containerEl = document.createElement('div')
    return {
      tableRef: ref({ $el: tableEl }),
      paginationRef: ref(paginationEl),
      containerRef: ref(containerEl)
    }
  }

  beforeEach(() => {
    ResizeObserverMock.instances = []
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
    window.innerHeight = 900
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      paddingBottom: '16px'
    } as CSSStyleDeclaration)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('挂载后根据布局计算 tableMaxHeight', async () => {
    const { tableRef, paginationRef, containerRef } = createRefs()
    const hook = mountComposable(() =>
      useTableHeight(tableRef, paginationRef, { containerRef })
    )
    await flushPromises()

    // 900 - 100 - 50 - 24 - 16 = 710
    expect(hook.tableMaxHeight.value).toBe(710)
    // ResizeObserver 监听了表格与分页器(容器也监听)
    expect(ResizeObserverMock.instances[0].observed.length).toBe(3)
  })

  it('原生 DOM 元素引用也能工作($el 兼容)', async () => {
    const tableEl = { getBoundingClientRect: () => ({ top: 80 }) }
    const paginationEl = { getBoundingClientRect: () => ({ height: 40 }) }
    const hook = mountComposable(() => useTableHeight(ref(tableEl), ref(paginationEl)))
    await flushPromises()
    // 900 - 80 - 40 - 24 = 756(无 containerRef,padding 不参与)
    expect(hook.tableMaxHeight.value).toBe(756)
  })

  it('watchSources 变化时重新计算', async () => {
    const { tableRef, paginationRef } = createRefs()
    const show = ref(false)
    const hook = mountComposable(() =>
      useTableHeight(tableRef, paginationRef, { watchSources: [show] })
    )
    await flushPromises()
    const before = hook.tableMaxHeight.value

    // 模拟搜索栏展开:表格顶部偏移变大,可用高度变小
    ;(tableRef.value as { $el: { getBoundingClientRect: () => object } }).$el.getBoundingClientRect =
      () => ({ top: 200 })
    show.value = true
    await flushPromises()
    await flushPromises()

    expect(hook.tableMaxHeight.value).toBeLessThan(before)
  })

  it('多个 useTableHeight 实例互不影响(各自独立计算高度)', async () => {
    // 实例 A:表格顶部 100、分页器高 50
    const hookA = mountComposable(() =>
      useTableHeight(
        ref({ $el: { getBoundingClientRect: () => ({ top: 100 }) } }),
        ref({ getBoundingClientRect: () => ({ height: 50 }) })
      )
    )
    // 实例 B:表格顶部 300、分页器高 30
    const hookB = mountComposable(() =>
      useTableHeight(
        ref({ $el: { getBoundingClientRect: () => ({ top: 300 }) } }),
        ref({ getBoundingClientRect: () => ({ height: 30 }) })
      )
    )
    await flushPromises()

    // 各自按自身布局计算,互不干扰
    expect(hookA.tableMaxHeight.value).toBe(900 - 100 - 50 - 24)
    expect(hookB.tableMaxHeight.value).toBe(900 - 300 - 30 - 24)
  })

  it('容器被 flex 约束(flex-grow)时按容器基准计算高度,而非视口', async () => {
    const { tableRef, paginationRef } = createRefs()
    const containerEl = document.createElement('div')
    const parentEl = document.createElement('div')
    parentEl.appendChild(containerEl)
    // 模拟容器为 flex item(flex-grow:1、flex-basis:0%,父级 display:flex),高度由布局约束为 500
    const computedMock = vi.spyOn(window, 'getComputedStyle').mockImplementation(((el: any) => {
      if (el === containerEl) return { flexGrow: '1', flexBasis: '0%', height: 'auto', paddingBottom: '0px' } as CSSStyleDeclaration
      if (el === parentEl) return { display: 'flex' } as CSSStyleDeclaration
      return { paddingBottom: '16px' } as CSSStyleDeclaration
    }) as typeof window.getComputedStyle)
    containerEl.getBoundingClientRect = () => ({ height: 500, top: 0 }) as any

    const hook = mountComposable(() =>
      useTableHeight(tableRef, paginationRef, { containerRef: ref(containerEl) })
    )
    await flushPromises()

    // 容器基准:500(容器高) - 100(表格在容器内偏移) - 50(分页器) - 24(extraGap) - 0(容器 padding) = 326
    expect(hook.tableMaxHeight.value).toBe(500 - 100 - 50 - 24)
    computedMock.mockRestore()
  })

  it('容器无外部约束时回退视口基准', async () => {
    const { tableRef, paginationRef } = createRefs()
    const containerEl = document.createElement('div')
    // 容器非 flex item(父级 display:block),flex-grow 0、flex-basis auto → 走视口基准
    const computedMock = vi.spyOn(window, 'getComputedStyle').mockImplementation(((el: any) => {
      if (el === containerEl) return { flexGrow: '0', flexBasis: 'auto', height: 'auto', paddingBottom: '0px' } as CSSStyleDeclaration
      if (el === containerEl.parentElement) return { display: 'block' } as CSSStyleDeclaration
      return { paddingBottom: '16px' } as CSSStyleDeclaration
    }) as typeof window.getComputedStyle)

    const hook = mountComposable(() =>
      useTableHeight(tableRef, paginationRef, { containerRef: ref(containerEl) })
    )
    await flushPromises()

    // 视口基准:900 - 100 - 50 - 24 - 0(容器 paddingBottom mock 为 0)= 726
    expect(hook.tableMaxHeight.value).toBe(726)
    computedMock.mockRestore()
  })

  it('分页器延迟渲染(引用从 undefined 变为有值)时自动重算并补充监听', async () => {
    const { tableRef, paginationRef } = createRefs()
    // 模拟数据未加载、分页器尚未渲染
    paginationRef.value = undefined as any

    const hook = mountComposable(() => useTableHeight(tableRef, paginationRef))
    await flushPromises()
    // 分页器高度按 0 计算:900 - 100 - 0 - 24 = 776
    expect(hook.tableMaxHeight.value).toBe(776)

    // 数据加载后分页器出现
    paginationRef.value = { getBoundingClientRect: () => ({ height: 50 }) }
    await flushPromises()
    await flushPromises()
    // 重算:900 - 100 - 50 - 24 = 726
    expect(hook.tableMaxHeight.value).toBe(726)

    // 新出现的分页器已被 ResizeObserver 监听(observe 幂等,重复调用无副作用)
    expect(ResizeObserverMock.instances[0].observed).toContain(paginationRef.value)
  })

  it('卸载时移除 resize 监听并断开 observer', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { tableRef, paginationRef } = createRefs()
    const wrapper = mount(
      defineComponent({
        setup() {
          useTableHeight(tableRef, paginationRef)
          return () => null
        }
      })
    )
    await flushPromises()
    const observer = ResizeObserverMock.instances[0]

    wrapper.unmount()

    expect(removeSpy).toHaveBeenCalled()
    // disconnect 清空了 observed 列表
    expect(observer.observed.length).toBe(0)
  })
})
