<template>
  <div style="display: flex; gap: 12px; align-items: center;">
    <el-button type="primary" @click="onClick">主要按钮</el-button>
    <el-switch v-model="checked" />
    <el-tag v-if="checked" type="success">已开启</el-tag>
    <el-tag v-else type="info">已关闭</el-tag>
  </div>
  <el-alert title="Element Plus 组件示例" type="success" :closable="false" style="margin-top: 12px;" />
</template>

<script lang="ts" setup>
/**
 * 示例组件：展示 Element Plus 组件与交互
 * 功能：演示 `ElButton`、`ElSwitch`、`ElTag`、`ElAlert` 的基本用法
 * 参数：无（示例组件仅用于文档预览）
 * 返回值：无（SFC 组件）
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 状态：`checked` 表示开关状态（true/false）
 * 取值范围：布尔值，默认 `false`
 */
const checked = ref(false)

/**
 * 事件处理：按钮点击时弹出消息提示
 * @returns void
 */
const onClick = () => {
  ElMessage.success(`当前状态：${checked.value ? '已开启' : '未开启'}`)
}
</script>

<style scoped>
/* 常量说明：该样式用于示例布局与间距控制 */
</style>

