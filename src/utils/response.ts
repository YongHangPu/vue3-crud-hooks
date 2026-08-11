/**
 * 响应适配工具
 * @description 统一处理后端响应:嵌套包装解析、业务成功判断、消息字段提取。
 * 解决真实项目中「Promise resolve 即成功」的误判问题:HTTP 200 但业务 code 非成功时
 * 不应显示「删除成功/操作成功」等成功提示。
 */

/** 常见业务成功码(兼容数字与字符串,覆盖 0/200/1 三种主流约定) */
const SUCCESS_CODES: Array<number | string> = [0, 200, 1, '0', '200', '1']

/**
 * 判断业务是否成功
 * @description 优先使用用户自定义 isSuccess;未配置时:
 * - 响应为 null/undefined → 视为失败
 * - 响应含 code 字段 → code 在 [0, 200, 1, '0', '200', '1'] 中视为成功
 * - 响应不含 code 字段 → 视为成功(兼容无包装的旧式响应)
 * @param result 后端响应
 * @param customIsSuccess 用户自定义成功判断函数
 * @returns 是否业务成功
 */
export const isBusinessSuccess = (
  result: any,
  customIsSuccess?: (result: any) => boolean
): boolean => {
  if (typeof customIsSuccess === 'function') {
    return customIsSuccess(result)
  }
  if (result === null || result === undefined) {
    return false
  }
  if (typeof result !== 'object') {
    return true
  }
  if (!('code' in result)) {
    return true
  }
  return SUCCESS_CODES.includes(result.code)
}

/** 列表数据提取配置 */
export interface ListExtractOptions {
  /** 数据字段名,默认 'rows' */
  dataKey?: string
  /** 总数字段名,默认 'total' */
  totalKey?: string
  /** 是否自动检测常见字段名,默认 true */
  autoDetect?: boolean
}

/**
 * 提取列表数据与总数
 * @description 同时扫描顶层与常见嵌套包装层(result.data 为对象时),
 * 支持 { code, data: { records, total } } 这类真实项目常见结构。
 * @param result 后端响应
 * @param options 提取配置
 * @returns 解析后的数据数组与总数
 */
export const extractListResult = (
  result: any,
  options: ListExtractOptions = {}
): { data: any[]; total: number } => {
  const { dataKey = 'rows', totalKey = 'total', autoDetect = true } = options
  const dataKeys = autoDetect ? ['rows', 'data', 'list', 'records', 'items'] : [dataKey]
  const totalKeys = autoDetect ? ['total', 'totalCount', 'count', 'totalElements'] : [totalKey]

  /**
   * 在单个对象中扫描数据与总数
   * @param source 待扫描对象
   * @returns 扫描结果(未找到的字段为 undefined)
   */
  const scan = (source: any): { data?: any[]; total?: number } => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return {}
    }
    const found: { data?: any[]; total?: number } = {}
    for (const key of dataKeys) {
      if (Array.isArray(source[key])) {
        found.data = source[key]
        break
      }
    }
    for (const key of totalKeys) {
      const value = source[key]
      // 兼容数字与数字字符串(如 "100")
      if (typeof value === 'number') {
        found.total = value
        break
      }
      if (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value))) {
        found.total = Number(value)
        break
      }
    }
    return found
  }

  const top = scan(result)
  const payload = result && typeof result === 'object' ? result.data : undefined
  const nested =
    payload && typeof payload === 'object' && !Array.isArray(payload) ? scan(payload) : {}

  const data = top.data !== undefined ? top.data : nested.data !== undefined ? nested.data : []
  const total = top.total !== undefined ? top.total : nested.total !== undefined ? nested.total : 0
  return { data, total }
}

/**
 * 提取响应消息文本
 * @description 兼容后端常见的 message 与 msg 字段
 * @param result 后端响应
 * @param fallback 未找到消息时的默认文案
 * @returns 消息文本
 */
export const getResponseMessage = (result: any, fallback = ''): string => {
  if (!result || typeof result !== 'object') {
    return fallback
  }
  const message = (result as Record<string, any>).message ?? (result as Record<string, any>).msg
  return typeof message === 'string' && message ? message : fallback
}
