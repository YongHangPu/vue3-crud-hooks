import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('scroll-to.ts', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('滚动结束后更新滚动位置并执行回调', async () => {
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: undefined
    })

    const { scrollTo } = await import('@/utils/scroll-to')
    const callback = vi.fn()

    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    scrollTo(100, 40, callback)
    vi.runAllTimers()

    expect(document.documentElement.scrollTop).toBe(100)
    expect(document.body.scrollTop).toBe(100)
    expect(callback).toHaveBeenCalled()
  })

  it('未传 duration 时使用默认时长并完成滚动', async () => {
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: undefined
    })

    const { scrollTo } = await import('@/utils/scroll-to')
    const callback = vi.fn()

    document.documentElement.scrollTop = 20
    document.body.scrollTop = 20

    scrollTo(60, undefined as unknown as number, callback)
    vi.runAllTimers()

    expect(document.documentElement.scrollTop).toBe(60)
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
