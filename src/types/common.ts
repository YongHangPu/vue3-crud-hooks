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
  confirm: (msg: string, title?: string, options?: Record<string, any>) => Promise<any>
}

/**
 * 后端统一响应包装
 * @description 覆盖常见的 { code, message/data } 与直接返回数据两种结构
 * @template T data 字段数据类型
 */
export interface ApiResponse<T = any> {
  /** 业务状态码(0 / 200 等视为成功,可通过 isSuccess 自定义) */
  code?: number | string
  /** 提示消息(message / msg 兼容) */
  message?: string
  /** 提示消息的另一种常见写法 */
  msg?: string
  /** 业务数据 */
  data?: T
  [key: string]: any
}

/**
 * 分页列表响应数据
 * @description 覆盖常见后端字段名 rows / list / records / items / data
 * @template T 列表项类型
 */
export interface ListResult<T = any> {
  /** 列表数据(常见字段名之一) */
  rows?: T[]
  /** 列表数据 */
  list?: T[]
  /** 列表数据 */
  records?: T[]
  /** 列表数据 */
  items?: T[]
  /** 列表数据 */
  data?: T[]
  /** 总条数(常见字段名之一) */
  total?: number
  /** 总条数 */
  totalCount?: number
  /** 总条数 */
  count?: number
  /** 总条数 */
  totalElements?: number
  [key: string]: any
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
