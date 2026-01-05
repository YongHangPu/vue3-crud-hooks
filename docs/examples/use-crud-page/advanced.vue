<template>
  <div class="demo-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <el-input
        v-model="searchParams.keyword"
        placeholder="请输入名称"
        clearable
        style="width: 200px"
      />
      <el-select v-model="searchParams.status" placeholder="状态" clearable style="width: 120px">
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-date-picker
        v-model="searchParams.createTime"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 240px"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="openDialog('add')">新增</el-button>
      <el-button
        type="danger"
        :disabled="!selection.length"
        @click="handleBatchDelete"
      >
        批量删除
      </el-button>
      <el-button type="warning" @click="handleExport">导出</el-button>
    </div>

    <!-- 表格区域 -->
    <CustomTable
      :config="cusTableConfig"
      :data="tableData"
      :loading="loading"
      @selection-change="tableEventHandlers.onSelectionChange"
      @pagination="tableEventHandlers.onPagination"
      @action="tableEventHandlers.onAction"
    >
      <!-- 自定义状态列 -->
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>

      <!-- 自定义标签列 -->
      <template #tags="{ row }">
        <el-tag
          v-for="tag in (row.tags ? row.tags.split(',') : [])"
          :key="tag"
          size="small"
          style="margin-right: 5px"
        >
          {{ tag }}
        </el-tag>
      </template>

      <!-- 自定义操作列 -->
      <template #action="{ row }">
        <el-button type="primary" link @click="openDialog('edit', row)">
          编辑
        </el-button>
        <el-button type="danger" link @click="handleDelete(row)">
          删除
        </el-button>
      </template>
    </CustomTable>

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入标签"
          >
            <el-option label="Vue" value="Vue" />
            <el-option label="React" value="React" />
            <el-option label="Angular" value="Angular" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="submitForm"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useCrudPage, CustomTable } from 'vue3-crud-hooks'
import { reactive } from 'vue'

// 模拟数据
let mockData = Array.from({ length: 20 }).map((_, index) => ({
  id: index + 1,
  name: `User ${index + 1}`,
  status: index % 2,
  // 模拟后端存储为字符串
  tags: ['Vue', 'React'].slice(0, (index % 2) + 1).join(','),
  createTime: '2025-01-01'
}))

// 模拟 API
const api = {
  getList: (params: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { pageNum, pageSize, keyword, status, startTime, endTime } = params
        let list = mockData
        if (keyword) {
          list = list.filter((item) => item.name.includes(keyword))
        }
        if (status !== undefined && status !== '') {
          list = list.filter((item) => item.status === status)
        }
        if (startTime && endTime) {
           // 简单模拟日期过滤
           list = list.filter(item => item.createTime >= startTime && item.createTime <= endTime)
        }

        const start = (pageNum - 1) * pageSize
        const end = start + pageSize
        resolve({
          rows: list.slice(start, end),
          total: list.length
        })
      }, 500)
    })
  },
  add: (data: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // data.tags 已经被 arrayFields 自动转换为字符串了
        console.log('提交的数据:', data)
        mockData.unshift({
          id: mockData.length + 1,
          ...data,
          createTime: new Date().toISOString().split('T')[0]
        })
        resolve({ msg: '添加成功' })
      }, 500)
    })
  },
  update: (data: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockData.findIndex((item) => item.id === data.id)
        if (index > -1) {
          mockData[index] = { ...mockData[index], ...data }
        }
        resolve({ msg: '更新成功' })
      }, 500)
    })
  },
  delete: (id: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockData = mockData.filter((item) => item.id !== id)
        resolve({ msg: '删除成功' })
      }, 500)
    })
  },
  batchDelete: (ids: any[]) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockData = mockData.filter((item) => !ids.includes(item.id))
        resolve({ msg: '批量删除成功' })
      }, 500)
    })
  },
  export: (params: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('导出参数:', params)
        alert('触发导出，参数请查看控制台')
        resolve({ msg: '导出成功' })
      }, 500)
    })
  }
}

// 表单规则
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  tags: [{ required: true, message: '请选择标签', trigger: 'change', type: 'array' }]
}

// 使用 useCrudPage
const {
  cusTableConfig,
  tableData,
  loading,
  selection,
  searchParams,
  tableEventHandlers,
  handleSearch,
  handleReset,
  handleDelete,
  handleBatchDelete,
  handleExport,
  dialogVisible,
  dialogMode,
  formData,
  formRef,
  submitLoading,
  openDialog,
  handleDialogClose,
  submitForm
} = useCrudPage({
  // 简化配置模式
  // 1. 接口配置
  apis: {
    list: api.getList,        // 列表接口
    add: api.add,             // 新增接口
    update: api.update,       // 更新接口
    delete: api.delete,       // 删除接口
    batchDelete: api.batchDelete, // 批量删除接口
    export: api.export        // 导出接口
  },
  // 2. 表格配置
  table: {
    // 挂载时自动获取数据 (默认 true)
    autoFetch: true,
    config: {
      selection: true,        // 开启多选
      index: { label: '序号', width: 60, align: 'center' }, // 序号列配置
      columns: [
        { prop: 'name', label: '名称', minWidth: 120 },
        { prop: 'status', label: '状态', width: 100, slotName: 'status' }, // 自定义状态列插槽
        { prop: 'tags', label: '标签', minWidth: 200, slotName: 'tags' },   // 自定义标签列插槽
        { prop: 'createTime', label: '创建时间', width: 180 },
        { prop: 'action', label: '操作', width: 150, slotName: 'action', fixed: 'right' } // 固定操作列
      ]
    }
  },
  // 3. 表单配置
  form: {
    // 弹窗表单初始数据
    initialData: {
      name: '',
      status: 1,
      tags: [] // 初始为空数组
    },
    rules
  },
  // 4. 搜索配置
  search: {
    // 搜索表单初始数据
    initialData: {
      keyword: '',
      status: undefined,
      createTime: [] // 时间范围数组
    }
  },
  // 5. 高级配置 (核心功能)
  advanced: {
    // 自动处理数组字段转换
    // 前端使用数组 ['Vue', 'React'] <-> 后端存储字符串 "Vue,React"
    arrayFields: ['tags'],

    // 自动处理时间范围字段拆分
    // 前端搜索/表单使用数组 [start, end] <-> 后端接收 { startTime, endTime }
    timeFields: [
      { field: 'createTime', prefix: { start: 'startTime', end: 'endTime' } }
    ],

    // 操作回调
    callbacks: {
      onDeleteSuccess: () => {
        handleSearch() // 删除后刷新
      },
      onBatchDeleteSuccess: () => {
        handleSearch() // 批量删除后刷新
      }
    }
  }
})
</script>

<style scoped>
.search-area {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>