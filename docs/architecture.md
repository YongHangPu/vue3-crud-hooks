# 项目架构

本文从源码结构、模块职责和运行时调用关系三个角度说明 `vue3-crud-hooks` 的设计。

## 项目架构图

```text
vue3-crud-hooks
|
+-- src/index.ts
|   |
|   +-- 导出 hooks
|   |   +-- useCrudPage
|   |   +-- useTablePage
|   |   +-- useFormDialog
|   |   +-- useDataTransform
|   |   +-- useMessage
|   |   +-- useTableHeight
|   |
|   +-- 导出组件
|   |   +-- CustomTable.vue
|   |   +-- Pagination.vue
|   |
|   +-- 导出类型与工具
|
+-- hooks
|   |
|   +-- useCrudPage
|   |   +-- 组合 useTablePage
|   |   +-- 组合 useFormDialog
|   |   +-- 组合 useDataTransform
|   |   +-- 产出页面级 CRUD 能力
|   |
|   +-- useTablePage
|   |   +-- 列表请求
|   |   +-- 分页/搜索
|   |   +-- 删除/批量删除
|   |   +-- 导出
|   |   +-- 生成 CustomTable 配置
|   |
|   +-- useFormDialog
|   |   +-- 弹窗状态
|   |   +-- 详情回显
|   |   +-- 表单提交
|   |
|   +-- useDataTransform
|   |   +-- 数组/字符串转换
|   |   +-- 时间范围拆分
|   |   +-- 空值清理
|   |
|   +-- useMessage
|       +-- Element Plus 消息适配
|       +-- 自定义 messageApi 适配
|
|   +-- useTableHeight
|       +-- 纯计算函数 calculateTableMaxHeight
|       +-- ResizeObserver / resize / watchSources 重算
|       +-- 容器基准(容器被 flex 约束时按容器可用空间计算)
|
+-- components
|   |
|   +-- CustomTable.vue
|   |   +-- 基于 el-table
|   |   +-- 配置驱动列渲染
|   |   +-- 统一 action / pagination 事件
|   |
|   +-- Pagination.vue
|       +-- 基于 el-pagination
|       +-- 分页事件透传
|
+-- types
|   |
|   +-- table.ts
|   +-- form.ts
|   +-- crud.ts
|   +-- common.ts
|
+-- utils
|   |
|   +-- response.ts
|   |   +-- 嵌套包装响应解析(支持 { code, data: { records, total } })
|   |   +-- 业务成功判断(code ∈ [0, 200, 1, '0', '200', '1'],可自定义 isSuccess)
|   |   +-- 响应消息提取(message/msg 兼容)
|   |
|   +-- index.ts
|   |   +-- addDateRange(日期范围写入 params.params 子对象)
|   |
|   +-- scroll-to.ts
|
+-- docs
    |
    +-- hooks 文档
    +-- examples 示例
    +-- architecture.md 架构说明
```

## 调用关系图

### 1. useCrudPage 页面级组合

```text
业务页面
  |
  +-- useCrudPage(config)
        |
        +-- useTablePage(...)
        |     +-- 获取 tableData / pageInfo / tableEventHandlers
        |
        +-- useFormDialog(...)
        |     +-- 获取 dialogVisible / formData / submitForm
        |
        +-- useDataTransform()
        |     +-- beforeSubmit / afterGet 自动转换
        |
        +-- 返回
              +-- tableConfig
              +-- tableEventHandlers
              +-- tableData / loading / searchParams
              +-- dialogVisible / dialogMode / formData
              +-- openDialog / submitForm / handleDelete / handleExport
```

### 2. 列表查询链路

```text
用户触发搜索 / 分页
  |
  +-- useTablePage.getTableData()
        |
        +-- 合并 pageInfo + searchParams
        +-- useDataTransform.processTimeRange() / arrayToString()
        +-- beforeSearch()(返回 false/null 阻止请求)
        +-- fetchData(requestParams)
        |     +-- 请求序号竞态防护:过期响应/错误/loading 一律丢弃
        +-- isBusinessSuccess()(业务码校验,失败走错误分支并展示后端消息)
        +-- transformResponse()? / parseResult()(支持嵌套包装 { code, data: { records, total } })
        +-- 更新 tableData / pageInfo.total
        +-- 失败时 useMessage.error()
```

### 3. 编辑弹窗链路

```text
用户点击编辑
  |
  +-- CustomTable action
        |
        +-- tableEventHandlers.onAction('edit', row)
              |
              +-- useCrudPage -> useFormDialog.openDialog('edit', row)
                    |
                    +-- 若配置 getApi:
                    |     +-- 根据 idKey 取主键
                    |     +-- getApi(id)
                    |     +-- afterGet()
                    |     +-- 填充 formData
                    |
                    +-- 若未配置 getApi:
                          +-- 直接用 row 回显
```

### 4. 提交链路

```text
用户点击提交
  |
  +-- useFormDialog.submitForm()
        |
        +-- formRef.validate()
        +-- beforeSubmit()
        +-- addApi() / updateApi()
        +-- isBusinessSuccess()(业务失败不提示成功)
        +-- useMessage.success() / useMessage.error()
        +-- onSubmitSuccess()(弹窗未关闭,可访问响应数据)
        +-- handleDialogClose()
        +-- onAfterSubmit()(弹窗已关闭,useCrudPage 中默认刷新列表)
```

### 5. 导出链路

```text
用户点击导出
  |
  +-- useCrudPage.handleExport()
        |
        +-- useTablePage.handleExport()
              |
              +-- 合并 searchParams + selectedIds + options.params
              +-- 时间范围拆分 / 数组转字符串
              +-- 优先调用 exportFunction()
              +-- 否则使用 exportUrl 生成浏览器下载链接
```

## 设计特点

- 以 `useTablePage` 为底座，负责列表类状态和行为。
- 以 `useFormDialog` 为编辑能力模块，独立处理弹窗表单。
- 以 `useCrudPage` 做组合层，降低业务页面接入成本。
- 以 `CustomTable` 做最小展示封装，避免把业务逻辑写进组件。
- 以 `types` 作为 API 契约层，保证 hooks 和组件之间的边界清晰。
