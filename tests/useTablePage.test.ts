import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable } from './helpers/mountComposable'
import { useTablePage } from '@/hooks/useTablePage'

describe('useTablePage', () => {
  const createMessageApi = () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    confirm: vi.fn()
  })

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('挂载时自动获取列表，tableBindings 含分页信息', async () => {
    const fetchData = vi.fn().mockResolvedValue({
      rows: [{ id: 1, name: 'Tom' }],
      total: 1
    })

    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        { keyword: '' },
        {
          customTableConfig: {
            columns: [{ prop: 'name', label: '名称' }]
          },
          messageApi: createMessageApi()
        }
      )
    )

    await flushPromises()

    expect(fetchData).toHaveBeenCalledWith({
      pageNum: 1,
      pageSize: 10,
      keyword: ''
    })
    expect(hook.tableData.value).toEqual([{ id: 1, name: 'Tom' }])
    expect(hook.pageInfo.total).toBe(1)
    expect(hook.tableBindings.value?.config?.pagination).toEqual(
      expect.objectContaining({
        total: 1,
        currentPage: 1,
        pageSize: 10
      })
    )
  })

  it('beforeSearch 返回 false 时阻止请求', async () => {
    const fetchData = vi.fn()
    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        { keyword: '' },
        {
          autoFetch: false,
          beforeSearch: () => false,
          messageApi: createMessageApi()
        }
      )
    )

    hook.handleSearch()
    await flushPromises()

    expect(fetchData).not.toHaveBeenCalled()
    expect(hook.loading.value).toBe(false)
  })

  it('关闭自动识别后按 dataKey 和 totalKey 解析数据', async () => {
    const fetchData = vi.fn().mockResolvedValue({
      dataSource: [{ uuid: 'u-1', name: 'Tom' }],
      totalSize: 1
    })

    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        {},
        {
          autoDetect: false,
          autoFetch: false,
          dataKey: 'dataSource',
          totalKey: 'totalSize',
          messageApi: createMessageApi()
        }
      )
    )

    await hook.getTableData()
    await flushPromises()

    expect(hook.tableData.value).toEqual([{ uuid: 'u-1', name: 'Tom' }])
    expect(hook.pageInfo.total).toBe(1)
  })

  it('列表请求失败时提示错误并清空数据', async () => {
    const messageApi = createMessageApi()
    const fetchData = vi.fn().mockRejectedValue(new Error('network down'))

    const hook = mountComposable(() =>
      useTablePage(fetchData, {}, { autoFetch: false, messageApi })
    )

    hook.tableData.value = [{ id: 1 }]
    hook.pageInfo.total = 5

    await hook.getTableData()
    await flushPromises()

    expect(messageApi.error).toHaveBeenCalledWith('获取表格数据失败: network down')
    expect(hook.tableData.value).toEqual([])
    expect(hook.pageInfo.total).toBe(0)
  })

  it('删除成功后在当前页为空时回退页码并刷新列表', async () => {
    const fetchData = vi.fn().mockResolvedValue({
      rows: [],
      total: 0
    })
    const deleteApi = vi.fn().mockResolvedValue({ msg: '删除成功' })
    const messageApi = createMessageApi()
    messageApi.confirm.mockResolvedValue(true)

    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        {},
        {
          autoFetch: false,
          messageApi
        },
        {
          deleteApi
        }
      )
    )

    hook.tableData.value = [{ id: 1 }]
    hook.pageInfo.pageNum = 2

    await hook.handleDelete({ id: 1 })
    await flushPromises()

    expect(deleteApi).toHaveBeenCalledWith(1)
    expect(hook.pageInfo.pageNum).toBe(1)
    expect(fetchData).toHaveBeenCalledWith({
      pageNum: 1,
      pageSize: 10
    })
    expect(messageApi.success).toHaveBeenCalledWith('删除成功')
  })

  it('删除取消时不调用删除接口', async () => {
    const deleteApi = vi.fn()
    const messageApi = createMessageApi()
    messageApi.confirm.mockRejectedValue(new Error('cancel'))

    const hook = mountComposable(() =>
      useTablePage(vi.fn(), {}, { autoFetch: false, messageApi }, { deleteApi })
    )

    await hook.handleDelete({ id: 1 })

    expect(deleteApi).not.toHaveBeenCalled()
  })

  it('删除失败时提示错误并结束删除状态', async () => {
    const deleteApi = vi.fn().mockRejectedValue(new Error('remove failed'))
    const messageApi = createMessageApi()
    messageApi.confirm.mockResolvedValue(true)

    const hook = mountComposable(() =>
      useTablePage(vi.fn(), {}, { autoFetch: false, messageApi }, { deleteApi })
    )

    await hook.handleDelete({ id: 1 })
    await flushPromises()

    expect(messageApi.error).toHaveBeenCalledWith('删除失败: remove failed')
    expect(hook.deleteLoading.value).toBe(false)
  })

  it('删除成功时若配置 onDeleteSuccess 则优先执行回调', async () => {
    const fetchData = vi.fn()
    const deleteApi = vi.fn().mockResolvedValue({ msg: '删除成功' })
    const onDeleteSuccess = vi.fn()
    const messageApi = createMessageApi()
    messageApi.confirm.mockResolvedValue(true)

    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        {},
        { autoFetch: false, messageApi },
        { deleteApi, onDeleteSuccess }
      )
    )

    await hook.handleDelete({ id: 1, name: 'Tom' })
    await flushPromises()

    expect(onDeleteSuccess).toHaveBeenCalledWith({ id: 1, name: 'Tom' })
    expect(fetchData).not.toHaveBeenCalled()
  })

  it('批量删除在空表格时给出警告', async () => {
    const messageApi = createMessageApi()
    const hook = mountComposable(() =>
      useTablePage(vi.fn(), {}, { autoFetch: false, messageApi })
    )

    await hook.handleBatchDelete()

    expect(messageApi.warning).toHaveBeenCalledWith('请先勾选要删除的数据')
  })

  it('批量删除取消时不调用接口', async () => {
    const batchDeleteApi = vi.fn()
    const messageApi = createMessageApi()
    messageApi.confirm.mockRejectedValue(new Error('cancel'))

    const hook = mountComposable(() =>
      useTablePage(
        vi.fn(),
        {},
        { autoFetch: false, messageApi },
        { batchDeleteApi }
      )
    )

    hook.tableData.value = [{ id: 1 }, { id: 2 }]
    hook.selectedRows.value = [{ id: 1 }]

    await hook.handleBatchDelete()

    expect(batchDeleteApi).not.toHaveBeenCalled()
  })

  it('批量删除成功后清空选择并回退页码', async () => {
    const fetchData = vi.fn().mockResolvedValue({ rows: [], total: 0 })
    const batchDeleteApi = vi.fn().mockResolvedValue({ msg: '批量删除成功' })
    const messageApi = createMessageApi()
    messageApi.confirm.mockResolvedValue(true)

    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        {},
        { autoFetch: false, messageApi },
        { batchDeleteApi }
      )
    )

    hook.tableData.value = [{ id: 1 }, { id: 2 }]
    hook.selectedRows.value = [{ id: 1 }, { id: 2 }]
    hook.pageInfo.pageNum = 2

    await hook.handleBatchDelete()
    await flushPromises()

    expect(batchDeleteApi).toHaveBeenCalledWith([1, 2])
    expect(hook.selectedRows.value).toEqual([])
    expect(hook.pageInfo.pageNum).toBe(1)
    expect(fetchData).toHaveBeenCalledWith({ pageNum: 1, pageSize: 10 })
  })

  it('未选中行时调用批量删除给出提示不执行删除', async () => {
    const deleteApi = vi.fn().mockResolvedValue({ msg: '删除成功' })
    const messageApi = createMessageApi()
    const warningSpy = vi.spyOn(messageApi, 'warning')

    const hook = mountComposable(() =>
      useTablePage(
        vi.fn(),
        {},
        { autoFetch: false, messageApi },
        { deleteApi }
      )
    )

    await hook.handleBatchDelete()
    await flushPromises()

    expect(warningSpy).toHaveBeenCalledWith('请先勾选要删除的数据')
    expect(deleteApi).not.toHaveBeenCalled()
  })

  it('批量删除失败时提示错误', async () => {
    const batchDeleteApi = vi.fn().mockRejectedValue(new Error('batch failed'))
    const messageApi = createMessageApi()
    messageApi.confirm.mockResolvedValue(true)

    const hook = mountComposable(() =>
      useTablePage(
        vi.fn(),
        {},
        { autoFetch: false, messageApi },
        { batchDeleteApi }
      )
    )

    hook.tableData.value = [{ id: 1 }]
    hook.selectedRows.value = [{ id: 1 }]

    await hook.handleBatchDelete()
    await flushPromises()

    expect(messageApi.error).toHaveBeenCalledWith('批量删除失败: batch failed')
  })

  it('导出时合并搜索条件、选中 ID 与自动转换字段', () => {
    const exportFunction = vi.fn()
    const hook = mountComposable(() =>
      useTablePage(
        vi.fn(),
        {
          tags: [] as string[],
          createTime: [] as string[]
        },
        {
          autoFetch: false,
          arrayFields: ['tags'],
          timeFields: [{ field: 'createTime', prefix: { start: 'startTime', end: 'endTime' } }],
          messageApi: createMessageApi()
        },
        {
          idKey: 'uuid'
        },
        {
          exportFunction,
          idKey: 'uuid'
        }
      )
    )

    hook.searchParams.tags = ['Vue', 'React']
    hook.searchParams.createTime = ['2025-01-01', '2025-01-31']
    hook.selectedRows.value = [{ uuid: 'u-1' }, { uuid: 'u-2' }]

    hook.handleExport({ filename: 'users' })

    expect(exportFunction).toHaveBeenCalledWith({
      url: undefined,
      filename: 'users',
      params: {
        tags: 'Vue,React',
        ids: ['u-1', 'u-2'],
        startTime: '2025-01-01',
        endTime: '2025-01-31'
      }
    })
  })

  it('未配置导出能力时给出警告', () => {
    const messageApi = createMessageApi()
    const hook = mountComposable(() =>
      useTablePage(vi.fn(), {}, { autoFetch: false, messageApi })
    )

    hook.handleExport()

    expect(messageApi.warning).toHaveBeenCalledWith('导出功能未配置')
  })

  it('配置 exportUrl 时使用默认下载链接导出', () => {
    const messageApi = createMessageApi()
    const originalCreateElement = document.createElement.bind(document)
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
    const clickSpy = vi.fn()
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          target: '',
          rel: '',
          click: clickSpy
        } as unknown as HTMLAnchorElement
      }
      return originalCreateElement(tagName)
    }) as typeof document.createElement)

    const hook = mountComposable(() =>
      useTablePage(
        vi.fn(),
        { keyword: 'tom' },
        {
          autoFetch: false,
          exportUrl: '/api/export',
          messageApi
        }
      )
    )

    hook.handleExport({ filename: 'users' })

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(clickSpy).toHaveBeenCalled()
    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
  })

  it('tableBindings 包含事件处理函数', async () => {
    const fetchData = vi.fn().mockResolvedValue({ rows: [], total: 0 })
    const onCustomAction = vi.fn()
    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        {},
        {
          autoFetch: false,
          messageApi: createMessageApi(),
          customTableConfig: {
            columns: [{ prop: 'name', label: '名称' }],
            onCustomAction
          }
        }
      )
    )

    hook.tableBindings.value.onSelectionChange([{ id: 1 }, { id: 2 }])
    await hook.tableBindings.value.onPagination({ page: 3, limit: 20 })
    hook.tableBindings.value.onAction('view', { id: 1 }, 0)

    expect(hook.selectedRows.value).toEqual([{ id: 1 }, { id: 2 }])
    expect(hook.selectedIds.value).toEqual([1, 2])
    expect(hook.pageInfo.pageNum).toBe(3)
    expect(hook.pageInfo.pageSize).toBe(20)
    expect(fetchData).toHaveBeenCalledWith({ pageNum: 3, pageSize: 20 })
    expect(onCustomAction).toHaveBeenCalledWith('view', { id: 1 }, 0)
  })

  it('handleSearch、handleReset、分页方法和列更新按预期工作', async () => {
    const fetchData = vi.fn().mockResolvedValue({ rows: [], total: 0 })
    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        { keyword: 'init' },
        {
          autoFetch: false,
          messageApi: createMessageApi(),
          customTableConfig: {
            columns: [{ prop: 'name', label: '名称' }],
            index: true
          }
        }
      )
    )

    hook.pageInfo.pageNum = 4
    hook.searchParams.keyword = 'changed'
    hook.handleReset()
    await flushPromises()
    hook.handleSearch()
    await flushPromises()
    hook.handlePageChange(2)
    await flushPromises()
    hook.handleSizeChange(50)
    await flushPromises()
    hook.setTableColumns([{ prop: 'status', label: '状态' }])

    expect(hook.searchParams.keyword).toBe('init')
    expect(hook.pageInfo.pageNum).toBe(1)
    expect(hook.pageInfo.pageSize).toBe(50)
    expect(hook.tableBindings.value?.config?.columns).toEqual([{ prop: 'status', label: '状态' }])
    expect(typeof (hook.tableBindings.value?.config?.index as { index?: (value: number) => number }).index).toBe('function')
    expect((hook.tableBindings.value?.config?.index as { index: (value: number) => number }).index(0)).toBe(1)
  })
})
