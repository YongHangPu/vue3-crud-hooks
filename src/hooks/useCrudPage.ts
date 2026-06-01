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
  const importDialogVisible = ref(false)
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
      onDeleteSuccess: advanced.callbacks?.onDeleteSuccess,
      onBatchDeleteSuccess: advanced.callbacks?.onBatchDeleteSuccess
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
    onSuccess: () => {
      tablePageHook.getTableData()
      form.onSuccess?.()
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
   * 获取 CustomTable 配置
   * @description 基于 customTableConfig 和表格数据生成完整的表格配置，当数据为空时不显示分页
   * @returns CustomTable 组件配置
   */
  const tableConfig = computed(() => {
    if (!table.config) {
      return null
    }

    // 直接使用tablePageHook的tableConfig
    return tablePageHook.tableConfig.value
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
  const tableEventHandlers = {
    ...tablePageHook.tableEventHandlers,

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
        tablePageHook.tableEventHandlers.onAction?.(event, row, index)
        return
      }

      // 处理自定义事件
      handleCustomAction(event, row, index)
    }
  }

  /**
   * 批量导入处理
   * @description 批量导入功能的占位方法，待具体实现
   */
  const handleBatchImport = () => {
    importDialogVisible.value = true
  }

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
    // CustomTable 配置和事件处理
    tableConfig,
    tableEventHandlers,
    // 工具方法
    importDialogVisible,
    handleBatchImport,
    handleExport
  }
}

