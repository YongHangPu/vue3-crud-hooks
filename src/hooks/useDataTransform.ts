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
      // 仅对数组字段执行 join，非数组字段跳过
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
        // 已是数组，直接保留
        result[field] = value
      } else if (typeof value === 'string' && value) {
        // 字符串按分隔符拆分
        result[field] = value.split(separator)
      } else {
        // 空值或无值字段初始化为空数组
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

    // 仅处理形如 [start, end] 的数组
    if (Array.isArray(timeValue) && timeValue.length === 2) {
      // 确定拆分后的字段名
      let startField = ''
      let endField = ''

      if (typeof fieldConfig === 'object') {
        // 对象配置：直接指定 start/end 字段名
        startField = fieldConfig.start
        endField = fieldConfig.end
      } else if (typeof fieldConfig === 'string') {
        // 字符串配置：拼接前缀，如 beginCreateTime / endCreateTime
        startField = `begin${fieldConfig}`
        endField = `end${fieldConfig}`
      } else {
        // 默认：以字段名加 begin/end 前缀
        startField = `begin${timeField}`
        endField = `end${timeField}`
      }

      processed[startField] = timeValue[0]
      processed[endField] = timeValue[1]
      // 删除原始时间范围字段，避免传给后端
      delete processed[timeField]
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
    // 不传 fields 则清理所有空值字段
    const targetFields = fields || Object.keys(result)

    targetFields.forEach((field) => {
      // 删除值为 '' / null / undefined 的字段
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
