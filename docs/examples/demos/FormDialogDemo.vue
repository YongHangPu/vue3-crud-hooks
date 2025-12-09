<template>
  <div style="display:flex; gap:12px; margin-bottom:12px;">
    <el-button type="primary" @click="openDialog('add')">新增</el-button>
    <el-button @click="openDialog('edit', { id: 1 })">编辑 ID=1</el-button>
  </div>
  <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增' : '编辑'" width="500">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="88px" v-loading="formLoading">
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="年龄" prop="age">
        <el-input-number v-model="formData.age" :min="1" :max="120" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleDialogClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitForm">提交</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
/**
 * 示例组件：表单弹窗 Hook 演示
 * 功能：演示 useFormDialog 的新增/编辑/校验/提交流程
 * 参数：无
 * 返回值：无（SFC 组件）
 */
import { useFormDialog } from '@/hooks/useFormDialog'

/**
 * 表单规则常量
 * 功能：定义 Element Plus 表单校验规则
 * 取值范围：名称必填；年龄为数字且必填
 */
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  age: [{ required: true, type: 'number', message: '请输入年龄', trigger: 'change' }]
}

/**
 * 模拟新增接口
 * @param data 表单数据
 * @returns Promise<{ msg: string }>
 */
const addApi = async (data: { name: string; age: number }): Promise<{ msg: string }> =>
  new Promise(resolve => setTimeout(() => resolve({ msg: `新增成功：${data.name}` }), 300))

/**
 * 模拟更新接口
 * @param data 表单数据
 * @returns Promise<{ msg: string }>
 */
const updateApi = async (data: { name: string; age: number }): Promise<{ msg: string }> =>
  new Promise(resolve => setTimeout(() => resolve({ msg: `更新成功：${data.name}` }), 300))

/**
 * 模拟获取单条数据接口
 * @param id 数据 ID
 * @returns Promise<{ data: { name: string; age: number } }>
 */
const getApi = async (id: number): Promise<{ data: { name: string; age: number } }> =>
  new Promise(resolve => setTimeout(() => resolve({ data: { name: `用户-${id}`, age: 20 } }), 300))

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
} = useFormDialog<{ name: string; age: number }>({
  initialFormData: { name: '', age: 18 },
  addApi,
  updateApi,
  getApi,
  formRules: rules,
  onSuccess: () => {},
  onSubmitSuccess: (res) => {},
  dataTransform: {
    beforeSubmit: (data) => data,
    afterGet: (data) => data
  }
})
</script>

<style scoped>
/* 常量说明：该样式用于示例布局与间距控制 */
</style>

