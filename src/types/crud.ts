import type { TablePageHook, CustomTableConfig, ActionEvent, SortInfo } from './table'
import type { FormDialogHook } from './form'
import type { ApiResponse, ListResult, MessageApi } from './common'

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
    list: (params: any) => Promise<ApiResponse<ListResult<T>>>
    /** 新增接口 */
    add: (data: T) => Promise<ApiResponse<any>>
    /** 编辑接口 */
    update: (data: T) => Promise<ApiResponse<any>>
    /** 删除接口（可选） */
    delete?: (id: any) => Promise<ApiResponse<any>>
    /** 批量删除接口（可选） */
    batchDelete?: (ids: any[]) => Promise<ApiResponse<any>>
    /** 获取详情接口（可选，编辑回显用） */
    get?: (id: any) => Promise<ApiResponse<T>>
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
    /** 自定义事件处理器(useCrudPage 场景推荐配置于此;组件级 CustomTableConfig.onCustomAction 仅 useTablePage 独立使用时生效) */
    onCustomAction?: (event: ActionEvent, row: any, index: number) => void
    /** 服务端排序:true 启用默认参数映射({ orderByColumn: prop, isAsc: 'asc' | 'desc' }),或传函数自定义映射(返回 null/undefined 时不并入请求) */
    sortable?: boolean | ((sort: SortInfo) => Record<string, any> | null | undefined)
    /** 服务端筛选:true 启用(筛选值数组原样展开进请求参数),或传函数自定义映射(返回 null/undefined 时不并入请求) */
    filterable?: boolean | ((filters: Record<string, any[]>) => Record<string, any> | null | undefined)
    /** 自定义列表响应解析,返回 { data, total } 时接管默认解析,返回 null/undefined 时回退默认解析 */
    transformResponse?: (result: any) => { data: any[]; total: number } | null | undefined
  }
  /** 搜索配置 */
  search?: {
    /** 搜索表单初始值 */
    initialData: Record<string, any>
    /** 搜索前参数转换,返回 false/null/undefined 阻止请求 */
    beforeSearch?: (params: Record<string, any>) => Record<string, any> | false | null | undefined
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
    /** 业务成功判断函数,默认自动识别 code 字段([0, 200, 1, '0', '200', '1'] 视为成功) */
    isSuccess?: (result: any) => boolean
    /** 导出成功回调(apis.export resolve 后触发;返回 Blob 或 { blob } 时已自动触发浏览器下载) */
    onExportSuccess?: (result: any) => void
    /** 导出失败回调(apis.export reject 时触发;不配置时默认提示错误消息) */
    onExportError?: (error: any) => void
  }
}
