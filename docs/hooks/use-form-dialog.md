# useFormDialog

独立的表单弹窗 Hook，专注于处理弹窗表单的逻辑。提供了表单状态管理、新增/编辑模式切换、数据回显、数据转换、表单验证和提交处理等完整功能。

当你的页面比较复杂，或者弹窗逻辑独立于列表时（例如单独的配置弹窗、嵌套弹窗），使用 `useFormDialog` 是最佳选择。

## 基础用法

最基本的用法，处理一个简单的新增/编辑弹窗。

::: preview
demo-preview=../examples/use-form-dialog/basic.vue
:::

## 高级用法

展示了以下高级特性：
1. **异步获取详情**：编辑时传入 ID，自动调用 `getApi` 拉取最新数据，并自动处理 loading 状态。
2. **数据转换**：
    *   `beforeSubmit`: 提交前将前端格式转换为后端格式（如数组转字符串）。
    *   `afterGet`: 获取详情后将后端格式转换为前端格式（如字符串转数组）。

::: preview
demo-preview=../examples/use-form-dialog/advanced.vue
:::

## API

### 参数 (FormDialogConfig)

`useFormDialog` 接受一个配置对象作为参数。

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `initialFormData` | **(必填)** 表单初始数据对象 | `T` | - |
| `addApi` | 新增接口函数 | `(data: T) => Promise<any>` | - |
| `updateApi` | 更新接口函数 | `(data: T) => Promise<any>` | - |
| `getApi` | 获取详情接口函数（编辑模式下使用） | `(id: any) => Promise<any>` | - |
| `dataTransform` | 数据转换配置 | `DataTransformConfig` | - |
| `onSuccess` | 提交成功并关闭弹窗后的回调（通常用于刷新列表） | `() => void` | - |
| `onSubmitSuccess` | 提交接口调用成功后的回调（此时弹窗未关闭） | `(res: any, mode: 'add' \| 'edit', formData: T) => void` | - |
| `messageApi` | 自定义消息提示实现 | `MessageApi` | ElMessage |

### 数据转换配置 (DataTransformConfig)

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `beforeSubmit` | 提交前转换数据，返回的数据将发送给后端 | `(data: T) => any` |
| `afterGet` | 获取详情后转换数据，返回的数据将填充表单 | `(data: any) => T` |

### 返回值 (FormDialogHook)

Hook 返回的对象包含以下属性和方法：

| 属性/方法 | 说明 | 类型 |
| --- | --- | --- |
| `dialogVisible` | 弹窗显示状态（双向绑定） | `Ref<boolean>` |
| `dialogMode` | 当前弹窗模式 | `Ref<'add' \| 'edit'>` |
| `formData` | 表单数据对象（响应式） | `Ref<T>` |
| `formRef` | 表单组件引用（需绑定到 el-form 的 ref） | `Ref<any>` |
| `submitLoading` | 提交按钮 loading 状态 | `Ref<boolean>` |
| `formLoading` | 表单加载状态（获取详情时） | `Ref<boolean>` |
| `openDialog` | 打开弹窗的方法 | `(mode: 'add' \| 'edit', row?: any) => Promise<void>` |
| `submitForm` | 提交表单的方法 | `() => Promise<void>` |
| `handleDialogClose` | 关闭弹窗的方法（会自动重置表单） | `() => void` |
| `resetForm` | 重置表单的方法 | `() => void` |

### openDialog 详解

`openDialog(mode, row)` 是控制弹窗的核心方法：

*   **新增模式 (`mode='add'`)**:
    *   重置表单为 `initialFormData`。
    *   清除验证状态。
    *   打开弹窗。

*   **编辑模式 (`mode='edit'`)**:
    *   设置 `dialogMode` 为 `'edit'`。
    *   **情况 1：配置了 `getApi`**
        *   从 `row` 中获取 `id`（支持 `row.id` 或 `row` 本身即为 ID）。
        *   设置 `formLoading` 为 true。
        *   调用 `getApi(id)`。
        *   调用 `afterGet` 转换数据（如有）。
        *   填充 `formData`。
    *   **情况 2：未配置 `getApi`**
        *   直接使用 `row` 数据填充 `formData`。
        *   自动合并 `initialFormData` 以确保字段完整。

## 最佳实践

1.  **类型定义**: 建议为表单数据定义 TypeScript 接口，并传入 Hook 泛型中，这样 `formData` 会有完善的类型提示。
2.  **验证清理**: Hook 内部在打开弹窗时会自动尝试清理验证 (`clearValidate`)，但确保你的 `el-form` 正确绑定了 `ref="formRef"`。
3.  **深拷贝**: Hook 内部在初始化和重置时会自动深拷贝 `initialFormData`，你无需担心对象引用问题。
