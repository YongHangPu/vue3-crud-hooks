import type { Ref } from 'vue'
import type { MessageApi } from './common'

/**
 * 表单弹窗 Hook 返回值接口
 */
export interface FormDialogHook<T = any> {
  dialogVisible: Ref<boolean>
  dialogMode: Ref<'add' | 'edit'>
  formRef: Ref<any>
  submitLoading: Ref<boolean>
  formLoading: Ref<boolean>
  formData: Ref<T>
  openDialog: (mode: 'add' | 'edit', row?: any) => Promise<void>
  submitForm: () => Promise<void>
  resetForm: () => void
  handleDialogClose: () => void
}

/**
 * 表单弹窗配置接口
 * @interface FormDialogConfig
 * @template T 表单数据类型
 */
export interface FormDialogConfig<T = any> {
  /** 表单初始数据 */
  initialFormData: T
  /** 新增数据的API函数 */
  addApi: (data: T) => Promise<any>
  /** 更新数据的API函数 */
  updateApi: (data: T) => Promise<any>
  /** 获取单条数据的API函数（可选，编辑时使用） */
  getApi?: (id: string | number) => Promise<any>
  /** 表单验证规则（可选） */
  formRules?: any
  /** 提交成功后的通用回调（可选，通常用于刷新列表） */
  onSuccess?: () => void
  /** 提交成功后的自定义回调（可选，可访问API响应数据） */
  onSubmitSuccess?: (response: any, mode: 'add' | 'edit', formData: T) => Promise<void> | void
  /** 数据转换配置（可选） */
  dataTransform?: {
    /** 提交前数据转换函数 */
    beforeSubmit?: (data: T) => any
    /** 获取后数据转换函数 */
    afterGet?: (data: any) => T
  }
  /** 自定义消息提示配置 */
  messageApi?: Partial<MessageApi>
}
