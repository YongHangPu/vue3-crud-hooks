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
