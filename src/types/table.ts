import type { MessageApi } from './common'

import type { Ref, ComputedRef } from 'vue'

/**
 * 内置表格操作事件
 */
export type BuiltInActionEvent = 'edit' | 'delete'

/**
 * 操作事件类型
 * @description 内置 edit/delete 获得类型提示,同时通过 `string & {}` 允许任意自定义事件名
 */
export type ActionEvent = BuiltInActionEvent | (string & {})

/**
 * 分页配置
 */
export interface PaginationConfig {
  /** 数据总数 */
  total?: number
  /** 当前页码 */
  currentPage?: number
  /** 每页条数 */
  pageSize?: number
  /** 翻页时自动滚动到顶部 */
  autoScroll?: boolean
  /** 每页条数切换选项 */
  pageSizes?: number[]
  /** 分页布局 */
  layout?: string
  /** 是否显示背景色 */
  background?: boolean
  /** 页码按钮数量 */
  pagerCount?: number
  /** 分页组件对齐方式，默认为 'right' */
  align?: string
  [key: string]: any
}

/**
 * 表格操作按钮配置
 */
export interface TableButtonConfig<T = any> {
  /** 按钮文本 */
  btnText?: string
  /** 触发的事件名(内置 edit/delete,可自定义) */
  event: ActionEvent
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

/**
 * 操作按钮配置(btnText 必填,用于 action 列渲染)
 */
export type ActionButton<T = any> = TableButtonConfig<T> & { btnText: string }

/**
 * 表格列配置
 * @template T 行数据类型
 */
export interface TableColumnConfig<T = any> {
  /** 字段名 */
  prop?: string
  /** 列标题 */
  label?: string
  /** 列宽度 */
  width?: string | number
  /** 最小宽度（未设 width 时默认 100） */
  minWidth?: string | number
  /** 固定列 */
  fixed?: boolean | 'left' | 'right'
  /** 列类型 */
  type?: 'default' | 'selection' | 'index' | 'expand' | 'action'
  /** 自定义插槽名称，优先级高于 prop */
  slotName?: string
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 表头对齐方式 */
  headerAlign?: 'left' | 'center' | 'right'
  /** 超出是否显示 tooltip */
  showOverflowTooltip?: boolean
  /** 自定义格式化函数 */
  formatter?: (row: T, column: any, cellValue: any, index: number) => any
  /** 操作按钮(仅 type='action' 时有效,btnText 必填) */
  buttons?: Array<ActionButton<T>>
  /** 是否隐藏该列 */
  hidden?: boolean
  /** 列是否可排序 */
  sortable?: boolean | 'custom'
  /** 列是否可调整宽度 */
  resizable?: boolean
  /** 列 className */
  className?: string
  /** 表头筛选选项 */
  filters?: Array<{ text: string; value: any }>
  /** 自定义筛选方法 */
  filterMethod?: (value: any, row: T) => boolean
  /** 该行是否可选（仅 selection 列） */
  selectable?: (row: T, index: number) => boolean
  /** 数据更新后保留选中（仅 selection 列） */
  reserveSelection?: boolean
  [key: string]: any
}

/**
 * CustomTable 组件配置
 */
export interface CustomTableConfig {
  /** 是否展示选择列，传对象可配置 el-table-column selection 属性 */
  selection?: boolean | Record<string, any>
  /** 是否展示序号列（开启后自动生成翻页连续序号） */
  index?: boolean | Record<string, any>
  /** 列配置数组 */
  columns: Array<TableColumnConfig>
  /** 分页配置（false 隐藏分页） */
  pagination?: boolean | PaginationConfig
  /** 自定义操作事件处理器(仅 useTablePage 独立使用时生效;useCrudPage 场景请配置 CrudPageConfig.table.onCustomAction) */
  onCustomAction?: (event: ActionEvent, row: any, index: number) => void
  /** 透传给 el-table 的属性（border, stripe, height 等） */
  props?: Record<string, any>
  [key: string]: any
}

/**
 * useTablePage Hook 返回值接口
 * @template T 行数据类型
 */
export interface TablePageHook<T = any> {
  /** 表格数据 */
  tableData: Ref<T[]>
  /** 数据加载状态 */
  loading: Ref<boolean>
  /** 删除操作加载状态 */
  deleteLoading: Ref<boolean>
  /** 分页信息 */
  pageInfo: {
    pageNum: number
    pageSize: number
    total: number
  }
  /** 搜索参数 */
  searchParams: Record<string, any>
  /** 选中的数据行 */
  selectedRows: Ref<T[]>
  /** 选中行 ID 列表（基于 idKey 提取） */
  selectedIds: ComputedRef<any[]>
  /** 获取表格数据 */
  getTableData: () => Promise<void>
  /** 搜索（重置页码后刷新） */
  handleSearch: () => void
  /** 重置搜索条件 */
  handleReset: () => void
  /** 页码改变 */
  handlePageChange: (page: number) => void
  /** 每页条数改变 */
  handleSizeChange: (size: number) => void
  /** 表格选择变化 */
  handleSelectionChange: (selection: T[]) => void
  /** 单行删除 */
  handleDelete: (row: T) => Promise<void>
  /** 批量删除选中行 */
  handleBatchDelete: () => Promise<void>
  /** 导出数据,支持异步 exportFunction */
  handleExport: (options?: { url?: string; filename?: string; params?: any }) => Promise<void>
  /** 可通过 v-bind="tableBindings" 绑定到 CustomTable */
  tableBindings: ComputedRef<Record<string, any>>
  /** 动态更新列配置 */
  setTableColumns: (columns: TableColumnConfig<T>[]) => void
}

/**
 * useTablePage 配置项
 */
export interface TablePageConfig {
  /** 响应数据中的数据字段名，默认为 'rows' */
  dataKey?: string
  /** 响应数据中的总数字段名，默认为 'total' */
  totalKey?: string
  /** 是否自动检测响应数据结构 */
  autoDetect?: boolean
  /** 是否自动获取数据，默认为 true */
  autoFetch?: boolean
  /** 搜索参数预处理函数:返回 false/null/undefined 时阻止请求;返回对象时将作为请求参数(整体替换 searchParams) */
  beforeSearch?: (params: Record<string, any>) => Record<string, any> | false | null | undefined
  /** 业务成功判断函数,默认自动识别 code 字段([0, 200, 1, '0', '200', '1'] 视为成功) */
  isSuccess?: (result: any) => boolean
  /** 自定义列表响应解析,返回 { data, total } 时接管默认解析,返回 null/undefined 时回退默认解析 */
  transformResponse?: (result: any) => { data: any[]; total: number } | null | undefined
  /** CustomTable 组件配置(内部转为响应式;动态更新列配置请使用 useTablePage 的 setTableColumns,直接修改原始配置对象不会触发视图更新) */
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

/**
 * 删除操作配置
 */
export interface DeleteConfig {
  /** 删除数据的API函数 */
  deleteApi?: (id: any) => Promise<any>
  /** 批量删除数据的API函数 */
  batchDeleteApi?: (ids: any[]) => Promise<any>
  /** 数据主键字段名，默认为 'id' */
  idKey?: string
  /** 删除确认提示文字 */
  confirmMessage?: string
  /** 批量删除确认提示文字 */
  batchConfirmMessage?: string
  /** 删除成功回调(配置后库不再自动刷新列表;若需保持页码与数据一致,请在回调内自行调用 getTableData 或刷新) */
  onDeleteSuccess?: (deletedRow: any) => void
  /** 批量删除成功回调(配置后库不再自动刷新列表;若需保持页码与数据一致,请在回调内自行调用 getTableData 或刷新) */
  onBatchDeleteSuccess?: (deletedRows: any[]) => void
  /** 业务成功判断函数,默认自动识别 code 字段 */
  isSuccess?: (result: any) => boolean
}

/**
 * 导出配置
 */
export interface ExportConfig {
  /** 导出函数,支持异步实现(如 POST + Blob 下载) */
  exportFunction?: (options: { url?: string; params: any; filename: string }) => Promise<any> | void
  /** 数组字段，导出时转换为字符串 */
  arrayFields?: string[]
  /** 时间字段，导出时处理 */
  timeFields?: Array<{ field: string; prefix: string | { start: string; end: string } }>
  /** 数据主键字段名 */
  idKey?: string
}
