---
layout: home

hero:
  name: "vue3-crud-hooks"
  text: "Vue3 CRUD 工具库"
  tagline: 精简、可复用的增删改查页面方案
  actions:
    - theme: brand
      text: API 参考
      link: /reference/use-table-page
    - theme: alt
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 综合 CRUD
      link: /reference/use-crud-page

features:
  - title: 列表页（useTablePage）
    details: 分页、搜索、删除、导出一站式封装
  - title: 弹窗表单（useFormDialog）
    details: 新增/编辑/校验/提交全流程处理
  - title: 数据转换（useDataTransform）
    details: 数组/字符串互转，时间范围、空值清理
  - title: 综合 CRUD（useCrudPage）
    details: 统一配置驱动页面，简化集成与迁移
---

## 项目理念

- 组合式：以 Hooks 为中心，将页面能力拆解为独立模块进行组合
- 配置驱动：通过直观配置即可完成页面常见功能，减少模板代码
- 最小 API：仅暴露必要的状态与方法，降低使用与维护成本
- 可插拔：与 Element Plus 等 UI 库无侵入集成，支持代码预览

## 为什么选择本方案

- 提效：列表/弹窗/导出等通用场景开箱即用，减少重复编码
- 规范：统一数据结构与交互流程，降低团队协作摩擦
- 可维护：核心逻辑集中在 Hooks，扩展与重构成本小

## 与其他方式对比

- 传统手写页面
  - 每个页面都重复实现分页、搜索、删除等逻辑
  - 代码分散在多个组件中，复用难、维护成本高
- 本方案（Vue3 CRUD Hooks）
  - 通用逻辑封装在 Hooks，页面只关心配置与展示
  - 文档内置预览与示例，可直接复制与改造
