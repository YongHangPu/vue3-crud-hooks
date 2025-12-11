/**
 * 数据转换工具 Hook
 * @returns 常用的数据转换方法
 */
export const useDataTransform = () => {
  /**
   * 数组字段转字符串（用于提交）
   * @param data 原始数据
   * @param fields 需要转换的字段数组
   * @param separator 分隔符，默认为 ','
   * @returns 转换后的数据
   */
  const arrayToString = (data: any, fields: string[], separator = ',') => {
    const result = { ...data }
    fields.forEach((field) => {
      if (Array.isArray(result[field])) {
        result[field] = result[field].join(separator)
      }
    })
    return result
  }

  /**
   * 字符串转数组（用于编辑回显）
   * @param data 原始数据
   * @param fields 需要转换的字段数组
   * @param separator 分隔符，默认为 ','
   * @returns 转换后的数据
   */
  const stringToArray = (data: any, fields: string[], separator = ',') => {
    const result = { ...data }
    fields.forEach((field) => {
      const value = result[field]
      if (Array.isArray(value)) {
        result[field] = value
      } else if (typeof value === 'string' && value) {
        result[field] = value.split(separator)
      } else {
        result[field] = []
      }
    })
    return result
  }

  /**
   * 处理时间范围参数
   * @param params 原始参数
   * @param timeField 时间字段名
   * @param fieldConfig 字段配置，可以是字符串或对象 { start: string; end: string }
   * @returns 处理后的参数
   */
  const processTimeRange = (
    params: any,
    timeField: string,
    fieldConfig?: string | { start: string; end: string }
  ) => {
    const processed = { ...params }
    const timeValue = processed[timeField]

    if (Array.isArray(timeValue) && timeValue.length === 2) {
      let startField = ''
      let endField = ''

      if (typeof fieldConfig === 'object') {
        startField = fieldConfig.start
        endField = fieldConfig.end
      } else if (typeof fieldConfig === 'string') {
        startField = `begin${fieldConfig}`
        endField = `end${fieldConfig}`
      } else {
        // 默认添加 Start/End 后缀
        startField = `begin${timeField}`
        endField = `end${timeField}`
      }

      processed[startField] = timeValue[0]
      processed[endField] = timeValue[1]
      delete processed[timeField] // 删除原始时间字段
    }

    return processed
  }

  /**
   * 清理空值字段
   * @param data 原始数据
   * @param fields 需要清理的字段数组，不传则清理所有字段
   * @returns 清理后的数据
   */
  const cleanEmptyFields = (data: any, fields?: string[]) => {
    const result = { ...data }
    const targetFields = fields || Object.keys(result)

    targetFields.forEach((field) => {
      if (result[field] === '' || result[field] === null || result[field] === undefined) {
        delete result[field]
      }
    })
    return result
  }

  /**
   * 数字字段转换
   * @param data 原始数据
   * @param fields 需要转换的字段数组
   * @returns 转换后的数据
   */
  const convertNumbers = (data: any, fields: string[]) => {
    const result = { ...data }
    fields.forEach((field) => {
      if (result[field] !== undefined && result[field] !== '') {
        result[field] = Number(result[field])
      }
    })
    return result
  }

  return {
    arrayToString,
    stringToArray,
    processTimeRange,
    cleanEmptyFields,
    convertNumbers
  }
}

/**
 * 深度清理空值（包括嵌套对象）
 * @param data 需要清理的数据
 * @returns 清理后的数据
 */
export const deepCleanEmptyFields = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(deepCleanEmptyFields).filter((item) => item !== null && item !== undefined)
  }

  if (data && typeof data === 'object') {
    const result: any = {}
    Object.keys(data).forEach((key) => {
      const value = deepCleanEmptyFields(data[key])
      if (value !== null && value !== undefined && value !== '') {
        result[key] = value
      }
    })
    return Object.keys(result).length > 0 ? result : null
  }

  return data === '' ? null : data
}
