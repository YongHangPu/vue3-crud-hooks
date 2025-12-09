<template>
  <div style="display:flex; gap:12px; align-items:flex-start;">
    <div style="flex:1;">
      <el-card header="输入">
        <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
          <el-input v-model="form.tagsInput" placeholder="标签（逗号分隔）" />
          <el-date-picker v-model="form.range" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" />
        </div>
        <div>
          <el-button type="primary" @click="toString">数组转字符串</el-button>
          <el-button @click="toArray">字符串转数组</el-button>
          <el-button type="success" @click="applyTime">应用时间范围</el-button>
          <el-button type="warning" @click="clean">清理空值</el-button>
        </div>
      </el-card>
    </div>
    <div style="flex:1;">
      <el-card header="输出">
        <pre>{{ output }}</pre>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 示例组件：数据转换 Hook 演示
 * 功能：演示 useDataTransform 的数组/字符串转换、时间范围处理、空值清理
 * 参数：无
 * 返回值：无（SFC 组件）
 */
import { useDataTransform } from '@/hooks/useDataTransform'

/**
 * 表单状态类型定义
 * 功能：描述输入数据结构
 * 取值范围：tagsInput 字符串；range 日期范围数组
 */
type FormState = { tagsInput: string; range: any[] }

const form = reactive<FormState>({ tagsInput: 'A,B,C', range: [] })
const output = ref<any>({})

const { arrayToString, stringToArray, processTimeRange, cleanEmptyFields, convertNumbers } = useDataTransform()

/**
 * 转换：数组转字符串
 * @returns void
 */
const toString = () => {
  const data = { tags: form.tagsInput.split(',') }
  output.value = arrayToString(data, ['tags'], '、')
}

/**
 * 转换：字符串转数组
 * @returns void
 */
const toArray = () => {
  const data = { tags: 'A、B、C' }
  output.value = stringToArray(data, ['tags'], '、')
}

/**
 * 转换：应用时间范围
 * @returns void
 */
const applyTime = () => {
  const params = { range: form.range }
  output.value = processTimeRange(params, 'range', { start: 'beginTime', end: 'endTime' })
}

/**
 * 转换：清理空值
 * @returns void
 */
const clean = () => {
  const params = { a: '', b: null, c: undefined, d: 0, e: 'x' }
  output.value = cleanEmptyFields(params)
}
</script>

<style scoped>
/* 常量说明：该样式用于示例布局与间距控制 */
</style>

