import type { MessageApi } from './common'

import type { Ref, ComputedRef } from 'vue'

export interface TableColumnConfig {
  /** 字段名 */
  prop?: string
  /** 标题 */
  label?: string
  /** 宽度 */
  width?: string | number
  /** 最小宽度 */
  minWidth?: string | number
  /** 固定列 */
  fixed?: boolean | 'left' | 'right'
  /** 列类型 */
  type?: 'default' | 'selection' | 'index' | 'expand' | 'action'
  /** 插槽名称 */
  slotName?: string
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 表头对齐方式 */
  headerAlign?: 'left' | 'center' | 'right'
  /** 是否显示溢出提示 */
  showOverflowTooltip?: boolean
  /** 格式化函数 */
  formatter?: (row: any, column: any, cellValue: any, index: number) => any
  /** 操作按钮配置（仅当 type 为 action 时有效） */
  buttons?: Array<TableButtonConfig>
  /** 是否隐藏 */
  hidden?: boolean
  [key: string]: any
}

export interface CustomTableConfig {
  selection?: boolean | Record<string, any>
  index?: boolean | Record<string, any>
  columns: Array<TableColumnConfig>
  pagination?: boolean | PaginationConfig
  onCustomAction?: (event: string, row: any, index: number) => void
  [key: string]: any
}

export interface TablePageHook<T = any> {
  tableData: Ref<T[]>
  loading: Ref<boolean>
  deleteLoading: Ref<boolean>
  pageInfo: {
    pageNum: number
    pageSize: number
    total: number
  }
  searchParams: Record<string, any>
  selectedRows: Ref<T[]>
  selectedIds: ComputedRef<any[]>
  getTableData: () => Promise<void>
  handleSearch: () => void
  handleReset: () => void
  handlePageChange: (page: number) => void
  handleSizeChange: (size: number) => void
  handleSelectionChange: (selection: T[]) => void
  handleDelete: (row: T) => Promise<void>
  handleBatchDelete: () => Promise<void>
  handleExport: (exportUrl: string, filename: string, params?: any) => void
  tableConfig: ComputedRef<CustomTableConfig | null>
  tableEventHandlers: {
    onSelectionChange: (selection: any[]) => void
    onPagination: (pagination: { page: number; limit: number }) => void
    onAction: (event: string, row: any, index: number) => void
  }
  setTableColumns: (columns: TableColumnConfig[]) => void
}

/**
 * 表格操作按钮配置
 */
export interface TableButtonConfig {
  /** 按钮文本 */
  btnText?: string
  /** 触发的事件名 */
  event: string
  /** 按钮展现类型 */
  btnType?: 'link' | 'button'
  /** 按钮样式类型 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text' | 'default'
  /** 是否禁用 */
  disabled?: boolean | ((row: any) => boolean)
  /** 是否可见 */
  visible?: (row: any) => boolean
  /** 其他 props 透传给按钮组件 */
  props?: Record<string, any>
  [key: string]: any
}

/**
 * 分页配置接口
 */
export interface PaginationConfig {
  total?: number
  pageSize?: number
  currentPage?: number
  pageSizes?: number[]
  layout?: string
  [key: string]: any
}

/**
 * 表格页面配置接口
 * @interface TablePageConfig
 */
export interface TablePageConfig {
  /** 响应数据中的数据字段名，默认为 'rows' */
  dataKey?: string
  /** 响应数据中的总数字段名，默认为 'total' */
  totalKey?: string
  /** 是否自动检测数据结构，默认为 false */
  autoDetect?: boolean
  /** 是否自动调用获取表格数据接口，默认为 true */
  autoFetch?: boolean
  /** 参数预处理函数 */
  preprocessParams?: (params: Record<string, any>) => Record<string, any> | null | false
  /** CustomTable组件配置 */
  customTableConfig?: CustomTableConfig
  /** 需要进行数组/字符串转换的字段名数组 */
  arrayFields?: string[]
  /** 时间范围字段配置 */
  timeFields?: Array<{ field: string; prefix: string | { start: string; end: string } }>
  /** 自定义消息提示配置 */
  messageApi?: Partial<MessageApi>
}

/**
 * 删除操作配置接口
 */
export interface DeleteConfig {
  /** 删除单条接口 */
  deleteApi?: (id: string | number) => Promise<any>
  /** 批量删除接口 */
  batchDeleteApi?: (ids: (string | number)[]) => Promise<any>
  /** 删除全部接口 */
  deleteAllApi?: () => Promise<any>
  /** 数据项ID字段名，默认为 'id' */
  idKey?: string
  /** 删除确认消息 */
  confirmMessage?: string
  /** 批量删除确认消息 */
  batchConfirmMessage?: string
  /** 删除全部数据确认消息 */
  deleteAllConfirmMessage?: string
  /** 删除成功后的回调 */
  onDeleteSuccess?: (deletedRow: any) => void
  /** 批量删除成功后的回调 */
  onBatchDeleteSuccess?: (deletedRows: any[], isDeleteAll: boolean) => void
}

/**
 * 导出配置接口
 */
export interface ExportConfig {
  /** 数组字段配置 */
  arrayFields?: string[]
  /** 时间字段配置 */
  timeFields?: Array<{ field: string; prefix: string | { start: string; end: string } }>
  /** 数据项ID字段名 */
  idKey?: string
  /** 自定义导出函数 */
  exportFunction?: (url: string, params: any, filename: string) => void
}
