import { ref, computed } from 'vue'
import { useTablePage } from './useTablePage'
import { useFormDialog } from './useFormDialog'
import { useDataTransform } from './useDataTransform'
import type { CrudPageConfig, CrudPageHook } from '../types'

/**
 * 通用 CRUD 页面 Hook
 * @description 集成表格展示、表单弹窗、数据转换等功能的综合性 Hook
 * @template T 表单数据类型
 * @param config CRUD 页面配置选项
 * @returns 返回CRUD页面所需的所有状态和方法
 */
export const useCrudPage = <T = any>(config: CrudPageConfig<T>): CrudPageHook<T> => {
  const { arrayToString, stringToArray } = useDataTransform()
  const { apis, form, table, search, advanced = {} } = config

  // ── 初始化表格 Hook ──
  // 将 CrudPageConfig 的分层配置分拆到 useTablePage 的四个参数中
  const tablePageHook = useTablePage(
    apis.list,
    search?.initialData || {},
    {
      // 表格配置
      dataKey: table.dataKey,
      totalKey: table.totalKey,
      autoDetect: table.autoDetect,
      autoFetch: table.autoFetch,
      beforeSearch: search?.beforeSearch,
      customTableConfig: table.config,
      // 高级选项
      arrayFields: advanced.arrayFields,
      timeFields: advanced.timeFields,
      messageApi: advanced.messageApi,
      exportUrl: table.exportUrl
    },
    {
      // 删除配置
      deleteApi: apis.delete,
      batchDeleteApi: apis.batchDelete,
      deleteAllApi: apis.deleteAll,
      idKey: table.idKey,
      confirmMessage: table.confirmMessage,
      batchConfirmMessage: table.batchConfirmMessage,
      deleteAllConfirmMessage: table.deleteAllConfirmMessage,
      onDeleteSuccess: advanced.onDeleteSuccess,
      onBatchDeleteSuccess: advanced.onBatchDeleteSuccess
    },
    {
      // 导出配置
      exportFunction: apis.export,
      arrayFields: advanced.arrayFields,
      timeFields: advanced.timeFields,
      idKey: table.idKey
    }
  )

  // ── 初始化弹窗 Hook ──
  // 将 apis.add/update/get 映射到 useFormDialog，并串联数据转换
  const formDialogHook = useFormDialog({
    initialFormData: form.initialData,
    idKey: table.idKey,
    addApi: apis.add,
    updateApi: apis.update,
    getApi: apis.get,
    formRules: form.rules,
    // 提交成功后刷新列表 + 执行用户自定义 onAfterSubmit
    onAfterSubmit: () => {
      tablePageHook.getTableData()
      form.onAfterSubmit?.()
    },
    onSubmitSuccess: form.onSubmitSuccess,
    messageApi: advanced.messageApi,
    // 链式数据转换：先处理 arrayFields，再执行用户的 beforeSubmit / afterGet
    dataTransform: {
      beforeSubmit: (data: T) => {
        let processed = data
        // 数组字段转逗号字符串（适配后端接收格式）
        if (advanced.arrayFields?.length) {
          processed = arrayToString(processed, advanced.arrayFields)
        }
        // 执行用户自定义 beforeSubmit
        if (form.beforeSubmit) {
          processed = form.beforeSubmit(processed)
        }
        return processed
      },
      afterGet: (data: any) => {
        let processed = data
        // 先执行用户自定义 afterGet
        if (form.afterGet) {
          processed = form.afterGet(processed)
        }
        // 逗号字符串转回数组（适配前端表单展示）
        if (advanced.arrayFields?.length) {
          processed = stringToArray(processed, advanced.arrayFields)
        }
        return processed
      }
    }
  })

  /**
   * 处理自定义事件
   * @param event 事件名
   * @param row 行数据
   * @param index 行索引
   */
  const handleCustomAction = (event: string, row: any, index: number) => {
    if (table.config?.onCustomAction) {
      table.config.onCustomAction(event, row, index)
      return
    }

    if (table.onCustomAction) {
      table.onCustomAction(event, row, index)
      return
    }

    // 如果没有找到处理器，输出警告信息
    console.warn(`未找到事件 "${event}" 的处理器`, { event, row, index })
  }

  /**
   * CustomTable 事件处理器集合
   * @description 扩展 useTablePage 的事件处理器，在删除/编辑/自定义事件间路由
   */
  const tableEventHandlers = {
    /** 转发选择事件到 useTablePage 处理器 */
    onSelectionChange: tablePageHook.tableBindings.value?.onSelectionChange ?? (() => {}),
    /** 转发分页事件到 useTablePage 处理器 */
    onPagination: tablePageHook.tableBindings.value?.onPagination ?? (() => {}),

    /**
     * 重写操作按钮点击处理
     * @param event 事件名
     * @param row 行数据
     * @param index 行索引
     */
    onAction: (event: string, row: any, index: number) => {
      // 编辑事件特殊处理
      if (event === 'edit') {
        formDialogHook.openDialog('edit', row)
        return
      }

      // 删除事件沿用 useTablePage 的默认处理
      if (event === 'delete') {
        tablePageHook.tableBindings.value?.onAction?.(event, row, index)
        return
      }

      // 处理自定义事件
      handleCustomAction(event, row, index)
    }
  }

  /**
   * 可直接通过 v-bind="tableBindings" 绑定到 <CustomTable> 的完整属性集
   * @description 覆盖 useTablePage 的 tableBindings，集成弹窗编辑事件
   */
  const tableBindings = computed(() => ({
    config: table.config ? tablePageHook.tableBindings.value?.config ?? null : null,
    data: tablePageHook.tableData.value,
    loading: tablePageHook.loading.value,
    ...tableEventHandlers
  }))

  /**
   * 导出处理
   * @description 导出表格数据
   * @param options 导出配置选项
   */
  const handleExport = (options?: { url?: string; filename?: string; params?: any }) => {
    // 直接使用 tablePageHook 的导出方法
    tablePageHook.handleExport(options)
  }

  /**
   * @property ...tablePageHook 所有表格相关状态和方法
   * @property ...formDialogHook 所有弹窗相关状态和方法
   * @property tableBindings CustomTable 一键绑定（集成了弹窗编辑功能）
   * @property handleExport 导出方法
   */
  return {
    ...tablePageHook,
    ...formDialogHook,
    tableBindings,
    handleExport
  }
}

