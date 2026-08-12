import { ref, computed, nextTick, toRaw, type Ref } from 'vue'
import { to } from 'await-to-js'
import { useMessage } from './useMessage'
import { getResponseMessage, isBusinessSuccess } from '../utils/response'
import type { FormDialogConfig, FormDialogHook } from '../types'

/**
 * 表单弹窗通用 Hook
 * @description 提供表单弹窗的完整功能，包括新增、编辑、验证、提交等
 * @template T 表单数据类型
 * @param config 表单弹窗配置选项
 * @returns 返回表单弹窗相关的状态和方法
 */
export const useFormDialog = <T = any>(config: FormDialogConfig<T>): FormDialogHook<T> => {
  const idKey = config.idKey || 'id'
  // 弹窗显示状态
  const dialogVisible = ref(false)
  // 弹窗模式：新增或编辑
  const dialogMode = ref<'add' | 'edit'>('add')
  // 表单引用
  const formRef = ref()
  // 表单验证规则(响应式,可直接绑定到 el-form 的 :rules)
  const formRules = computed(() => config.formRules)
  // 提交加载状态
  const submitLoading = ref(false)
  // 表单数据加载状态（编辑时获取数据）
  const formLoading = ref(false)

  /**
   * 深拷贝辅助函数
   * @description 优先使用 structuredClone，降级到 JSON 序列化
   * @param obj 需要拷贝的对象（如果传入 Vue Proxy，先 toRaw 解包）
   * @returns 深拷贝后的对象
   */
  const deepClone = (obj: any) => {
    // undefined/null 直接返回,避免 JSON 回退时 JSON.parse(JSON.stringify(undefined)) 抛错
    if (obj === undefined || obj === null) {
      return obj
    }
    const raw = toRaw(obj)
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(raw)
      } catch {
        // structuredClone 可能因 Proxy/Function/Symbol 等无法克隆的值而失败
        return JSON.parse(JSON.stringify(raw))
      }
    }
    return JSON.parse(JSON.stringify(raw))
  }

  // 表单初始数据:优先 initialData(新命名),回退 initialFormData(兼容旧命名)
  const initialFormData = (config.initialData ?? config.initialFormData ?? {}) as T

  // 表单数据
  const formData = ref<T>(deepClone(initialFormData)) as Ref<T>

  // 消息提示封装
  const showMessage = useMessage(config.messageApi)

  const clearValidation = () => {
    nextTick(() => {
      formRef.value?.clearValidate?.()
    })
  }

  /**
   * 打开弹窗
   * @description 根据模式打开新增或编辑弹窗，编辑模式下会自动获取数据
   * @param mode 弹窗模式：'add' 新增 | 'edit' 编辑
   * @param row 编辑时的行数据（包含id字段）
   */
  const openDialog = async (mode: 'add' | 'edit', row?: any) => {
    dialogMode.value = mode
    dialogVisible.value = true

    if (mode === 'add') {
      formData.value = deepClone(initialFormData)
      clearValidation()
      return
    }

    // 编辑模式处理
    if (config.getApi) {
      // 配置了获取API时，通过API获取详细数据
      formLoading.value = true
      try {
        // 防御:row 为对象时取主键字段;row 为原始值(id)时直接使用;两者都缺失时给出提示
        const rowId = row !== null && typeof row === 'object' ? row?.[idKey] : row
        if (rowId === undefined) {
          showMessage.error(`编辑回显失败:未找到主键字段 "${idKey}"`)
          dialogVisible.value = false
          return
        }
        const [err, res] = await to(config.getApi(rowId))
        if (!err && isBusinessSuccess(res, config.isSuccess)) {
          // 合并 initialFormData，避免详情接口返回字段不全时污染表单结构
          const data = config.dataTransform?.afterGet ? config.dataTransform.afterGet(res.data) : res.data
          formData.value = {
            ...deepClone(initialFormData),
            ...deepClone(data)
          }
          clearValidation()
        } else {
          // 网络错误或业务失败(code 非成功)统一按获取失败处理
          showMessage.error(err ? `获取数据失败: ${err}` : getResponseMessage(res, '获取数据失败'))
          // 获取数据失败时关闭弹窗，避免展示空白表单
          dialogVisible.value = false
        }
      } finally {
        formLoading.value = false
      }
    } else if (row) {
      // 未配置获取API但有行数据时，直接使用行数据回显
      // 合并 initialFormData 和 row，确保字段完整性
      formData.value = { ...deepClone(initialFormData), ...deepClone(row) }
      clearValidation()
    } else {
      formData.value = deepClone(initialFormData)
      clearValidation()
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

      // 业务失败判断:HTTP 200 但业务 code 非成功时,不提示成功
      if (!isBusinessSuccess(res, config.isSuccess)) {
        return showMessage.error(getResponseMessage(res, '提交失败'))
      }

      // 显示成功消息
      showMessage.success(getResponseMessage(res, '操作成功'))

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
      try {
        config.onAfterSubmit?.()
      } catch (callbackError) {
        console.error('提交成功回调执行失败:', callbackError)
      }
    } finally {
      submitLoading.value = false
    }
  }

  /**
   * 重置表单
   * @description 将表单数据重置为初始状态并清除验证状态
   */
  const resetForm = () => {
    formData.value = deepClone(initialFormData)
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

  /**
   * @property dialogVisible 弹窗显示状态
   * @property dialogMode 弹窗模式 'add' | 'edit'
   * @property formRef 表单组件引用（需手动绑定到 el-form）
   * @property submitLoading 提交操作加载状态
   * @property formLoading 表单数据加载状态（编辑回显时）
   * @property formData 表单数据
   * @property openDialog 打开弹窗
   * @property submitForm 提交表单
   * @property resetForm 重置表单
   * @property handleDialogClose 关闭弹窗
   */
  return {
    dialogVisible,
    dialogMode,
    formRef,
    formRules,
    submitLoading,
    formLoading,
    formData,
    openDialog,
    submitForm,
    resetForm,
    handleDialogClose
  }
}
