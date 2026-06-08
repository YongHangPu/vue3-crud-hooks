import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mountComposable } from './helpers/mountComposable'
import { useFormDialog } from '@/hooks/useFormDialog'

describe('useFormDialog', () => {
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

  it('编辑模式支持通过 idKey 拉取详情并执行 afterGet 转换', async () => {
    const messageApi = createMessageApi()
    const getApi = vi.fn().mockResolvedValue({
      data: {
        uuid: 'u-1',
        name: 'Tom',
        tags: 'Vue,React'
      }
    })

    const hook = mountComposable(() =>
      useFormDialog({
        initialFormData: { uuid: '', name: '', tags: [] as string[] },
        idKey: 'uuid',
        addApi: vi.fn(),
        updateApi: vi.fn(),
        getApi,
        messageApi,
        dataTransform: {
          afterGet: (data) => ({
            ...data,
            tags: data.tags.split(',')
          })
        }
      })
    )

    await hook.openDialog('edit', { uuid: 'u-1' })
    await flushPromises()

    expect(getApi).toHaveBeenCalledWith('u-1')
    expect(hook.dialogVisible.value).toBe(true)
    expect(hook.formLoading.value).toBe(false)
    expect(hook.formData.value).toEqual({
      uuid: 'u-1',
      name: 'Tom',
      tags: ['Vue', 'React']
    })
  })

  it('编辑模式未配置 getApi 时直接使用行数据回显并清理校验状态', async () => {
    const hook = mountComposable(() =>
      useFormDialog({
        initialFormData: { id: 0, name: '', status: 1 },
        addApi: vi.fn(),
        updateApi: vi.fn()
      })
    )
    const formRef = createFormRef()
    hook.formRef.value = formRef

    await hook.openDialog('edit', { id: 1, name: 'Jerry' })
    await nextTick()

    expect(hook.formData.value).toEqual({
      id: 1,
      name: 'Jerry',
      status: 1
    })
    expect(formRef.clearValidate).toHaveBeenCalled()
  })

  it('新增模式打开时重置表单数据并清理校验状态', async () => {
    const hook = mountComposable(() =>
      useFormDialog({
        initialFormData: { id: 0, name: '', status: 1 },
        addApi: vi.fn(),
        updateApi: vi.fn()
      })
    )
    const formRef = createFormRef()
    hook.formRef.value = formRef
    hook.formData.value = { id: 9, name: 'stale', status: 0 }

    await hook.openDialog('add')
    await nextTick()

    expect(hook.formData.value).toEqual({ id: 0, name: '', status: 1 })
    expect(formRef.clearValidate).toHaveBeenCalled()
  })

  it('编辑详情回显时会合并 initialFormData，避免缺失字段', async () => {
    const getApi = vi.fn().mockResolvedValue({
      data: {
        id: 1,
        name: 'Tom'
      }
    })
    const hook = mountComposable(() =>
      useFormDialog({
        initialFormData: { id: 0, name: '', status: 1, tags: [] as string[] },
        addApi: vi.fn(),
        updateApi: vi.fn(),
        getApi
      })
    )
    const formRef = createFormRef()
    hook.formRef.value = formRef

    await hook.openDialog('edit', { id: 1 })
    await flushPromises()
    await nextTick()

    expect(hook.formData.value).toEqual({
      id: 1,
      name: 'Tom',
      status: 1,
      tags: []
    })
    expect(formRef.clearValidate).toHaveBeenCalled()
  })

  it('新增提交成功时执行 beforeSubmit、onSubmitSuccess 和 onAfterSubmit', async () => {
    const addApi = vi.fn().mockResolvedValue({ msg: '保存成功' })
    const onSubmitSuccess = vi.fn()
    const onAfterSubmit = vi.fn()
    const messageApi = createMessageApi()
    const hook = mountComposable(() =>
      useFormDialog({
        initialFormData: { name: '', tags: [] as string[] },
        addApi,
        updateApi: vi.fn(),
        onSubmitSuccess,
        onAfterSubmit,
        messageApi,
        dataTransform: {
          beforeSubmit: (data) => ({
            ...data,
            tags: data.tags.join(',')
          })
        }
      })
    )
    const formRef = createFormRef()
    hook.formRef.value = formRef
    hook.formData.value = {
      name: 'Tom',
      tags: ['Vue', 'React']
    }
    hook.dialogVisible.value = true

    await hook.submitForm()
    await flushPromises()

    expect(addApi).toHaveBeenCalledWith({
      name: 'Tom',
      tags: 'Vue,React'
    })
    expect(messageApi.success).toHaveBeenCalledWith('保存成功')
    expect(onSubmitSuccess).toHaveBeenCalledWith(
      { msg: '保存成功' },
      'add',
      { name: 'Tom', tags: ['Vue', 'React'] }
    )
    expect(onAfterSubmit).toHaveBeenCalled()
    expect(hook.dialogVisible.value).toBe(false)
    expect(formRef.resetFields).toHaveBeenCalled()
  })

  it('编辑模式下提交时调用 updateApi 并执行成功回调', async () => {
    const updateApi = vi.fn().mockResolvedValue({ msg: '更新成功' })
    const onSubmitSuccess = vi.fn()
    const onAfterSubmit = vi.fn()
    const messageApi = createMessageApi()
    const hook = mountComposable(() =>
      useFormDialog({
        initialFormData: { id: 0, name: '' },
        addApi: vi.fn(),
        updateApi,
        onSubmitSuccess,
        onAfterSubmit,
        messageApi
      })
    )
    const formRef = createFormRef()
    hook.formRef.value = formRef
    hook.dialogVisible.value = true
    hook.dialogMode.value = 'edit'
    hook.formData.value = { id: 1, name: 'Updated' }

    await hook.submitForm()
    await flushPromises()

    expect(updateApi).toHaveBeenCalledWith({ id: 1, name: 'Updated' })
    expect(messageApi.success).toHaveBeenCalledWith('更新成功')
    expect(onSubmitSuccess).toHaveBeenCalledWith(
      { msg: '更新成功' },
      'edit',
      { id: 1, name: 'Updated' }
    )
    expect(onAfterSubmit).toHaveBeenCalled()
    expect(hook.dialogVisible.value).toBe(false)
  })

  it('提交 API 失败时提示错误且不关闭弹窗', async () => {
    const addApi = vi.fn().mockRejectedValue(new Error('submit error'))
    const messageApi = createMessageApi()
    const hook = mountComposable(() =>
      useFormDialog({
        initialFormData: { name: '' },
        addApi,
        updateApi: vi.fn(),
        messageApi
      })
    )
    const formRef = createFormRef()
    hook.formRef.value = formRef
    hook.dialogVisible.value = true
    hook.formData.value = { name: 'Tom' }

    await hook.submitForm()
    await flushPromises()

    expect(messageApi.error).toHaveBeenCalledWith('提交失败: Error: submit error')
    expect(hook.dialogVisible.value).toBe(true)
  })

  it('表单校验失败时不提交接口', async () => {
    const addApi = vi.fn()
    const hook = mountComposable(() =>
      useFormDialog({
        initialFormData: { name: '' },
        addApi,
        updateApi: vi.fn()
      })
    )

    hook.formRef.value = {
      validate: vi.fn().mockRejectedValue(new Error('invalid'))
    }

    await hook.submitForm()

    expect(addApi).not.toHaveBeenCalled()
  })
})
