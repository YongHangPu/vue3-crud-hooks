import { describe, expect, it } from 'vitest'
import { deepCleanEmptyFields, useDataTransform } from '@/hooks/useDataTransform'

describe('useDataTransform', () => {
  const { arrayToString, stringToArray, processTimeRange, cleanEmptyFields, convertNumbers } = useDataTransform()

  it('将数组字段转换为字符串且不污染原对象', () => {
    const source = { tags: ['Vue', 'React'], status: 1 }
    const result = arrayToString(source, ['tags'])

    expect(result).toEqual({ tags: 'Vue,React', status: 1 })
    expect(source).toEqual({ tags: ['Vue', 'React'], status: 1 })
  })

  it('将字符串字段转换为数组', () => {
    const result = stringToArray({ tags: 'Vue,React', empty: '' }, ['tags', 'empty'])

    expect(result).toEqual({ tags: ['Vue', 'React'], empty: [] })
  })

  it('按自定义前后缀处理时间范围字段', () => {
    const result = processTimeRange(
      { createTime: ['2025-01-01', '2025-01-31'], keyword: 'demo' },
      'createTime',
      { start: 'startTime', end: 'endTime' }
    )

    expect(result).toEqual({
      keyword: 'demo',
      startTime: '2025-01-01',
      endTime: '2025-01-31'
    })
  })

  it('清理空值并转换数字字段', () => {
    const cleaned = cleanEmptyFields({
      keyword: '',
      status: '1',
      extra: null,
      keep: 'ok'
    })

    expect(convertNumbers(cleaned, ['status'])).toEqual({
      status: 1,
      keep: 'ok'
    })
  })

  it('深度清理嵌套空值', () => {
    expect(
      deepCleanEmptyFields({
        name: 'demo',
        tags: ['', 'Vue'],
        extra: {
          keyword: '',
          status: null
        }
      })
    ).toEqual({
      name: 'demo',
      tags: ['Vue']
    })
  })
})
