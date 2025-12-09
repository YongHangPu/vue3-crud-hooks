import { ref, computed } from 'vue'
import useTablePage from './useTablePage'
import { useFormDialog } from './useFormDialog'
import { useDataTransform } from './useDataTransform'
import type { CrudPageConfig, SimpleCrudConfig, CrudPageHook } from '../types'

/**
 * 判断是否为简化配置
 * @param config 配置对象
 */
function isSimpleConfig<T>(config: SimpleCrudConfig<T> | CrudPageConfig<T>): config is SimpleCrudConfig<T> {
  return 'apis' in config && 'form' in config
}

/**
 * 将简化配置转换为完整配置
 * @param simpleConfig 简化配置对象
 */
function convertToFullConfig<T>(simpleConfig: SimpleCrudConfig<T>): CrudPageConfig<T> {
  const { apis, form, table, search, advanced = {} } = simpleConfig

  return {
    // API 配置
    listApi: apis.list,
    addApi: apis.add,
    updateApi: apis.update,
    deleteApi: apis.delete,
    batchDeleteApi: apis.batchDelete,
    deleteAllApi: undefined, // 简化配置暂不支持
    getApi: apis.get,

    // 表单配置
    initialFormData: form.initialData,
    formRules: form.rules,

    // 表格配置
    customTableConfig: table.config,
    dataKey: table.dataKey,
    totalKey: table.totalKey,

    // 搜索配置
    initialSearchForm: search?.initialData,

    // 高级配置
    arrayFields: advanced.arrayFields,
    timeFields: advanced.timeFields,
    dataTransform: advanced.dataTransform,
    messageApi: advanced.messageApi,

    // 回调函数
    onSuccess: advanced.callbacks?.onSuccess,
    onSubmitSuccess: advanced.callbacks?.onSubmitSuccess,
    onDeleteSuccess: advanced.callbacks?.onDeleteSuccess,
    onBatchDeleteSuccess: advanced.callbacks?.onBatchDeleteSuccess,

    // 导出配置
    exportFunction: apis.export ? (url, params, filename) => apis.export!(params) : undefined
  }
}

/**
 * 通用 CRUD 页面 Hook
 * @description 集成表格展示、表单弹窗、数据转换等功能的综合性Hook。支持简化配置和完整配置两种使用方式
 * @template T 表单数据类型
 * @param config CRUD页面配置选项（支持简化配置和完整配置）
 * @returns 返回CRUD页面所需的所有状态和方法
 */
export const useCrudPage = <T = any>(config: SimpleCrudConfig<T> | CrudPageConfig<T>): CrudPageHook<T> => {
  const { arrayToString, stringToArray } = useDataTransform()
  const importDialogVisible = ref(false)

  // 检测配置类型并转换
  const normalizedConfig = isSimpleConfig(config)
    ? convertToFullConfig(config as SimpleCrudConfig<T>)
    : config as CrudPageConfig<T>

  // 初始化表格页面 Hook
  const tablePageHook = useTablePage(
    normalizedConfig.listApi,
    normalizedConfig.initialSearchForm || {},
    {
      dataKey: normalizedConfig.dataKey,
      totalKey: normalizedConfig.totalKey,
      autoDetect: normalizedConfig.autoDetect,
      autoFetch: normalizedConfig.autoFetch,
      preprocessParams: normalizedConfig.preprocessParams,
      customTableConfig: normalizedConfig.customTableConfig,
      arrayFields: normalizedConfig.arrayFields,
      timeFields: normalizedConfig.timeFields,
      messageApi: normalizedConfig.messageApi
    },
    {
      deleteApi: normalizedConfig.deleteApi,
      batchDeleteApi: normalizedConfig.batchDeleteApi,
      deleteAllApi: normalizedConfig.deleteAllApi,
      idKey: normalizedConfig.idKey,
      confirmMessage: normalizedConfig.confirmMessage,
      batchConfirmMessage: normalizedConfig.batchConfirmMessage,
      deleteAllConfirmMessage: normalizedConfig.deleteAllConfirmMessage,
      onDeleteSuccess: normalizedConfig.onDeleteSuccess,
      onBatchDeleteSuccess: normalizedConfig.onBatchDeleteSuccess
    },
    {
      exportFunction: normalizedConfig.exportFunction,
      arrayFields: normalizedConfig.arrayFields,
      timeFields: normalizedConfig.timeFields,
      idKey: normalizedConfig.idKey
    }
  )

  // 初始化表单弹窗 Hook
  const formDialogHook = useFormDialog({
    initialFormData: normalizedConfig.initialFormData,
    addApi: normalizedConfig.addApi,
    updateApi: normalizedConfig.updateApi,
    getApi: normalizedConfig.getApi,
    formRules: normalizedConfig.formRules,
    // 表单提交成功后自动刷新表格数据
    onSuccess: tablePageHook.getTableData,
    // 传递自定义成功回调
    onSubmitSuccess: normalizedConfig.onSubmitSuccess,
    messageApi: normalizedConfig.messageApi, // 透传 messageApi
    dataTransform: {
      // 提交前数据转换函数，用于在提交前对数据进行处理
      beforeSubmit: (data: T) => {
        let processed = data

        // 处理数组字段转换
        if (normalizedConfig.arrayFields?.length) {
          processed = arrayToString(processed, normalizedConfig.arrayFields)
        }

        // 调用自定义的 beforeSubmit 函数转换
        if (normalizedConfig.dataTransform?.beforeSubmit) {
          processed = normalizedConfig.dataTransform.beforeSubmit(processed)
        }
        return processed
      },
      // 获取后数据转换函数，用于在获取数据后对数据进行处理
      afterGet: (data: any) => {
        let processed = data

        // 先调用自定义的 afterGet 转换
        if (normalizedConfig.dataTransform?.afterGet) {
          processed = normalizedConfig.dataTransform.afterGet(processed)
        }

        // 处理数组字段转换
        if (normalizedConfig.arrayFields?.length) {
          processed = stringToArray(processed, normalizedConfig.arrayFields)
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
  const cusTableConfig = computed(() => {
    if (!normalizedConfig.customTableConfig) {
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
    // 优先使用 normalizedConfig 中的自定义事件处理器
    if (normalizedConfig.customTableConfig?.onCustomAction) {
      normalizedConfig.customTableConfig.onCustomAction(event, row, index)
      return
    }

    // 其次使用简化配置中的自定义事件处理器
    if (isSimpleConfig(config) && config.table?.onCustomAction) {
      config.table.onCustomAction(event, row, index)
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

      // 尝试使用默认事件处理器
      const defaultHandler = tablePageHook.tableEventHandlers.onAction
      if (defaultHandler) {
        defaultHandler(event, row, index)
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
   * @description 导出表格数据为Excel文件
   * @param exportUrl 导出接口URL
   * @param filename 导出文件名（不含扩展名）
   * @param params 导出参数（可选），默认为空对象
   */
  const handleExport = (exportUrl: string, filename: string, params?: any) => {
    // 直接使用 tablePageHook 的导出方法
    tablePageHook.handleExport(exportUrl, filename, params)
  }

  return {
    // 表格相关状态和方法
    ...tablePageHook,
    // 表单相关状态和方法
    ...formDialogHook,
    // CustomTable 配置和事件处理
    cusTableConfig,
    tableEventHandlers,
    // 工具方法
    importDialogVisible,
    handleBatchImport,
    handleExport
  }
}

