import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  successSpy: vi.fn(),
  errorSpy: vi.fn(),
  warningSpy: vi.fn(),
  confirmSpy: vi.fn()
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: mocks.successSpy,
    error: mocks.errorSpy,
    warning: mocks.warningSpy
  },
  ElMessageBox: {
    confirm: mocks.confirmSpy
  }
}))

import { useMessage } from '@/hooks/useMessage'

describe('useMessage', () => {
  beforeEach(() => {
    mocks.successSpy.mockReset()
    mocks.errorSpy.mockReset()
    mocks.warningSpy.mockReset()
    mocks.confirmSpy.mockReset()
  })

  it('默认使用 Element Plus 的消息方法', async () => {
    mocks.confirmSpy.mockResolvedValue('confirm')
    const message = useMessage()

    message.success('ok')
    message.error('fail')
    message.warning('warn')
    await message.confirm('确认吗')

    expect(mocks.successSpy).toHaveBeenCalledWith('ok')
    expect(mocks.errorSpy).toHaveBeenCalledWith('fail')
    expect(mocks.warningSpy).toHaveBeenCalledWith('warn')
    expect(mocks.confirmSpy).toHaveBeenCalledWith(
      '确认吗',
      '提示',
      expect.objectContaining({
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    )
  })

  it('自定义 messageApi 时优先使用自定义实现', async () => {
    const custom = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      confirm: vi.fn().mockResolvedValue(true)
    }
    const message = useMessage(custom)

    message.success('ok')
    message.error('fail')
    message.warning('warn')
    await message.confirm('确认吗')

    expect(custom.success).toHaveBeenCalledWith('ok')
    expect(custom.error).toHaveBeenCalledWith('fail')
    expect(custom.warning).toHaveBeenCalledWith('warn')
    expect(custom.confirm).toHaveBeenCalledWith('确认吗', '提示', undefined)
    expect(mocks.successSpy).not.toHaveBeenCalled()
    expect(mocks.errorSpy).not.toHaveBeenCalled()
    expect(mocks.warningSpy).not.toHaveBeenCalled()
    expect(mocks.confirmSpy).not.toHaveBeenCalled()
  })
})
