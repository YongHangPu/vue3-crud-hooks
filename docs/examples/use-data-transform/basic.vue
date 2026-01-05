<template>
  <div class="transform-demo">
    <el-tabs type="border-card">
      <!-- 1. 数组与字符串转换 -->
      <el-tab-pane label="数组/字符串转换">
        <div class="demo-section">
          <h3>数组转字符串 (arrayToString)</h3>
          <p class="desc">常用于将多选框数组值转换为逗号分隔字符串提交给后端。</p>

          <el-form :model="arrayForm" label-width="120px">
            <el-form-item label="原始数据">
              <el-checkbox-group v-model="arrayForm.tags">
                <el-checkbox label="Vue" value="Vue" />
                <el-checkbox label="React" value="React" />
                <el-checkbox label="Angular" value="Angular" />
                <el-checkbox label="Node" value="Node" />
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="转换结果">
              <el-tag type="success">{{ arrayToStringResult }}</el-tag>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleArrayToString">执行转换</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <h3>字符串转数组 (stringToArray)</h3>
          <p class="desc">常用于将后端返回的逗号分隔字符串转换为数组回显。</p>

          <el-form :model="stringForm" label-width="120px">
            <el-form-item label="原始字符串">
              <el-input v-model="stringForm.tagsStr" placeholder="输入逗号分隔的字符串，如: Vue,React" />
            </el-form-item>
            <el-form-item label="转换结果">
              <el-tag
                v-for="tag in stringToArrayResult"
                :key="tag"
                style="margin-right: 5px"
              >
                {{ tag }}
              </el-tag>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleStringToArray">执行转换</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 2. 时间范围处理 -->
      <el-tab-pane label="时间范围处理">
        <div class="demo-section">
          <h3>时间范围拆分 (processTimeRange)</h3>
          <p class="desc">将数组格式的时间范围 [start, end] 拆分为两个独立字段。</p>

          <el-form :model="timeForm" label-width="120px">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="timeForm.dateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </el-form-item>
            <el-form-item label="自定义字段">
               <el-input v-model="timeConfig.start" placeholder="开始字段名 (默认 begin...)" style="width: 200px; margin-right: 10px" />
               <el-input v-model="timeConfig.end" placeholder="结束字段名 (默认 end...)" style="width: 200px" />
            </el-form-item>
            <el-form-item label="转换结果">
              <pre class="code-block">{{ timeRangeResult }}</pre>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleTimeProcess">执行转换</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 3. 空值清理 -->
      <el-tab-pane label="空值清理">
        <div class="demo-section">
          <h3>清理空字段 (cleanEmptyFields)</h3>
          <p class="desc">移除对象中值为空字符串、null 或 undefined 的字段。</p>

          <el-form :model="emptyForm" label-width="120px">
            <el-form-item label="姓名 (有值)">
              <el-input v-model="emptyForm.name" />
            </el-form-item>
            <el-form-item label="年龄 (空字符串)">
              <el-input v-model="emptyForm.age" placeholder="留空测试" />
            </el-form-item>
            <el-form-item label="备注 (null)">
              <el-tag type="info">null</el-tag>
            </el-form-item>
            <el-form-item label="转换结果">
              <pre class="code-block">{{ cleanResult }}</pre>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleClean">执行清理</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <h3>深度清理 (deepCleanEmptyFields)</h3>
          <p class="desc">递归清理嵌套对象和数组中的空值。</p>
          <div class="code-block">
            原始数据: {{ JSON.stringify(deepObj, null, 2) }}
          </div>
          <div style="margin: 10px 0;">
            <el-button type="primary" @click="handleDeepClean">执行深度清理</el-button>
          </div>
          <div class="code-block">
            结果: {{ JSON.stringify(deepCleanResult, null, 2) }}
          </div>
        </div>
      </el-tab-pane>

      <!-- 4. 数字转换 -->
      <el-tab-pane label="数字转换">
        <div class="demo-section">
          <h3>数字类型转换 (convertNumbers)</h3>
          <p class="desc">将字符串类型的数字转换为真正的 Number 类型。</p>

          <el-form :model="numberForm" label-width="120px">
            <el-form-item label="年龄 (String)">
              <el-input v-model="numberForm.age" type="number" />
            </el-form-item>
            <el-form-item label="价格 (String)">
              <el-input v-model="numberForm.price" type="number" />
            </el-form-item>
            <el-form-item label="转换结果">
              <pre class="code-block">{{ numberResult }}</pre>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleConvertNumber">执行转换</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useDataTransform, deepCleanEmptyFields } from 'vue3-crud-hooks'

const {
  arrayToString,
  stringToArray,
  processTimeRange,
  cleanEmptyFields,
  convertNumbers
} = useDataTransform()

// 1. 数组/字符串转换
const arrayForm = reactive({
  tags: ['Vue', 'React']
})
const arrayToStringResult = ref('')

const handleArrayToString = () => {
  // 转换 tags 字段
  const res = arrayToString(arrayForm, ['tags'])
  console.log('转换结果:', res)
  arrayToStringResult.value = JSON.stringify(res)
}

const stringForm = reactive({
  tagsStr: 'Java,Python,Go'
})
const stringToArrayResult = ref<string[]>([])

const handleStringToArray = () => {
  // 转换 tagsStr 字段
  const res = stringToArray(stringForm, ['tagsStr'])
  console.log('转换结果:', res)
  stringToArrayResult.value = res.tagsStr
}

// 2. 时间范围处理
const timeForm = reactive({
  dateRange: ['2024-01-01', '2024-01-31']
})
const timeConfig = reactive({
  start: '',
  end: ''
})
const timeRangeResult = ref('')

const handleTimeProcess = () => {
  const config = (timeConfig.start && timeConfig.end)
    ? { start: timeConfig.start, end: timeConfig.end }
    : undefined // 不传则使用默认规则

  // 处理 dateRange 字段
  const res = processTimeRange(timeForm, 'dateRange', config)
  timeRangeResult.value = JSON.stringify(res, null, 2)
}

// 3. 空值清理
const emptyForm = reactive({
  name: 'John',
  age: '',
  desc: null,
  other: undefined
})
const cleanResult = ref('')

const handleClean = () => {
  const res = cleanEmptyFields(emptyForm)
  cleanResult.value = JSON.stringify(res, null, 2)
}

// 深度清理演示数据
const deepObj = {
  name: 'Project',
  tags: ['', null, 'Vue'], // 数组中包含空值
  meta: {
    version: '1.0',
    author: '', // 嵌套空值
    license: null
  }
}
const deepCleanResult = ref<any>(null)

const handleDeepClean = () => {
  deepCleanResult.value = deepCleanEmptyFields(deepObj)
}

// 4. 数字转换
const numberForm = reactive({
  age: '18',
  price: '99.9'
})
const numberResult = ref('')

const handleConvertNumber = () => {
  const res = convertNumbers(numberForm, ['age', 'price'])
  numberResult.value = JSON.stringify(res, null, 2) +
    `\n\nTypes:\nage: ${typeof res.age}\nprice: ${typeof res.price}`
}
</script>

<style scoped>
.transform-demo {
  padding: 10px;
}
.demo-section {
  padding: 10px;
}
.desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}
.code-block {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  margin: 0;
}
</style>
