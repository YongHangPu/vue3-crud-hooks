---
title: useFormDialog
---

# useFormDialog

- 功能：提供新增/编辑弹窗的完整流程（获取、校验、提交、关闭）
- 适用：需要快速构建带校验与提交流程的弹窗表单

## 演示

:::preview 表单弹窗 Hook || 新增/编辑/校验/提交演示
demo-preview=../examples/demos/FormDialogDemo.vue
:::

## API

- 入参 `FormDialogConfig<T>`
  - `initialFormData: T` 初始表单数据
  - `addApi(data): Promise<any>` 新增接口
  - `updateApi(data): Promise<any>` 更新接口
  - `getApi?(id): Promise<any>` 编辑时获取单条数据
  - `formRules?` 表单规则
  - `onSuccess?()` 提交成功后的通用回调（常用于刷新列表）
  - `onSubmitSuccess?(res, mode, formData)` 自定义成功回调（可访问响应与模式）
  - `dataTransform?` 数据转换（`beforeSubmit`/`afterGet`）

- 返回
  - `dialogVisible, dialogMode, formRef, submitLoading, formLoading, formData`
  - 方法：`openDialog, submitForm, resetForm, handleDialogClose`

### 结构化参考

- 状态
  - `dialogVisible` / `dialogMode`
  - `formRef`
  - `submitLoading` / `formLoading`
  - `formData`
- 方法
  - `openDialog(mode: 'add'|'edit', payload?)`
  - `submitForm()`
  - `resetForm()`
  - `handleDialogClose()`
- 事件
  - 提交成功：`onSuccess()` 与 `onSubmitSuccess(res, mode, formData)`
- 类型
  - `FormDialogConfig<T>`

## 使用要点

- 配合 `Element Plus` 表单：在 `submitForm` 内执行 `formRef.validate`
- 数据转换：在提交与获取阶段分别可进行数据映射

## 常见问题

- 验证失败：`formRef.validate()` 返回 false 时不应继续提交，检查规则与触发时机。
- 编辑数据未回显：确认 `getApi` 返回数据结构与 `afterGet` 转换逻辑匹配。
- 提交后不刷新：确保传入 `onSuccess` 并执行列表刷新方法。

## 更多资源

- 示例索引：/demos
- 相关：/hooks/use-table-page、/hooks/use-data-transform、/hooks/use-crud-page

## 快速上手

```ts
/**
 * 最小示例：新增/编辑弹窗
 * 功能：演示基本配置与返回值
 */
import { useFormDialog } from 'vue3-crud-hooks'

const addApi = async (data: any) => ({ msg: '新增成功' })
const updateApi = async (data: any) => ({ msg: '更新成功' })
const getApi = async (id: number) => ({ data: { id, name: '示例', age: 18 } })

const {
  dialogVisible,
  dialogMode,
  formRef,
  submitLoading,
  formLoading,
  formData,
  openDialog,
  submitForm,
  resetForm,
  handleDialogClose
} = useFormDialog({
  initialFormData: { name: '', age: 18 },
  addApi,
  updateApi,
  getApi,
  formRules: { name: [{ required: true, message: '请输入名称' }] },
  onSuccess: () => {}
})
```

```vue
<template>
  <el-button type="primary" @click="openDialog('add')">新增</el-button>
  <el-button @click="openDialog('edit', { id: 1 })">编辑</el-button>
  <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增' : '编辑'">
    <el-form ref="formRef" :model="formData" :rules="{ name: [{ required: true, message: '请输入名称' }] }">
      <el-form-item label="名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleDialogClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitForm">提交</el-button>
    </template>
  </el-dialog>
  </template>
```

## 进阶用法

```ts
/**
 * 进阶：数据转换与自定义成功回调
 */
import { useFormDialog } from 'vue3-crud-hooks'

const addApi = async (data: any) => ({ msg: '新增成功' })
const updateApi = async (data: any) => ({ msg: '更新成功' })
const getApi = async (id: number) => ({ data: { id, name: '示例', age: 18, tags: 'A、B' } })

const hook = useFormDialog({
  initialFormData: { name: '', age: 18, tags: [] },
  addApi,
  updateApi,
  getApi,
  dataTransform: {
    beforeSubmit: (data) => ({ ...data, name: String(data.name).trim() }),
    afterGet: (data) => ({ ...data, tags: data.tags ? data.tags.split('、') : [] })
  },
  onSubmitSuccess: (res, mode, formData) => { /* 记录埋点或联动其他模块 */ },
  onSuccess: () => {}
})
```

## 最佳实践

- 校验触发：统一在 `submitForm` 内调用 `formRef.validate`，并在规则中设置 `trigger: 'blur'|'change'`
- 字段归一化：在 `beforeSubmit` 中做字符串去空格、类型转换与枚举校验
```ts
const hook = useFormDialog({
  initialFormData: { name: '', price: 0 },
  addApi,
  updateApi,
  dataTransform: {
    beforeSubmit: (d) => ({ ...d, name: d.name.trim(), price: Number(d.price) })
  }
})
```
- 编辑模式保护：编辑时可根据 `dialogMode` 控制只读字段，避免关键字段被修改
- 提交联动：在 `onSuccess` 中触发列表刷新或关闭弹窗，保持交互一致性
