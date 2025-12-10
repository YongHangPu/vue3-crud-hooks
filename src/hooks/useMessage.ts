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
    customMessageApi?.success?.(msg) ?? ElMessage.success(msg)
  }

  const error = (msg: string) => {
    customMessageApi?.error?.(msg) ?? console.error(msg)
  }

  const warning = (msg: string) => {
    customMessageApi?.warning?.(msg) ?? ElMessage.warning(msg)
  }

  const confirm = (msg: string, title = '提示', options?: any) => {
    return customMessageApi?.confirm?.(msg, title, options) ?? ElMessageBox.confirm(msg, title, {
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
