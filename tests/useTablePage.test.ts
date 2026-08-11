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

  it('分页配置为对象时,运行时 pageNum/pageSize 覆盖静态配置(防分页与数据错位)', async () => {
    const fetchData = vi.fn().mockResolvedValue({ rows: [{ id: 1 }], total: 100 })
    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        {},
        {
          autoFetch: false,
          messageApi: createMessageApi(),
          customTableConfig: {
            columns: [{ prop: 'name', label: '名称' }],
            pagination: { pageSize: 20 }
          }
        }
      )
    )

    // 初始:静态配置生效
    expect(hook.pageInfo.pageSize).toBe(20)

    // 运行时修改 pageSize,动态值必须覆盖静态配置,避免分页组件显示与请求参数错位
    hook.handleSizeChange(50)
    await flushPromises()

    expect(hook.pageInfo.pageSize).toBe(50)
    expect(hook.tableBindings.value?.config?.pagination?.pageSize).toBe(50)
    expect(fetchData).toHaveBeenLastCalledWith(expect.objectContaining({ pageSize: 50 }))
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

  it('支持嵌套包装响应 { code, data: { records, total } } 自动解析', async () => {
    const fetchData = vi.fn().mockResolvedValue({
      code: 200,
      message: 'ok',
      data: { records: [{ id: 1, name: 'Tom' }], total: 9 }
    })

    const hook = mountComposable(() =>
      useTablePage(fetchData, {}, { autoFetch: false, messageApi: createMessageApi() })
    )

    await hook.getTableData()
    await flushPromises()

    expect(hook.tableData.value).toEqual([{ id: 1, name: 'Tom' }])
    expect(hook.pageInfo.total).toBe(9)
  })

  it('业务失败(code 非成功)时提示后端消息并清空数据', async () => {
    const messageApi = createMessageApi()
    const fetchData = vi.fn().mockResolvedValue({ code: 500, message: '服务器繁忙' })

    const hook = mountComposable(() =>
      useTablePage(fetchData, {}, { autoFetch: false, messageApi })
    )

    hook.tableData.value = [{ id: 1 }]
    hook.pageInfo.total = 5

    await hook.getTableData()
    await flushPromises()

    expect(hook.tableData.value).toEqual([])
    expect(hook.pageInfo.total).toBe(0)
    expect(messageApi.success).not.toHaveBeenCalled()
    expect(messageApi.error).toHaveBeenCalledWith('服务器繁忙')
  })

  it('自定义 isSuccess 覆盖默认业务成功判断', async () => {
    const messageApi = createMessageApi()
    // 后端以 code=1 表示成功
    const fetchData = vi.fn().mockResolvedValue({ code: 1, rows: [{ id: 1 }], total: 1 })

    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        {},
        { autoFetch: false, messageApi, isSuccess: (res) => res?.code === 1 }
      )
    )

    await hook.getTableData()
    await flushPromises()

    expect(hook.tableData.value).toEqual([{ id: 1 }])
    expect(hook.pageInfo.total).toBe(1)
  })

  it('transformResponse 接管响应解析,返回 null 时回退默认解析', async () => {
    const fetchData = vi.fn().mockResolvedValue({
      payload: { items: [{ id: 2 }], totalCount: 3 }
    })

    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        {},
        {
          autoFetch: false,
          messageApi: createMessageApi(),
          transformResponse: (res) => ({ data: res.payload.items, total: res.payload.totalCount })
        }
      )
    )

    await hook.getTableData()
    await flushPromises()

    expect(hook.tableData.value).toEqual([{ id: 2 }])
    expect(hook.pageInfo.total).toBe(3)
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

  it('接口返回 null 时按失败处理且不崩溃', async () => {
    const messageApi = createMessageApi()
    const fetchData = vi.fn().mockResolvedValue(null)

    const hook = mountComposable(() =>
      useTablePage(fetchData, {}, { autoFetch: false, messageApi })
    )

    hook.tableData.value = [{ id: 1 }]

    await hook.getTableData()
    await flushPromises()

    expect(hook.tableData.value).toEqual([])
    expect(messageApi.error).toHaveBeenCalledWith('获取表格数据失败')
  })

  it('竞态防护:慢的旧请求后返回时不覆盖新数据', async () => {
    let resolveFirst!: (v: any) => void
    const first = new Promise((resolve) => {
      resolveFirst = resolve
    })
    const fetchData = vi
      .fn()
      .mockImplementationOnce(() => first) // 第一次请求挂起
      .mockResolvedValue({ rows: [{ id: 2 }], total: 2 }) // 第二次请求立即返回

    const hook = mountComposable(() =>
      useTablePage(fetchData, {}, { autoFetch: false, messageApi: createMessageApi() })
    )

    hook.getTableData() // 第一次请求,挂起
    await hook.getTableData() // 第二次请求,立即完成
    await flushPromises()

    expect(hook.tableData.value).toEqual([{ id: 2 }])

    // 第一次请求姗姗来迟,响应应被丢弃
    resolveFirst({ rows: [{ id: 1 }], total: 1 })
    await flushPromises()

    expect(hook.tableData.value).toEqual([{ id: 2 }])
    expect(hook.pageInfo.total).toBe(2)
  })

  it('竞态防护:过期请求的失败不提示错误', async () => {
    let rejectFirst!: (e: unknown) => void
    const first = new Promise((_, reject) => {
      rejectFirst = reject
    })
    const fetchData = vi
      .fn()
      .mockImplementationOnce(() => first) // 第一次请求挂起
      .mockResolvedValue({ rows: [{ id: 2 }], total: 2 }) // 第二次请求立即返回
    const messageApi = createMessageApi()
    const hook = mountComposable(() =>
      useTablePage(fetchData, {}, { autoFetch: false, messageApi })
    )

    hook.getTableData() // 第一次请求,挂起
    await hook.getTableData() // 第二次请求,立即完成
    await flushPromises()

    rejectFirst(new Error('old request failed'))
    await flushPromises()

    expect(messageApi.error).not.toHaveBeenCalled()
    expect(hook.tableData.value).toEqual([{ id: 2 }])
    expect(hook.pageInfo.total).toBe(2)
  })

  it('第 1 页删除最后一条数据不往下回退', async () => {
    const fetchData = vi.fn().mockResolvedValue({ rows: [], total: 0 })
    const deleteApi = vi.fn().mockResolvedValue({ msg: '删除成功' })
    const messageApi = createMessageApi()
    messageApi.confirm.mockResolvedValue(true)

    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        {},
        { autoFetch: false, messageApi },
        { deleteApi }
      )
    )

    hook.tableData.value = [{ id: 1 }]
    hook.pageInfo.pageNum = 1

    await hook.handleDelete({ id: 1 })
    await flushPromises()

    // 第 1 页不应回退到 0
    expect(hook.pageInfo.pageNum).toBe(1)
  })

  it('配置 onDeleteSuccess 时不自动回退页码(一致性由回调负责)', async () => {
    const fetchData = vi.fn().mockResolvedValue({ rows: [], total: 0 })
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

    hook.tableData.value = [{ id: 1 }]
    hook.pageInfo.pageNum = 2

    await hook.handleDelete({ id: 1 })
    await flushPromises()

    // 配置回调时不回退页码:列表不自动刷新,页码与数据保持一致,避免错位
    expect(hook.pageInfo.pageNum).toBe(2)
    expect(onDeleteSuccess).toHaveBeenCalledWith({ id: 1 })
    // 未自动刷新
    expect(fetchData).not.toHaveBeenCalled()
  })

  it('自定义 idKey 影响 selectedIds 解析', async () => {
    const hook = mountComposable(() =>
      useTablePage(
        vi.fn(),
        {},
        { autoFetch: false, messageApi: createMessageApi() },
        { idKey: 'uuid' }
      )
    )

    hook.tableBindings.value.onSelectionChange([{ uuid: 'u-1' }, { uuid: 'u-2' }])

    expect(hook.selectedIds.value).toEqual(['u-1', 'u-2'])
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

  it('异步 exportFunction 失败时提示导出错误', async () => {
    const messageApi = createMessageApi()
    const exportFunction = vi.fn().mockRejectedValue(new Error('download failed'))
    const hook = mountComposable(() =>
      useTablePage(
        vi.fn().mockResolvedValue({ rows: [], total: 0 }),
        {},
        { autoFetch: false, messageApi },
        {},
        { exportFunction }
      )
    )

    await hook.handleExport()
    await flushPromises()

    expect(exportFunction).toHaveBeenCalled()
    expect(messageApi.error).toHaveBeenCalledWith('导出失败: download failed')
  })

  it('异步 exportFunction 成功时正常完成且不报错', async () => {
    const messageApi = createMessageApi()
    const exportFunction = vi.fn().mockResolvedValue('ok')
    const hook = mountComposable(() =>
      useTablePage(
        vi.fn().mockResolvedValue({ rows: [], total: 0 }),
        {},
        { autoFetch: false, messageApi },
        {},
        { exportFunction }
      )
    )

    await expect(hook.handleExport()).resolves.toBeUndefined()
    expect(exportFunction).toHaveBeenCalled()
    expect(messageApi.error).not.toHaveBeenCalled()
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
    await hook.tableBindings.value.onPagination({ currentPage: 3, pageSize: 20 })
    hook.tableBindings.value.onAction('view', { id: 1 }, 0)

    expect(hook.selectedRows.value).toEqual([{ id: 1 }, { id: 2 }])
    expect(hook.selectedIds.value).toEqual([1, 2])
    expect(hook.pageInfo.pageNum).toBe(3)
    expect(hook.pageInfo.pageSize).toBe(20)
    expect(fetchData).toHaveBeenCalledWith({ pageNum: 3, pageSize: 20 })
    expect(onCustomAction).toHaveBeenCalledWith('view', { id: 1 }, 0)
  })

  it('selection-change 清空时 selectedRows/selectedIds 同步清空(防跨页误删)', async () => {
    const hook = mountComposable(() =>
      useTablePage(vi.fn().mockResolvedValue({ rows: [], total: 0 }), {}, {
        autoFetch: false,
        messageApi: createMessageApi()
      })
    )

    hook.tableBindings.value.onSelectionChange([{ id: 1 }, { id: 2 }])
    expect(hook.selectedRows.value).toEqual([{ id: 1 }, { id: 2 }])
    expect(hook.selectedIds.value).toEqual([1, 2])

    // el-table 翻页/数据刷新后清空选择(未启用 reserveSelection 时),选中状态必须同步清空
    hook.tableBindings.value.onSelectionChange([])
    expect(hook.selectedRows.value).toEqual([])
    expect(hook.selectedIds.value).toEqual([])
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

  it('setTableColumns 在已渲染(先消费 tableBindings)后仍能更新列配置', async () => {
    const fetchData = vi.fn().mockResolvedValue({ rows: [{ id: 1 }], total: 1 })
    const hook = mountComposable(() =>
      useTablePage(
        fetchData,
        {},
        {
          autoFetch: false,
          messageApi: createMessageApi(),
          customTableConfig: { columns: [{ prop: 'name', label: '名称' }] }
        }
      )
    )

    // 模拟组件已渲染:先消费 tableBindings,让 tableConfig 进入缓存状态
    expect(hook.tableBindings.value?.config?.columns).toEqual([{ prop: 'name', label: '名称' }])

    // 动态更新列配置
    hook.setTableColumns([{ prop: 'status', label: '状态' }])

    // 缓存已被响应式依赖失效,读取到新列配置
    expect(hook.tableBindings.value?.config?.columns).toEqual([{ prop: 'status', label: '状态' }])
  })
})
