import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { to } from 'await-to-js'
import { useDataTransform } from './useDataTransform'
import type { TablePageConfig, DeleteConfig, ExportConfig, CustomTableConfig, TablePageHook } from '../types'

/**
 * 表格页面通用hooks
 * @description 提供表格数据管理、分页、搜索、删除等完整功能
 * @param fetchData 获取表格数据的接口函数
 * @param searchForm 搜索表单初始值
 * @param config 表格页面配置选项
 * @param deleteConfig 删除操作配置选项
 * @param exportConfig 导出配置选项
 * @returns 返回表格相关状态和方法
 */
export default function useTablePage<T = any>(
  fetchData: (params: any) => Promise<any>,
  searchForm: Record<string, any> = {},
  config: TablePageConfig = {},
  deleteConfig: DeleteConfig = {},
  exportConfig: ExportConfig = {}
): TablePageHook<T> {
  const defaultConfig: Required<Pick<TablePageConfig, 'dataKey' | 'totalKey' | 'autoDetect' | 'autoFetch' | 'preprocessParams'>> = {
    dataKey: 'rows',
    totalKey: 'total',
    autoDetect: true, // 默认开启自动检测
    autoFetch: true,
    preprocessParams: (params) => params
  }

  // 默认删除配置
  const defaultDeleteConfig: Required<DeleteConfig> = {
    deleteApi: async () => {
      throw new Error('删除接口未配置')
    },
    batchDeleteApi: async () => {
      throw new Error('批量删除接口未配置')
    },
    deleteAllApi: async () => {
      throw new Error('删除全部数据接口未配置')
    },
    idKey: 'id',
    confirmMessage: '确定要删除当前数据吗？',
    batchConfirmMessage: '确定要删除选中的数据吗？',
    deleteAllConfirmMessage: '确定要删除全部数据吗？',
    onDeleteSuccess: () => {}, // 默认空函数
    onBatchDeleteSuccess: () => {} // 默认空函数
  }

  // 合并配置
  const finalConfig = { ...defaultConfig, ...config }
  const finalDeleteConfig = { ...defaultDeleteConfig, ...deleteConfig }

  // 默认导出配置
  const defaultExportConfig: ExportConfig = {
    arrayFields: [],
    timeFields: [],
    idKey: 'id'
  }

  // 合并导出配置
  const finalExportConfig = { ...defaultExportConfig, ...exportConfig }

  // 初始化数据转换工具
  const { processTimeRange, arrayToString } = useDataTransform()

  // 消息提示封装
  const showMessage = {
    success: (msg: string) => config.messageApi?.success?.(msg) ?? ElMessage.success(msg),
    error: (msg: string) => config.messageApi?.error?.(msg) ?? console.error(msg),
    warning: (msg: string) => config.messageApi?.warning?.(msg) ?? ElMessage.warning(msg),
    confirm: (msg: string, title = '提示', options?: any) =>
      config.messageApi?.confirm?.(msg, title, options) ?? ElMessageBox.confirm(msg, title, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        ...options
      })
  }

  // 表格数据
  const tableData = ref<any[]>([])
  // 数据加载状态
  const loading = ref(false)
  // 删除操作加载状态
  const deleteLoading = ref(false)
  // 分页信息
  const pageInfo = reactive({
    pageNum: 1, // 当前页码
    pageSize: 10, // 每页条数
    total: 0 // 总条数
  })
  // 搜索条件
  const searchParams = reactive({
    ...searchForm
  })
  // 选中的数据行
  const selectedRows = ref<any[]>([])
  // 选中的ID列表
  const selectedIds = computed(() => selectedRows.value.map((row) => row[finalDeleteConfig.idKey]))

  /**
   * 解析接口返回结果
   * @description 根据配置解析API响应数据，支持自动检测和手动配置两种模式
   * @param result 接口返回结果
   * @returns 解析后的数据和总数
   */
  const parseResult = (result: any) => {
    if (!finalConfig.autoDetect) {
      // 不自动检测，直接使用配置的字段名
      return {
        data: result[finalConfig.dataKey] || [],
        total: result[finalConfig.totalKey] || 0
      }
    }

    // 自动检测模式：检测常见的数据字段名
    const dataKeys = ['rows', 'data', 'list', 'records', 'items']
    const totalKeys = ['total', 'totalCount', 'count', 'totalElements']
    let data = []
    let total = 0

    // 检测数据字段
    for (const key of dataKeys) {
      if (result[key] && Array.isArray(result[key])) {
        data = result[key]
        break
      }
    }

    // 检测总数字段
    for (const key of totalKeys) {
      if (typeof result[key] === 'number') {
        total = result[key]
        break
      }
    }

    // 如果没有检测到，尝试使用配置的字段名
    if (data.length === 0 && result[finalConfig.dataKey]) {
      data = result[finalConfig.dataKey] || []
    }
    if (total === 0 && result[finalConfig.totalKey]) {
      total = result[finalConfig.totalKey] || 0
    }

    return { data, total }
  }

  /**
   * 获取表格数据
   * @description 调用接口获取表格数据并更新状态
   */
  const getTableData = async () => {
    loading.value = true

    // 准备请求参数
    let requestParams: Record<string, any> = {
      pageNum: pageInfo.pageNum,
      pageSize: pageInfo.pageSize,
      ...searchParams
    }

    try {
      // 处理时间范围字段
      if (finalConfig.timeFields?.length) {
        finalConfig.timeFields.forEach(({ field, prefix }) => {
          requestParams = processTimeRange(requestParams, field, prefix)
        })
      }

      // 处理数组字段转换为字符串（用于搜索）
      if (finalConfig.arrayFields?.length) {
        requestParams = arrayToString(requestParams, finalConfig.arrayFields)
      }

      // 如果配置了预处理函数，执行预处理
      if (finalConfig.preprocessParams) {
        const processedParams = finalConfig.preprocessParams(requestParams)
        // 如果预处理函数返回null或false，则不执行后续请求
        if (!processedParams) {
          loading.value = false
          return
        }
        requestParams = {
          pageNum: pageInfo.pageNum,
          pageSize: pageInfo.pageSize,
          ...processedParams
        }
      }

      const [error, result] = await to(fetchData(requestParams))
      if (error) {
        return console.error('获取表格数据失败:', error)
      }

      const { data, total } = parseResult(result)
      tableData.value = data
      pageInfo.total = total
    } catch (error) {
      tableData.value = []
      pageInfo.total = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索处理
   * @description 重置页码并重新获取数据
   */
  const handleSearch = () => {
    pageInfo.pageNum = 1
    getTableData()
  }

  /**
   * 重置处理
   * @description 重置搜索条件和页码，重新获取数据
   */
  const handleReset = () => {
    pageInfo.pageNum = 1
    Object.assign(searchParams, searchForm)
    getTableData()
  }

  /**
   * 页码改变处理
   * @param page 新的页码
   * @description 更新当前页码并重新获取数据
   */
  const handlePageChange = (page: number) => {
    pageInfo.pageNum = page
    getTableData()
  }

  /**
   * 每页条数改变处理
   * @param size 新的每页条数
   * @description 更新每页条数，重置页码并重新获取数据
   */
  const handleSizeChange = (size: number) => {
    pageInfo.pageSize = size
    pageInfo.pageNum = 1
    getTableData()
  }

  const setTableColumns = (columns: CustomTableConfig['columns']) => {
    if (finalConfig.customTableConfig) {
      finalConfig.customTableConfig.columns = columns
    }
  }

  /**
   * 表格选择改变处理
   * @param selection 选中的数据
   * @description 更新选中的数据状态
   */
  const handleSelectionChange = (selection: any[]) => {
    selectedRows.value = selection
  }

  /**
   * 单个删除处理
   * @param row 要删除的数据行
   * @param skipConfirm 是否跳过确认，默认为 false
   * @description 删除单条数据，支持确认提示和自动刷新
   */
  const handleDelete = async (row: any) => {
    try {
      await showMessage.confirm(finalDeleteConfig.confirmMessage)
    } catch {
      return // 用户取消删除
    }

    deleteLoading.value = true
    const id = row[finalDeleteConfig.idKey]
    try {
      const [error, res] = await to(finalDeleteConfig.deleteApi(id))
      if (error) {
        return console.error('删除失败:', error)
      }

      showMessage.success(res.msg || '删除成功')

      // 如果当前页没有数据了，回到上一页
      if (tableData.value.length === 1 && pageInfo.pageNum > 1) {
        pageInfo.pageNum--
      }

      // 调用删除成功回调
      if (finalDeleteConfig.onDeleteSuccess) {
        finalDeleteConfig.onDeleteSuccess(row)
      } else {
        await getTableData()
      }
    } finally {
      deleteLoading.value = false
    }
  }

  /**
   * 批量删除处理
   * @param ids 要删除的ID列表，如果不传则使用选中的数据
   * @description 批量删除数据，支持确认提示和自动刷新
   */
  const handleBatchDelete = async () => {
    const deleteIds = selectedIds.value
    const deleteAll = deleteIds.length === 0
    // 判断表格数据是否为空
    if (tableData.value.length === 0) {
      showMessage.warning('没有需要删除的数据！')
      return
    }

    try {
      const msg = deleteAll ? `${finalDeleteConfig.deleteAllConfirmMessage}` : `${finalDeleteConfig.batchConfirmMessage}（共${deleteIds.length}条）`
      await showMessage.confirm(msg)
    } catch {
      return // 用户取消删除
    }

    deleteLoading.value = true
    try {
      const api = deleteAll ? finalDeleteConfig.deleteAllApi() : finalDeleteConfig.batchDeleteApi(deleteIds)

      const [error, res] = await to(api)
      if (error) {
        console.error(deleteAll ? '删除所有数据失败:' : '批量删除失败:', error)
      } else {
        showMessage.success(res.msg)

        // 保存删除前的选中行数据，用于回调
        const deletedRows = deleteAll ? [...tableData.value] : selectedRows.value.slice()

        if (deleteAll) {
          // 重置页码到第一页
          pageInfo.pageNum = 1
        } else {
          // 如果当前页没有数据了，回到上一页
          if (tableData.value.length <= deleteIds.length && pageInfo.pageNum > 1) {
            pageInfo.pageNum--
          }
        }
        // 清空选中状态
        selectedRows.value = []

        // 调用批量删除成功回调
        if (finalDeleteConfig.onBatchDeleteSuccess) {
          finalDeleteConfig.onBatchDeleteSuccess(deletedRows, deleteAll)
        } else {
          await getTableData()
        }
      }
    } finally {
      deleteLoading.value = false
    }
  }

  /**
   * 生成 CustomTable 配置
   * @description 基于 customTableConfig 和表格数据生成完整的表格配置，当数据为空时不显示分页
   * @returns CustomTable 组件配置
   */
  const tableConfig = computed(() => {
    const customConfig = finalConfig.customTableConfig
    if (!customConfig) {
      return null
    }

    // 判断是否有数据
    const hasData = tableData.value && tableData.value.length > 0
    const totalCount = pageInfo.total || 0

    // 只有在有数据或总数大于0时才显示分页
    const shouldShowPagination = hasData || totalCount > 0

    // 获取分页配置，默认为 true
    const paginationConfig = customConfig.pagination !== undefined ? customConfig.pagination : true

    // 处理 index 配置，如果是对象且没有自定义 index 函数，则自动添加连续序号逻辑
    let processedIndex = customConfig.index
    if (processedIndex) {
      processedIndex = {
        ...(typeof processedIndex === 'object' ? processedIndex : {}),
        // 自动添加翻页连续序号逻辑
        index: (index: number) => {
          return (pageInfo.pageNum - 1) * pageInfo.pageSize + index + 1
        }
      }
    }

    return {
      ...customConfig,
      index: processedIndex,
      pagination:
        shouldShowPagination && paginationConfig
          ? {
              total: pageInfo.total,
              currentPage: pageInfo.pageNum,
              pageSize: pageInfo.pageSize,
              ...(typeof paginationConfig === 'object' ? paginationConfig : {})
            }
          : false
    }
  })

  /**
   * 处理 CustomTable 事件
   * @description 统一处理表格的各种事件
   */
  const tableEventHandlers = {
    /**
     * 处理选择变化
     * @param selection 选中的数据
     */
    onSelectionChange: (selection: any[]) => {
      handleSelectionChange(selection)
    },

    /**
     * 处理分页变化
     * @param pagination 分页信息
     */
    onPagination: (pagination: { page: number; limit: number }) => {
      pageInfo.pageNum = pagination.page
      pageInfo.pageSize = pagination.limit
      getTableData()
    },

    /**
     * 处理操作按钮点击
     * @param event 事件名
     * @param row 行数据
     * @param index 行索引
     */
    onAction: (event: string, row: any, index: number) => {
      switch (event) {
        case 'delete':
          handleDelete(row)
          break
        default:
          // 处理自定义事件
          if (config.customTableConfig?.onCustomAction) {
            config.customTableConfig.onCustomAction(event, row, index)
          } else {
            console.log('未处理的自定义事件:', event, row, index)
          }
      }
    }
  }

  /**
   * 导出处理
   * @description 导出表格数据为Excel文件
   * @param exportUrl 导出接口URL
   * @param filename 导出文件名（不含扩展名）
   * @param params 导出参数（可选），默认为空对象
   */
  const handleExport = (exportUrl: string, filename: string, params?: any) => {
    if (!finalExportConfig.exportFunction) {
      console.error('未配置 exportFunction，无法执行导出')
      showMessage.warning('导出功能未配置')
      return
    }

    // query参数从搜索表单提取，也包括勾选的行数据的id
    const query = {
      ...(params || {}),
      ...searchParams,
      ids: selectedRows.value.map((row: any) => row[finalDeleteConfig.idKey])
    }
    let processed = { ...query }

    // 处理时间范围字段
    if (finalConfig.timeFields?.length) {
      finalConfig.timeFields.forEach(({ field, prefix }) => {
        processed = processTimeRange(processed, field, prefix)
      })
    }

    // 处理数组字段转换为字符串（用于搜索）
    if (finalConfig.arrayFields?.length) {
      processed = arrayToString(processed, finalConfig.arrayFields)
    }

    // 调用自定义导出函数
    finalExportConfig.exportFunction(exportUrl, processed, `${filename}_${new Date().getTime()}.xlsx`)
  }

  // 组件挂载时根据配置决定是否自动获取数据
  onMounted(() => {
    // 默认自动获取数据
    if (finalConfig.autoFetch) {
      getTableData()
    }
  })

  return {
    // 数据状态
    tableData, // 表格数据
    loading, // 数据加载状态
    deleteLoading, // 删除操作加载状态
    pageInfo, // 分页信息
    searchParams, // 搜索参数
    selectedRows, // 选中的数据行
    selectedIds, // 选中的ID列表

    // 基础方法
    getTableData, // 获取表格数据
    handleSearch, // 搜索处理
    handleReset, // 重置处理
    handlePageChange, // 页码改变处理
    handleSizeChange, // 每页条数改变处理

    // 选择和删除方法
    handleSelectionChange, // 表格选择改变处理
    handleDelete, // 单个删除处理
    handleBatchDelete, // 批量删除处理

    handleExport, // 导出方法

    // CustomTable 相关
    tableConfig, // 表格配置（直接可用于CustomTable组件）
    tableEventHandlers, // 表格事件处理器
    setTableColumns
  }
}
