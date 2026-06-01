import { ElMessage, ElMessageBox } from 'element-plus'
import type { MessageApi } from '../types'

/**
 * 消息提示 Hook
 * @description 统一管理消息提示逻辑，支持自定义消息 API
 * @param customMessageApi 自定义消息 API
 * @returns 标准化的消息提示方法
 */
export const useMessage = (customMessageApi?: Partial<MessageApi>) => {
  const success = (msg: string) => {
    if (customMessageApi?.success) {
      customMessageApi.success(msg)
      return
    }
    ElMessage.success(msg)
  }

  const error = (msg: string) => {
    if (customMessageApi?.error) {
      customMessageApi.error(msg)
      return
    }
    ElMessage.error(msg)
  }

  const warning = (msg: string) => {
    if (customMessageApi?.warning) {
      customMessageApi.warning(msg)
      return
    }
    ElMessage.warning(msg)
  }

  const confirm = (msg: string, title = '提示', options?: any) => {
    if (customMessageApi?.confirm) {
      return customMessageApi.confirm(msg, title, options)
    }
    return ElMessageBox.confirm(msg, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      ...options
    })
  }

  return {
    success,
    error,
    warning,
    confirm
  }
}
