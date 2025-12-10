/**
 * 通用消息提示接口
 * @description 解耦 UI 库的消息提示
 */
export interface MessageApi {
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  confirm: (msg: string, title?: string, options?: any) => Promise<any>
}

/**
 * 列表数据结构接口
 */
export interface TableResult<T = any> {
  data: T[]
  total: number
  [key: string]: any
}

/**
 * 分页参数接口
 */
export interface PageParams {
  pageNum: number
  pageSize: number
  [key: string]: any
}

/**
 * 数据转换配置
 */
export interface DataTransformConfig<T = any> {
  /** 提交前转换 */
  beforeSubmit?: (data: T) => any
  /** 获取详情后转换 */
  afterGet?: (data: any) => T
}
