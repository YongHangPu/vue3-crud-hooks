# useFormDialog

独立表单弹窗 Hook，提供 **新增/编辑模式切换、详情回显、表单验证、数据转换、提交** 全流程管理。

适合弹窗逻辑独立于列表的场景（如配置弹窗、嵌套弹窗）。

## 基础用法

::: preview
demo-preview=../examples/use-form-dialog/basic.vue
:::

## API 参考

### 入参

```typescript
useFormDialog<T = any>(config: FormDialogConfig<T>): FormDialogHook<T>
```

#### FormDialogConfig

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `initialData` | `T` | ✅ | 表单初始数据（推荐命名，与 `CrudPageConfig.form.initialData` 一致） |
| `initialFormData` | `T` | — | 兼容旧名称，与 `initialData` 二选一，`initialData` 优先 |
| `addApi` | `(data: T) => Promise<any>` | — | 新增接口 |
| `updateApi` | `(data: T) => Promise<any>` | — | 更新接口 |
| `getApi` | `(id) => Promise<any>` | — | 获取详情接口（编辑时自动回显） |
| `idKey` | `string` | — | 主键字段名，默认 `'id'` |
| `formRules` | `any` | — | Element Plus 表单校验规则（通过返回的 `formRules` 绑定到 `el-form` 的 `:rules`） |
| `onAfterSubmit` | `() => void` | — | 提交成功后回调（弹窗已关闭） |
| `onSubmitSuccess` | `(res, mode, formData) => void` | — | API 成功回调（弹窗未关闭） |
| `dataTransform` | `DataTransformConfig` | — | 提交前/获取后数据转换 |
| `messageApi` | `Partial<MessageApi>` | — | 自定义消息提示 |

### 返回值

| 返回值 | 类型 | 说明 |
|-------|------|------|
| `dialogVisible` | `Ref<boolean>` | 弹窗显示状态（支持 v-model） |
| `dialogMode` | `Ref<'add' \| 'edit'>` | 弹窗模式 |
| `formData` | `Ref<T>` | 表单数据 |
| `formRef` | `Ref` | el-form 引用（需手动绑定） |
| `formRules` | `ComputedRef` | 表单校验规则（绑定到 el-form 的 `:rules`） |
| `submitLoading` | `Ref<boolean>` | 提交按钮加载状态 |
| `formLoading` | `Ref<boolean>` | 编辑回显加载状态（getApi 时） |
| `openDialog` | `(mode, row?) => Promise<void>` | 打开弹窗 |
| `submitForm` | `() => Promise<void>` | 提交表单 |
| `resetForm` | `() => void` | 重置表单 |
| `handleDialogClose` | `() => void` | 关闭弹窗（自动重置表单） |

## 详细说明

### openDialog 行为

**新增模式 `openDialog('add')`**：
- 重置 `formData` 为 `initialFormData` 的深拷贝
- 清除表单验证状态
- 打开弹窗

**编辑模式 `openDialog('edit', row)`**：

| 条件 | 行为 |
|------|------|
| 配置了 `getApi` | 从 `row` 中提取主键 → 调用 `getApi(id)` → `afterGet` 转换 → 填充 `formData` |
| 未配置 `getApi` 但有 `row` | 直接合并 `initialFormData` 和 `row` 回显 |
| 未配置 `getApi` 且无 `row` | 同新增模式，用空白表单打开 |

### submitForm 流程

1. **表单验证**：调用 `formRef.validate()`
2. **数据转换**：执行 `dataTransform.beforeSubmit`
3. **API 调用**：根据 `dialogMode` 选择 `addApi` / `updateApi`
4. **成功回调**：执行 `onSubmitSuccess`（弹窗未关闭）
5. **关闭弹窗**：`handleDialogClose` → `resetForm` → `dialogVisible = false`
6. **全局回调**：执行 `onAfterSubmit`

## 高级用法：数据转换

通过 `dataTransform` 可自动处理前端与后端的数据格式差异：

| 钩子 | 时机 | 示例用途 |
|------|------|---------|
| `beforeSubmit` | 提交前 | 数组 `join(',')`、boolean 转 1/0、日期格式化 |
| `afterGet` | 回显时 | 字符串 `split(',')` 转数组、1/0 转 boolean |

::: preview
demo-preview=../examples/use-form-dialog/advanced.vue
:::

## 最佳实践

1. **类型泛型**：传入泛型参数使 `formData` 获得完整类型推断
2. **formRef 绑定**：记得将 `formRef` 绑定到 `<el-form ref="formRef">`
3. **深拷贝**：`initialFormData` 在初始化时会被深拷贝，无需担心引用问题
