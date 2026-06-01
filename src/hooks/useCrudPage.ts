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

  // 初始化表格页面 Hook
  const tablePageHook = useTablePage(
    apis.list,
    search?.initialData || {},
    {
      dataKey: table.dataKey,
      totalKey: table.totalKey,
      autoDetect: table.autoDetect,
      autoFetch: table.autoFetch,
      beforeSearch: search?.beforeSearch,
      customTableConfig: table.config,
      arrayFields: advanced.arrayFields,
      timeFields: advanced.timeFields,
      messageApi: advanced.messageApi,
      exportUrl: table.exportUrl
    },
    {
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
      exportFunction: apis.export,
      arrayFields: advanced.arrayFields,
      timeFields: advanced.timeFields,
      idKey: table.idKey
    }
  )

  // 初始化表单弹窗 Hook
  const formDialogHook = useFormDialog({
    initialFormData: form.initialData,
    idKey: table.idKey,
    addApi: apis.add,
    updateApi: apis.update,
    getApi: apis.get,
    formRules: form.rules,
    // 表单提交成功后自动刷新表格数据
    onAfterSubmit: () => {
      tablePageHook.getTableData()
      form.onAfterSubmit?.()
    },
    // 传递自定义成功回调
    onSubmitSuccess: form.onSubmitSuccess,
    messageApi: advanced.messageApi,
    dataTransform: {
      // 提交前数据转换函数，用于在提交前对数据进行处理
      beforeSubmit: (data: T) => {
        let processed = data

        // 处理数组字段转换
        if (advanced.arrayFields?.length) {
          processed = arrayToString(processed, advanced.arrayFields)
        }

        // 调用自定义的 beforeSubmit 函数转换
        if (form.beforeSubmit) {
          processed = form.beforeSubmit(processed)
        }
        return processed
      },
      // 获取后数据转换函数，用于在获取数据后对数据进行处理
      afterGet: (data: any) => {
        let processed = data

        // 先调用自定义的 afterGet 转换
        if (form.afterGet) {
          processed = form.afterGet(processed)
        }

        // 处理数组字段转换
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
   * 处理 CustomTable 事件
   * @description 扩展tablePageHook的事件处理器，添加编辑功能
   */
  // 从 tableBindings 中取原始事件处理器（含 onAction/onPagination/onSelectionChange）
  const tableEventHandlers = {
    onSelectionChange: tablePageHook.tableBindings.value?.onSelectionChange ?? (() => {}),
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

  /** 可直接通过 v-bind="tableBindings" 绑定到 <CustomTable> 的完整属性集 */
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

  return {
    // 表格相关状态和方法
    ...tablePageHook,
    // 表单相关状态和方法
    ...formDialogHook,
    // CustomTable v-bind 一键绑定
    tableBindings,
    // 导出方法
    handleExport
  }
}

