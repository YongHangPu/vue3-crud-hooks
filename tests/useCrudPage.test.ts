import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable } from './helpers/mountComposable'
import { useCrudPage } from '@/hooks/useCrudPage'

describe('useCrudPage', () => {
  const createMessageApi = () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    confirm: vi.fn()
  })

  const createFormRef = () => ({
    validate: vi.fn().mockResolvedValue(true),
    resetFields: vi.fn(),
    clearValidate: vi.fn()
  })

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('编辑事件触发后通过详情接口回显并自动转换数组字段', async () => {
    const getApi = vi.fn().mockResolvedValue({
      data: {
        id: 1,
        name: 'Tom',
        tags: 'Vue,React'
      }
    })

    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: vi.fn(),
          update: vi.fn(),
          get: getApi
        },
        form: {
          initialData: { id: 0, name: '', tags: [] as string[] }
        },
        table: {
          autoFetch: false,
          config: {
            columns: [
              {
                prop: 'action',
                label: '操作',
                type: 'action',
                buttons: [{ event: 'edit', btnText: '编辑' }]
              }
            ]
          }
        },
        advanced: {
          arrayFields: ['tags'],
          messageApi: createMessageApi()
        }
      })
    )

    await hook.tableEventHandlers.onAction('edit', { id: 1 }, 0)
    await flushPromises()

    expect(getApi).toHaveBeenCalledWith(1)
    expect(hook.dialogVisible.value).toBe(true)
    expect(hook.formData.value).toEqual({
      id: 1,
      name: 'Tom',
      tags: ['Vue', 'React']
    })
  })

  it('新增提交时会转换数组字段并在成功后刷新列表', async () => {
    const listApi = vi.fn().mockResolvedValue({
      rows: [],
      total: 0
    })
    const addApi = vi.fn().mockResolvedValue({
      msg: '保存成功'
    })
    const formOnSuccess = vi.fn()

    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: listApi,
          add: addApi,
          update: vi.fn()
        },
        form: {
          initialData: { name: '', tags: [] as string[] },
          onSuccess: formOnSuccess
        },
        table: {
          autoFetch: false,
          config: {
            columns: [{ prop: 'name', label: '名称' }]
          }
        },
        advanced: {
          arrayFields: ['tags'],
          messageApi: createMessageApi()
        }
      })
    )

    hook.formRef.value = createFormRef()
    hook.dialogVisible.value = true
    hook.formData.value = {
      name: 'Tom',
      tags: ['Vue', 'React']
    }

    await hook.submitForm()
    await flushPromises()

    expect(addApi).toHaveBeenCalledWith({
      name: 'Tom',
      tags: 'Vue,React'
    })
    expect(listApi).toHaveBeenCalledTimes(1)
    expect(formOnSuccess).toHaveBeenCalled()
    expect(hook.dialogVisible.value).toBe(false)
  })

  it('优先使用 tableConfig 并按表格配置处理自定义事件', async () => {
    const onCustomAction = vi.fn()
    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: vi.fn(),
          update: vi.fn()
        },
        form: {
          initialData: { name: '' }
        },
        table: {
          autoFetch: false,
          config: {
            columns: [{ prop: 'name', label: '名称' }],
            onCustomAction
          }
        },
        advanced: {
          messageApi: createMessageApi()
        }
      })
    )

    expect(hook.tableConfig.value).not.toBeNull()

    await hook.tableEventHandlers.onAction('view', { id: 1 }, 0)

    expect(onCustomAction).toHaveBeenCalledWith('view', { id: 1 }, 0)
  })

  it('支持 table.onCustomAction 作为自定义事件备用处理器', async () => {
    const onCustomAction = vi.fn()
    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: vi.fn(),
          update: vi.fn()
        },
        form: {
          initialData: { name: '' }
        },
        table: {
          autoFetch: false,
          onCustomAction,
          config: {
            columns: [{ prop: 'name', label: '名称' }]
          }
        },
        advanced: {
          messageApi: createMessageApi()
        }
      })
    )

    await hook.tableEventHandlers.onAction('view', { id: 2 }, 1)

    expect(onCustomAction).toHaveBeenCalledWith('view', { id: 2 }, 1)
  })

  it('详情接口失败时保留弹窗并提示错误', async () => {
    const messageApi = createMessageApi()
    const getApi = vi.fn().mockRejectedValue(new Error('detail failed'))

    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: vi.fn(),
          update: vi.fn(),
          get: getApi
        },
        form: {
          initialData: { id: 0, name: '' }
        },
        table: {
          autoFetch: false,
          config: {
            columns: []
          }
        },
        advanced: {
          messageApi
        }
      })
    )

    await hook.openDialog('edit', { id: 1 })
    await flushPromises()

    expect(hook.dialogVisible.value).toBe(true)
    expect(hook.formLoading.value).toBe(false)
    expect(messageApi.error).toHaveBeenCalledWith(expect.stringContaining('获取数据失败'))
  })

  it('提交失败时提示错误且不关闭弹窗', async () => {
    const messageApi = createMessageApi()
    const addApi = vi.fn().mockRejectedValue(new Error('submit failed'))
    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: addApi,
          update: vi.fn()
        },
        form: {
          initialData: { name: '' }
        },
        table: {
          autoFetch: false,
          config: {
            columns: []
          }
        },
        advanced: {
          messageApi
        }
      })
    )

    hook.formRef.value = createFormRef()
    hook.dialogVisible.value = true
    hook.formData.value = { name: 'Tom' }

    await hook.submitForm()
    await flushPromises()

    expect(messageApi.error).toHaveBeenCalledWith(expect.stringContaining('提交失败'))
    expect(hook.dialogVisible.value).toBe(true)
  })

  it('删除成功时执行 advanced.callbacks.onDeleteSuccess', async () => {
    const onDeleteSuccess = vi.fn()
    const messageApi = createMessageApi()
    messageApi.confirm.mockResolvedValue(true)
    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: vi.fn(),
          update: vi.fn(),
          delete: vi.fn().mockResolvedValue({ msg: '删除成功' })
        },
        form: {
          initialData: { name: '' }
        },
        table: {
          autoFetch: false,
          config: {
            columns: []
          }
        },
        advanced: {
          messageApi,
          callbacks: {
            onDeleteSuccess
          }
        }
      })
    )

    await hook.handleDelete({ id: 1, name: 'Tom' })
    await flushPromises()

    expect(onDeleteSuccess).toHaveBeenCalledWith({ id: 1, name: 'Tom' })
  })

  it('批量删除成功时执行 advanced.callbacks.onBatchDeleteSuccess', async () => {
    const onBatchDeleteSuccess = vi.fn()
    const messageApi = createMessageApi()
    messageApi.confirm.mockResolvedValue(true)
    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: vi.fn(),
          update: vi.fn(),
          batchDelete: vi.fn().mockResolvedValue({ msg: '批量删除成功' })
        },
        form: {
          initialData: { name: '' }
        },
        table: {
          autoFetch: false,
          config: {
            columns: []
          }
        },
        advanced: {
          messageApi,
          callbacks: {
            onBatchDeleteSuccess
          }
        }
      })
    )

    hook.tableData.value = [{ id: 1 }, { id: 2 }]
    hook.selectedRows.value = [{ id: 1 }]

    await hook.handleBatchDelete()
    await flushPromises()

    expect(onBatchDeleteSuccess).toHaveBeenCalledWith([{ id: 1 }], false)
  })

  it('无表格配置时 tableConfig 返回 null 且支持批量导入开关', () => {
    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: vi.fn(),
          update: vi.fn()
        },
        form: {
          initialData: { name: '' }
        },
        table: {
          autoFetch: false
        },
        advanced: {
          messageApi: createMessageApi()
        }
      })
    )

    expect(hook.tableConfig.value).toBeNull()
    expect(hook.importDialogVisible.value).toBe(false)

    hook.handleBatchImport()

    expect(hook.importDialogVisible.value).toBe(true)
  })

  it('没有自定义处理器时输出警告', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: vi.fn(),
          update: vi.fn()
        },
        form: {
          initialData: { name: '' }
        },
        table: {
          autoFetch: false
        },
        advanced: {
          messageApi: createMessageApi()
        }
      })
    )

    await hook.tableEventHandlers.onAction('view', { id: 1 }, 0)

    expect(warnSpy).toHaveBeenCalledWith('未找到事件 "view" 的处理器', {
      event: 'view',
      row: { id: 1 },
      index: 0
    })
  })

  it('导出时透传参数到 useTablePage 并处理数组与时间字段', () => {
    const exportApi = vi.fn()
    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: vi.fn(),
          update: vi.fn(),
          export: exportApi
        },
        form: {
          initialData: { name: '', tags: [] as string[] },
          beforeSubmit: (data) => ({
            ...data,
            extra: true
          }),
          afterGet: (data) => ({
            ...data,
            name: `${data.name}-detail`
          })
        },
        table: {
          autoFetch: false,
          config: {
            columns: [{ prop: 'name', label: '名称' }]
          }
        },
        search: {
          initialData: {
            tags: [] as string[],
            range: [] as string[]
          }
        },
        advanced: {
          arrayFields: ['tags'],
          timeFields: [{ field: 'range', prefix: { start: 'startAt', end: 'endAt' } }],
          messageApi: createMessageApi()
        }
      })
    )

    hook.searchParams.tags = ['Vue', 'React']
    hook.searchParams.range = ['2025-01-01', '2025-01-31']
    hook.selectedRows.value = [{ id: 1 }]
    hook.handleExport({ filename: 'users', params: { status: 1 } })

    expect(exportApi).toHaveBeenCalledWith({
      url: undefined,
      filename: 'users',
      params: {
        status: 1,
        tags: 'Vue,React',
        ids: [1],
        startAt: '2025-01-01',
        endAt: '2025-01-31'
      }
    })
  })

  it('表单转换链会先做 arrayFields 转换再执行 beforeSubmit，并在 afterGet 后回转数组', async () => {
    const addApi = vi.fn().mockResolvedValue({ msg: '保存成功' })
    const getApi = vi.fn().mockResolvedValue({
      data: {
        id: 1,
        name: 'Tom',
        tags: 'Vue,React'
      }
    })

    const hook = mountComposable(() =>
      useCrudPage({
        apis: {
          list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
          add: addApi,
          update: vi.fn(),
          get: getApi
        },
        form: {
          initialData: { id: 0, name: '', tags: [] as string[] },
          beforeSubmit: (data) => ({
            ...data,
            name: `${data.name}-submit`
          }),
          afterGet: (data) => ({
            ...data,
            name: `${data.name}-detail`
          })
        },
        table: {
          autoFetch: false,
          config: {
            columns: []
          }
        },
        advanced: {
          arrayFields: ['tags'],
          messageApi: createMessageApi()
        }
      })
    )

    hook.formRef.value = createFormRef()
    hook.formData.value = {
      id: 0,
      name: 'Jerry',
      tags: ['A', 'B']
    }

    await hook.submitForm()
    await flushPromises()
    await hook.openDialog('edit', { id: 1 })
    await flushPromises()

    expect(addApi).toHaveBeenCalledWith({
      id: 0,
      name: 'Jerry-submit',
      tags: 'A,B'
    })
    expect(hook.formData.value).toEqual({
      id: 1,
      name: 'Tom-detail',
      tags: ['Vue', 'React']
    })
  })
})
