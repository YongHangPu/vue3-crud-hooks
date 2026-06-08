import type { TablePageHook, CustomTableConfig } from './table'
import type { FormDialogHook } from './form'
import type { MessageApi } from './common'

/**
 * CRUD 页面 Hook 返回值接口
 */
export interface CrudPageHook<T = any> extends TablePageHook<T>, FormDialogHook<T> {}

/**
 * CRUD 页面配置接口
 * @description 仅保留分层配置写法，统一使用 apis / form / table / search / advanced 组织配置
 * @template T 表单数据类型
 */
export interface CrudPageConfig<T = any> {
  /** API 接口配置 */
  apis: {
    /** 列表查询接口 */
    list: (params: any) => Promise<any>
    /** 新增接口 */
    add: (data: T) => Promise<any>
    /** 编辑接口 */
    update: (data: T) => Promise<any>
    /** 删除接口（可选） */
    delete?: (id: any) => Promise<any>
    /** 批量删除接口（可选） */
    batchDelete?: (ids: any[]) => Promise<any>
    /** 获取详情接口（可选，编辑回显用） */
    get?: (id: any) => Promise<any>
    /** 导出接口（可选） */
    export?: (options: { url?: string; params: any; filename: string }) => Promise<any> | void
  }
  /** 表单配置 */
  form: {
    /** 表单初始数据 */
    initialData: T
    /** 表单校验规则（可选） */
    rules?: any
    /** 提交前数据转换 */
    beforeSubmit?: (data: T) => any
    /** 获取数据后转换 */
    afterGet?: (data: any) => T
    /** 提交成功后弹窗关闭时的回调，通常用于刷新列表 */
    onAfterSubmit?: () => void
    /** 提交成功回调，可访问 API 响应数据 */
    onSubmitSuccess?: (response: any, mode: 'add' | 'edit', formData: T) => Promise<void> | void
  }
  /** 表格配置 */
  table: {
    /** CustomTable 配置 */
    config?: CustomTableConfig
    /** 数据主键字段名，默认为 'id' */
    idKey?: string
    /** 响应数据中的数据字段名 */
    dataKey?: string
    /** 响应数据中的总数字段名 */
    totalKey?: string
    /** 是否自动获取数据，默认为 true */
    autoFetch?: boolean
    /** 是否自动检测响应数据结构，默认为 true */
    autoDetect?: boolean
    /** 导出 URL */
    exportUrl?: string
    /** 删除确认提示文字 */
    confirmMessage?: string
    /** 批量删除确认提示文字 */
    batchConfirmMessage?: string
    /** 自定义事件处理器 */
    onCustomAction?: (event: string, row: any, index: number) => void
  }
  /** 搜索配置 */
  search?: {
    /** 搜索表单初始值 */
    initialData: any
    /** 搜索前参数转换，返回 false 阻止请求 */
    beforeSearch?: (params: any) => any
  }
  /** 高级配置 */
  advanced?: {
    /** 数组字段 */
    arrayFields?: string[]
    /** 时间范围字段，自动拆分为 start/end 两个参数 */
    timeFields?: Array<{ field: string; prefix: string | { start: string; end: string } }>
    /** 删除成功回调 */
    onDeleteSuccess?: (deletedRow: any) => void
    /** 批量删除成功回调 */
    onBatchDeleteSuccess?: (deletedRows: any[]) => void
    /** 消息 API */
    messageApi?: Partial<MessageApi>
  }
}
