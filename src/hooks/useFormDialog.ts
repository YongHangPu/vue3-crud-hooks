import { ref, nextTick, toRaw, type Ref } from 'vue'
import { to } from 'await-to-js'
import { useMessage } from './useMessage'
import type { FormDialogConfig, FormDialogHook } from '../types'

/**
 * 表单弹窗通用 Hook
 * @description 提供表单弹窗的完整功能，包括新增、编辑、验证、提交等
 * @template T 表单数据类型
 * @param config 表单弹窗配置选项
 * @returns 返回表单弹窗相关的状态和方法
 */
export const useFormDialog = <T = any>(config: FormDialogConfig<T>): FormDialogHook<T> => {
  // 弹窗显示状态
  const dialogVisible = ref(false)
  // 弹窗模式：新增或编辑
  const dialogMode = ref<'add' | 'edit'>('add')
  // 表单引用
  const formRef = ref()
  // 提交加载状态
  const submitLoading = ref(false)
  // 表单数据加载状态（编辑时获取数据）
  const formLoading = ref(false)

  // 深拷贝辅助函数
  const deepClone = (obj: any) => {
    if (typeof structuredClone === 'function') {
      return structuredClone(obj)
    }
    return JSON.parse(JSON.stringify(obj))
  }

  // 表单数据
  const formData = ref<T>(deepClone(config.initialFormData)) as Ref<T>

  // 消息提示封装
  const showMessage = useMessage(config.messageApi)

  /**
   * 打开弹窗
   * @description 根据模式打开新增或编辑弹窗，编辑模式下会自动获取数据
   * @param mode 弹窗模式：'add' 新增 | 'edit' 编辑
   * @param row 编辑时的行数据（包含id字段）
   */
  const openDialog = async (mode: 'add' | 'edit', row?: any) => {
    dialogMode.value = mode
    dialogVisible.value = true

    // 编辑模式且配置了获取API时，获取详细数据
    if (mode === 'edit' && config.getApi) {
      formLoading.value = true
      try {
        const id = row?.id !== undefined ? row.id : row
        const [err, res] = await to(config.getApi(id))
        if (!err) {
          // 如果配置了数据转换函数，先执行转换
          const data = config.dataTransform?.afterGet ? config.dataTransform.afterGet(res.data) : res.data
          formData.value = deepClone(data)
        } else {
          showMessage.error(`获取数据失败: ${err}`)
        }
      } finally {
        formLoading.value = false
      }
    }
  }

  /**
   * 提交表单
   * @description 执行表单验证、数据转换、API调用、成功回调等完整流程
   */
  const submitForm = async () => {
    // 表单验证
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitLoading.value = true
    try {
      // 数据转换（如果配置了beforeSubmit函数）
      const submitData = config.dataTransform?.beforeSubmit ? config.dataTransform.beforeSubmit(toRaw(formData.value)) : toRaw(formData.value)
      if (!submitData) {
        return
      }

      // 根据模式选择对应的API函数
      const apiFunction = dialogMode.value === 'add' ? config.addApi : config.updateApi
      const [err, res] = await to(apiFunction(submitData))

      if (err) {
        return showMessage.error(`提交失败: ${err}`)
      }

      // 显示成功消息
      showMessage.success(res.msg || '操作成功')

      // 执行自定义成功回调
      if (config.onSubmitSuccess) {
        try {
          await config.onSubmitSuccess(res, dialogMode.value, toRaw(formData.value))
        } catch (callbackError) {
          console.error('提交成功回调执行失败:', callbackError)
        }
      }

      // 关闭弹窗并执行通用成功回调
      handleDialogClose()
      config.onSuccess?.()
    } finally {
      submitLoading.value = false
    }
  }

  /**
   * 重置表单
   * @description 将表单数据重置为初始状态并清除验证状态
   */
  const resetForm = () => {
    formData.value = deepClone(config.initialFormData)
    nextTick(() => {
      formRef.value?.resetFields()
    })
  }

  /**
   * 关闭弹窗
   * @description 重置表单并关闭弹窗
   */
  const handleDialogClose = () => {
    resetForm()
    dialogVisible.value = false
  }

  return {
    dialogVisible, // 弹窗显示状态
    dialogMode, // 弹窗模式
    formRef, // 表单引用
    submitLoading, // 提交加载状态
    formLoading, // 表单数据加载状态
    formData, // 表单数据
    openDialog, // 打开弹窗方法
    submitForm, // 提交表单方法
    resetForm, // 重置表单方法
    handleDialogClose // 关闭弹窗方法
  }
}
