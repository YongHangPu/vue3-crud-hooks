import type { CustomTableConfig, TablePageHook } from './table'
import type { FormDialogHook } from './form'
import type { MessageApi } from './common'
import type { Ref, ComputedRef } from 'vue'

/**
 * CRUD 页面 Hook 返回值接口
 */
export interface CrudPageHook<T = any> extends Omit<TablePageHook<T>, 'tableEventHandlers'>, FormDialogHook<T> {
  tableConfig: ComputedRef<CustomTableConfig | null>
  tableEventHandlers: {
    onSelectionChange: (selection: any[]) => void
    onPagination: (pagination: { page: number; limit: number }) => void
    onAction: (event: string, row: any, index: number) => void
  }
  importDialogVisible: Ref<boolean>
  handleBatchImport: () => void
}

/**
 * CRUD 页面配置接口
 * @description 仅保留分层配置写法，统一使用 apis / form / table / search / advanced 组织配置
 * @template T 表单数据类型
 */
export interface CrudPageConfig<T = any> {
  /** API 接口配置 */
  apis: {
    list: (params: any) => Promise<any>
    add: (data: T) => Promise<any>
    update: (data: T) => Promise<any>
    delete?: (id: any) => Promise<any>
    batchDelete?: (ids: any[]) => Promise<any>
    deleteAll?: () => Promise<any>
    get?: (id: any) => Promise<any>
    export?: (options: { url?: string; params: any; filename: string }) => Promise<any> | void
  }
  /** 表单配置 */
  form: {
    initialData: T
    rules?: any
    /** 提交前数据转换 */
    beforeSubmit?: (data: T) => any
    /** 获取数据后转换 */
    afterGet?: (data: any) => T
    /** 成功回调 */
    onSuccess?: () => void
    /** 提交成功回调 */
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
    /** 删除全部确认提示文字 */
    deleteAllConfirmMessage?: string
    /** 自定义事件处理器 */
    onCustomAction?: (event: string, row: any, index: number) => void
  }
  /** 搜索配置 */
  search?: {
    initialData: any
    /** 搜索前参数转换 */
    beforeSearch?: (params: any) => any
  }
  /** 高级配置 */
  advanced?: {
    /** 数组字段 */
    arrayFields?: string[]
    /** 时间字段 */
    timeFields?: Array<{ field: string; prefix: string | { start: string; end: string } }>
    /** 回调函数 */
    callbacks?: {
      onDeleteSuccess?: (deletedRow: any) => void
      onBatchDeleteSuccess?: (deletedRows: any[], isDeleteAll: boolean) => void
    }
    /** 消息 API */
    messageApi?: Partial<MessageApi>
  }
}
