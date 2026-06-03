/**
 * 通用消息提示接口
 * @description 解耦 UI 库的消息提示
 */
export interface MessageApi {
  /** 成功提示 */
  success: (msg: string) => void
  /** 错误提示 */
  error: (msg: string) => void
  /** 警告提示 */
  warning: (msg: string) => void
  /** 确认弹窗，确认时 resolve，取消时 reject */
  confirm: (msg: string, title?: string, options?: any) => Promise<any>
}

/**
 * 列表数据通用响应结构
 * @template T 列表项类型
 */
export interface TableResult<T = any> {
  /** 列表数据 */
  data: T[]
  /** 数据总数 */
  total: number
  [key: string]: any
}

/**
 * 分页请求参数
 */
export interface PageParams {
  /** 当前页码 */
  pageNum: number
  /** 每页条数 */
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
