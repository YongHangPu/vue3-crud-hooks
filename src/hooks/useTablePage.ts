import { ref, reactive, computed, onMounted } from 'vue'
import { to } from 'await-to-js'
import { useDataTransform } from './useDataTransform'
import { useMessage } from './useMessage'
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
export const useTablePage = <T = any>(
  fetchData: (params: any) => Promise<any>,
  searchForm: Record<string, any> = {},
  config: TablePageConfig = {},
  deleteConfig: DeleteConfig = {},
  exportConfig: ExportConfig = {}
): TablePageHook<T> => {
  /**
   * 创建默认导出函数（基于 URL 的下载链接方式）
   * @param baseUrl 导出接口基础 URL
   * @returns 导出函数
   */
  const createDefaultExportFunction = (baseUrl: string) => {
    return ({ url, params, filename }: { url?: string; params: any; filename: string }) => {
      const exportUrl = url || baseUrl
      if (!exportUrl) {
        showMessage.warning('导出地址未配置')
        return
      }

      if (typeof window === 'undefined') {
        console.warn('当前环境不支持浏览器导出行为')
        return
      }

      // 构建 URL 查询参数，过滤空值
      const search = new URLSearchParams()
      Object.entries(params || {}).forEach(([key, value]) => {
        // 跳过空值
        if (value === undefined || value === null || value === '') {
          return
        }

        // 数组参数展开为多个同名 key
        if (Array.isArray(value)) {
          value.forEach((item) => {
            search.append(key, String(item))
          })
          return
        }

        search.append(key, String(value))
      })

      // 拼接下载 URL，已有查询参数时追加 &
      const queryString = search.toString()
      const downloadUrl = queryString
        ? `${exportUrl}${exportUrl.includes('?') ? '&' : '?'}${queryString}`
        : exportUrl

      // 创建隐藏的 a 标签触发下载
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      link.target = '_blank'
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // 默认配置：自动检测响应结构、自动获取数据
  const defaultConfig: Required<Pick<TablePageConfig, 'dataKey' | 'totalKey' | 'autoDetect' | 'autoFetch' | 'beforeSearch'>> = {
    dataKey: 'rows',
    totalKey: 'total',
    autoDetect: true,
    autoFetch: true,
    beforeSearch: (params) => params
  }

  // 默认删除配置：各接口默认抛出"未配置"错误
  const defaultDeleteConfig: Required<Omit<DeleteConfig, 'onDeleteSuccess' | 'onBatchDeleteSuccess'>> & {
    onDeleteSuccess?: (row: any) => void
    onBatchDeleteSuccess?: (rows: any[]) => void
  } = {
    deleteApi: async () => {
      throw new Error('删除接口未配置')
    },
    batchDeleteApi: async () => {
      throw new Error('批量删除接口未配置')
    },
    idKey: 'id',
    confirmMessage: '确定要删除当前数据吗？',
    batchConfirmMessage: '确定要删除选中的数据吗？',
    onDeleteSuccess: undefined,
    onBatchDeleteSuccess: undefined
  }

  // ── 配置合并 ──
  // 过滤掉 undefined 属性，避免覆盖默认值
  const validConfig = Object.keys(config).reduce((acc, key) => {
    const value = config[key as keyof TablePageConfig]
    if (value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)

  const validDeleteConfig = Object.keys(deleteConfig).reduce((acc, key) => {
    const value = deleteConfig[key as keyof DeleteConfig]
    if (value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)

  const validExportConfig = Object.keys(exportConfig).reduce((acc, key) => {
    const value = exportConfig[key as keyof ExportConfig]
    if (value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)

  // 用户配置合并到默认值上
  const finalConfig: TablePageConfig & typeof defaultConfig = { ...defaultConfig, ...validConfig }
  const finalDeleteConfig = { ...defaultDeleteConfig, ...validDeleteConfig }

  // 默认导出配置
  const defaultExportConfig: ExportConfig = {
    arrayFields: [],
    timeFields: [],
    idKey: 'id'
  }

  // 合并导出配置，若用户未提供 exportFunction 但有 exportUrl，则使用默认下载方式
  const finalExportConfig = { ...defaultExportConfig, ...validExportConfig }

  // 初始化数据转换工具
  const { processTimeRange, arrayToString } = useDataTransform()

  // 消息提示封装
  const showMessage = useMessage(config.messageApi)

  if (!finalExportConfig.exportFunction && config.exportUrl) {
    finalExportConfig.exportFunction = createDefaultExportFunction(config.exportUrl)
  }

  // 表格数据
  const tableData = ref<any[]>([])
  // 数据加载状态
  const loading = ref(false)
  // 删除操作加载状态
  const deleteLoading = ref(false)
  /**
   * 获取初始分页配置
   * @description 从 customTableConfig 中提取分页参数，或使用默认值
   * @returns 初始页码和每页条数
   */
  const getInitialPagination = () => {
    const paginationConfig = finalConfig.customTableConfig?.pagination
    if (typeof paginationConfig === 'object') {
      return {
        pageNum: paginationConfig.currentPage || 1,
        pageSize: paginationConfig.pageSize || 10
      }
    }
    return {
      pageNum: 1,
      pageSize: 10
    }
  }

  const initialPagination = getInitialPagination()

  // 分页信息
  const pageInfo = reactive({
    pageNum: initialPagination.pageNum, // 当前页码
    pageSize: initialPagination.pageSize, // 每页条数
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
      if (finalConfig.beforeSearch) {
        const processedParams = finalConfig.beforeSearch(requestParams)
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
        tableData.value = []
        pageInfo.total = 0
        showMessage.error(`获取表格数据失败: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      const { data, total } = parseResult(result)
      tableData.value = data
      pageInfo.total = total
    } catch (error) {
      tableData.value = []
      pageInfo.total = 0
      showMessage.error(`获取表格数据失败: ${error instanceof Error ? error.message : String(error)}`)
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

  /**
   * 动态更新表格列配置
   * @param columns 新的列配置数组
   */
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
        showMessage.error(`删除失败: ${error instanceof Error ? error.message : String(error)}`)
        return
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
   * @description 批量删除选中的数据行。未选中任何行时提示用户勾选，不会触发「删除全部」。
   */
  const handleBatchDelete = async () => {
    const deleteIds = selectedIds.value
    if (deleteIds.length === 0) {
      showMessage.warning('请先勾选要删除的数据')
      return
    }

    try {
      const msg = `${finalDeleteConfig.batchConfirmMessage}（共${deleteIds.length}条）`
      await showMessage.confirm(msg)
    } catch {
      return // 用户取消删除
    }

    deleteLoading.value = true
    try {
      const [error, res] = await to(finalDeleteConfig.batchDeleteApi(deleteIds))
      if (error) {
        showMessage.error(`批量删除失败: ${error instanceof Error ? error.message : String(error)}`)
      } else {
        showMessage.success(res.msg)

        // 如果当前页没有数据了，回到上一页
        if (tableData.value.length <= deleteIds.length && pageInfo.pageNum > 1) {
          pageInfo.pageNum--
        }
        // 保存被删除的行数据，用于回调
        const deletedRows = selectedRows.value.slice()
        // 清空选中状态
        selectedRows.value = []

        // 调用批量删除成功回调
        if (finalDeleteConfig.onBatchDeleteSuccess) {
          finalDeleteConfig.onBatchDeleteSuccess(deletedRows)
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
      // 未配置表格时返回 null，CustomTable 会安全降级
      return null
    }

    // 判断是否有数据来决定是否展示分页
    const hasData = tableData.value && tableData.value.length > 0
    const totalCount = pageInfo.total || 0
    const shouldShowPagination = hasData || totalCount > 0

    // 分页配置默认为 true（启用分页但用默认值）
    const paginationConfig = customConfig.pagination !== undefined ? customConfig.pagination : true

    // 索引列：自动注入翻页连续序号公式 (pageNum-1) * pageSize + index + 1
    let processedIndex = customConfig.index
    if (processedIndex) {
      processedIndex = {
        ...(typeof processedIndex === 'object' ? processedIndex : {}),
        index: (index: number) => {
          return (pageInfo.pageNum - 1) * pageInfo.pageSize + index + 1
        }
      }
    }

    return {
      ...customConfig,
      index: processedIndex,
      // 无数据或无分页配置时强制关闭分页
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
    onPagination: (pagination: { currentPage: number; pageSize: number }) => {
      pageInfo.pageNum = pagination.currentPage
      pageInfo.pageSize = pagination.pageSize
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

  /** 可直接通过 v-bind="tableBindings" 绑定到 <CustomTable> 的完整属性集 */
  const tableBindings = computed(() => ({
    config: tableConfig.value,
    data: tableData.value,
    loading: loading.value,
    ...tableEventHandlers
  }))

  /**
   * 导出处理
   * @description 导出表格数据
   * @param options 导出配置选项
   */
  const handleExport = (options: { url?: string; filename?: string; params?: any } = {}) => {
    if (!finalExportConfig.exportFunction) {
      showMessage.warning('导出功能未配置')
      return
    }

    const { url, filename = 'export', params } = options

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
    finalExportConfig.exportFunction({
      url,
      params: processed,
      filename
    })
  }

  // 组件挂载时根据配置决定是否自动获取数据
  onMounted(() => {
    // 默认自动获取数据
    if (finalConfig.autoFetch) {
      getTableData()
    }
  })

  /**
   * @property tableData 表格数据
   * @property loading 数据加载状态
   * @property deleteLoading 删除操作加载状态
   * @property pageInfo 分页信息 { pageNum, pageSize, total }
   * @property searchParams 搜索参数（响应式）
   * @property selectedRows 选中的数据行
   * @property selectedIds 选中的 ID 列表
   * @property getTableData 获取表格数据
   * @property handleSearch 搜索处理（重置页码后刷新）
   * @property handleReset 重置搜索条件
   * @property handlePageChange 页码改变处理
   * @property handleSizeChange 每页条数改变处理
   * @property handleSelectionChange 表格选择改变处理
   * @property handleDelete 单个删除处理
   * @property handleBatchDelete 批量删除处理
   * @property handleExport 导出方法
   * @property tableBindings 通过 v-bind 一键绑定到 CustomTable
   * @property setTableColumns 动态更新列配置
   */
  return {
    tableData,
    loading,
    deleteLoading,
    pageInfo,
    searchParams,
    selectedRows,
    selectedIds,
    getTableData,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSizeChange,
    handleSelectionChange,
    handleDelete,
    handleBatchDelete,
    handleExport,
    tableBindings,
    setTableColumns
  }
}
