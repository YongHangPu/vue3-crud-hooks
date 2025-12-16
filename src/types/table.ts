import type { MessageApi } from './common'

import type { Ref, ComputedRef } from 'vue'

/**
 * 分页配置接口
 */
export interface PaginationConfig {
  total?: number
  pageSize?: number
  autoScroll?: boolean
  [key: string]: any
}

/**
 * 表格操作按钮配置
 */
export interface TableButtonConfig<T = any> {
  /** 按钮文本 */
  btnText?: string
  /** 触发的事件名 */
  event: string
  /** 按钮展现类型 */
  btnType?: 'link' | 'button'
  /** 按钮样式类型 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text' | 'default'
  /** 是否禁用 */
  disabled?: boolean | ((row: T) => boolean)
  /** 是否可见 */
  visible?: (row: T) => boolean
  /** 其他 props 透传给按钮组件 */
  props?: Record<string, any>
  [key: string]: any
}

export interface TableColumnConfig<T = any> {
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
  formatter?: (row: T, column: any, cellValue: any, index: number) => any
  /** 操作按钮配置（仅当 type 为 action 时有效） */
  buttons?: Array<TableButtonConfig<T>>
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
  /** 选中的数据行 */
  selection: Ref<T[]>
  /** 选中的数据行（同 selection） */
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
  handleExport: (options?: { url?: string; filename?: string; params?: any }) => void
  tableConfig: ComputedRef<CustomTableConfig | null>
  tableEventHandlers: {
    onSelectionChange: (selection: T[]) => void
    onPagination: (pagination: { page: number; limit: number }) => void
    onAction: (event: string, row: T, index: number) => void
  }
  setTableColumns: (columns: TableColumnConfig<T>[]) => void
}

export interface TablePageConfig {
  /** 响应数据中的数据字段名，默认为 'rows' */
  dataKey?: string
  /** 响应数据中的总数字段名，默认为 'total' */
  totalKey?: string
  /** 是否自动检测响应数据结构 */
  autoDetect?: boolean
  /** 是否自动获取数据，默认为 true */
  autoFetch?: boolean
  /** 搜索参数预处理函数 */
  beforeSearch?: (params: any) => any
  /** CustomTable 组件配置 */
  customTableConfig?: CustomTableConfig
  /** 数组字段，用于数据转换 */
  arrayFields?: string[]
  /** 时间字段，用于数据转换 */
  timeFields?: Array<{ field: string; prefix: string | { start: string; end: string } }>
  /** 自定义消息提示配置 */
  messageApi?: Partial<MessageApi>
  /** 导出URL */
  exportUrl?: string
}

export interface DeleteConfig {
  /** 删除数据的API函数 */
  deleteApi?: (id: any) => Promise<any>
  /** 批量删除数据的API函数 */
  batchDeleteApi?: (ids: any[]) => Promise<any>
  /** 删除所有数据的API函数 */
  deleteAllApi?: () => Promise<any>
  /** 数据主键字段名，默认为 'id' */
  idKey?: string
  /** 删除确认提示文字 */
  confirmMessage?: string
  /** 批量删除确认提示文字 */
  batchConfirmMessage?: string
  /** 删除所有数据确认提示文字 */
  deleteAllConfirmMessage?: string
  /** 删除成功回调 */
  onDeleteSuccess?: (deletedRow: any) => void
  /** 批量删除成功回调 */
  onBatchDeleteSuccess?: (deletedRows: any[], isDeleteAll: boolean) => void
}

export interface ExportConfig {
  /** 导出函数 */
  exportFunction?: (options: { url?: string; params: any; filename: string }) => void
  /** 数组字段，导出时转换为字符串 */
  arrayFields?: string[]
  /** 时间字段，导出时处理 */
  timeFields?: Array<{ field: string; prefix: string | { start: string; end: string } }>
  /** 数据主键字段名 */
  idKey?: string
}
