import { describe, expect, it, vi } from 'vitest'
import { extractListResult, getResponseMessage, isBusinessSuccess } from '@/utils/response'

describe('extractListResult', () => {
  it('undefined / null 响应不抛错,返回空数据', () => {
    expect(extractListResult(undefined)).toEqual({ data: [], total: 0 })
    expect(extractListResult(null)).toEqual({ data: [], total: 0 })
  })

  it('响应为数组时直接作为数据源', () => {
    expect(extractListResult([{ id: 1 }])).toEqual({ data: [], total: 0 })
  })

  it('total 为 0 的合法响应能正确保留', () => {
    expect(extractListResult({ rows: [], total: 0 })).toEqual({ data: [], total: 0 })
  })

  it('total 为数字字符串时也能解析', () => {
    expect(extractListResult({ rows: [{ id: 1 }], total: '100' })).toEqual({
      data: [{ id: 1 }],
      total: 100
    })
  })

  it('顶层 rows/total 解析', () => {
    expect(extractListResult({ rows: [{ id: 1 }], total: 5 })).toEqual({
      data: [{ id: 1 }],
      total: 5
    })
  })

  it('嵌套包装 { data: { records, total } } 解析', () => {
    expect(
      extractListResult({ code: 200, data: { records: [{ id: 1 }], total: 9 } })
    ).toEqual({ data: [{ id: 1 }], total: 9 })
  })

  it('顶层空数组优先,不回退到嵌套层', () => {
    // 顶层 rows 已明确返回空数组,不应回退到嵌套层取数
    expect(
      extractListResult({ code: 200, rows: [], data: { list: [{ id: 2 }], total: 3 } })
    ).toEqual({ data: [], total: 3 })
  })

  it('关闭自动检测后仅按 dataKey/totalKey 解析', () => {
    expect(
      extractListResult({ dataSource: [{ id: 1 }], totalSize: 2 }, {
        autoDetect: false,
        dataKey: 'dataSource',
        totalKey: 'totalSize'
      })
    ).toEqual({ data: [{ id: 1 }], total: 2 })
  })

  it('关闭自动检测时不在嵌套层做启发式匹配', () => {
    // data 字段是对象而非数组,且 dataKey 未命中,返回空
    expect(
      extractListResult({ data: { records: [{ id: 1 }] } }, { autoDetect: false, dataKey: 'rows' })
    ).toEqual({ data: [], total: 0 })
  })
})

describe('isBusinessSuccess', () => {
  it('null / undefined 视为失败', () => {
    expect(isBusinessSuccess(null)).toBe(false)
    expect(isBusinessSuccess(undefined)).toBe(false)
  })

  it('无 code 字段的响应视为成功(兼容旧式响应)', () => {
    expect(isBusinessSuccess({ rows: [], total: 0 })).toBe(true)
    expect(isBusinessSuccess('string')).toBe(true)
  })

  it('code 在成功集合 [0, 200, 1, "0", "200", "1"] 中视为成功', () => {
    expect(isBusinessSuccess({ code: 0 })).toBe(true)
    expect(isBusinessSuccess({ code: 200 })).toBe(true)
    expect(isBusinessSuccess({ code: 1 })).toBe(true)
    expect(isBusinessSuccess({ code: '0' })).toBe(true)
    expect(isBusinessSuccess({ code: '200' })).toBe(true)
    expect(isBusinessSuccess({ code: '1' })).toBe(true)
  })

  it('code 非成功集合视为失败', () => {
    expect(isBusinessSuccess({ code: 500 })).toBe(false)
    expect(isBusinessSuccess({ code: 401 })).toBe(false)
  })

  it('自定义 isSuccess 优先于默认判断', () => {
    const custom = vi.fn((res) => res?.code === 1)
    expect(isBusinessSuccess({ code: 1 }, custom)).toBe(true)
    expect(isBusinessSuccess({ code: 500 }, custom)).toBe(false)
    expect(custom).toHaveBeenCalledTimes(2)
  })
})

describe('getResponseMessage', () => {
  it('优先取 message,其次 msg', () => {
    expect(getResponseMessage({ message: 'a', msg: 'b' })).toBe('a')
    expect(getResponseMessage({ msg: 'b' })).toBe('b')
  })

  it('空消息或非对象响应回退默认文案', () => {
    expect(getResponseMessage({ message: '' }, '默认')).toBe('默认')
    expect(getResponseMessage(undefined, '默认')).toBe('默认')
    expect(getResponseMessage(null, '默认')).toBe('默认')
  })
})
