import { ElMessage, ElMessageBox } from 'element-plus'
import type { MessageApi } from '../types'

/**
 * 消息提示 Hook
 * @description 统一管理消息提示逻辑，支持自定义消息 API
 * @param customMessageApi 自定义消息 API
 * @returns 标准化的消息提示方法
 */
export const useMessage = (customMessageApi?: Partial<MessageApi>) => {
  /**
   * 成功提示
   * @param msg 提示消息
   */
  const success = (msg: string) => {
    if (customMessageApi?.success) {
      customMessageApi.success(msg)
      return
    }
    ElMessage.success(msg)
  }

  /**
   * 错误提示
   * @param msg 提示消息
   */
  const error = (msg: string) => {
    if (customMessageApi?.error) {
      customMessageApi.error(msg)
      return
    }
    ElMessage.error(msg)
  }

  /**
   * 警告提示
   * @param msg 提示消息
   */
  const warning = (msg: string) => {
    if (customMessageApi?.warning) {
      customMessageApi.warning(msg)
      return
    }
    ElMessage.warning(msg)
  }

  /**
   * 确认弹窗
   * @param msg 确认消息
   * @param title 弹窗标题，默认 '提示'
   * @param options 额外配置
   * @returns 用户确认时 resolve，取消时 reject
   */
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
