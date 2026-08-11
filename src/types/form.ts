import type { Ref } from 'vue'
import type { ApiResponse, MessageApi } from './common'

/**
 * 表单弹窗 Hook 返回值接口
 * @template T 表单数据类型
 */
export interface FormDialogHook<T = any> {
  /** 弹窗显示状态 */
  dialogVisible: Ref<boolean>
  /** 弹窗模式：'add' 新增 | 'edit' 编辑 */
  dialogMode: Ref<'add' | 'edit'>
  /** el-form 组件引用 */
  formRef: Ref<any>
  /** 提交操作加载状态 */
  submitLoading: Ref<boolean>
  /** 编辑回显数据加载状态 */
  formLoading: Ref<boolean>
  /** 表单数据 */
  formData: Ref<T>
  /** 打开弹窗 */
  openDialog: (mode: 'add' | 'edit', row?: any) => Promise<void>
  /** 提交表单（验证 + 转换 + API） */
  submitForm: () => Promise<void>
  /** 重置表单 */
  resetForm: () => void
  /** 关闭弹窗（重置表单并隐藏） */
  handleDialogClose: () => void
}

/**
 * 表单弹窗配置接口
 * @interface FormDialogConfig
 * @template T 表单数据类型
 */
export interface FormDialogConfig<T = any> {
  /** 表单初始数据(推荐,与 CrudPageConfig.form.initialData 命名一致) */
  initialData?: T
  /** 表单初始数据(兼容旧名称,与 initialData 二选一,优先 initialData) */
  initialFormData?: T
  /** 主键字段名，编辑态获取详情时使用，默认为 'id' */
  idKey?: string
  /** 新增数据的API函数 */
  addApi: (data: T) => Promise<ApiResponse<any>>
  /** 更新数据的API函数 */
  updateApi: (data: T) => Promise<ApiResponse<any>>
  /** 获取单条数据的API函数（可选，编辑时使用） */
  getApi?: (id: any) => Promise<ApiResponse<T>>
  /** 表单验证规则（可选） */
  formRules?: any
  /** 提交成功后弹窗关闭时的回调（可选，通常用于刷新列表） */
  onAfterSubmit?: () => void
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
  /** 业务成功判断函数,默认自动识别 code 字段 */
  isSuccess?: (result: any) => boolean
}
