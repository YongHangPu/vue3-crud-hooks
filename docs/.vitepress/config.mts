import { componentPreview, containerPreview } from '@vitepress-demo-preview/plugin'
import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/vue3-crud-hooks/',
  title: 'vue3-crud-hooks',
  description: '基于 Vue 3 和 Element Plus 的 CRUD 工具库',
  lastUpdated: true,

  markdown: {
    config(md) {
      md.use(componentPreview)
      md.use(containerPreview)
    },
  },

  themeConfig: {
    logo: false,

    nav: [
      { text: '首页', link: '/' },
      { text: '架构', link: '/architecture' },
      {
        text: 'Hooks',
        items: [
          { text: 'useCrudPage', link: '/hooks/use-crud-page' },
          { text: 'useTablePage', link: '/hooks/use-table-page' },
          { text: 'useFormDialog', link: '/hooks/use-form-dialog' },
          { text: 'useDataTransform', link: '/hooks/use-data-transform' },
          { text: 'useMessage', link: '/hooks/use-message' },
        ]
      },
      {
        text: '组件',
        items: [
          { text: 'CustomTable', link: '/components/custom-table' },
          { text: 'Pagination', link: '/components/pagination' },
        ]
      },
      {
        text: 'GitHub',
        link: 'https://github.com/YongHangPu/vue3-crud-hooks'
      }
    ],

    sidebar: [
      {
        text: '介绍',
        items: [
          { text: '快速开始', link: '/' },
          { text: '架构说明', link: '/architecture' }
        ]
      },
      {
        text: 'Hooks',
        items: [
          { text: 'useCrudPage（综合 CRUD）', link: '/hooks/use-crud-page' },
          { text: 'useTablePage（列表管理）', link: '/hooks/use-table-page' },
          { text: 'useFormDialog（表单弹窗）', link: '/hooks/use-form-dialog' },
          { text: 'useDataTransform（数据转换）', link: '/hooks/use-data-transform' },
          { text: 'useMessage（消息提示）', link: '/hooks/use-message' },
        ]
      },
      {
        text: '组件',
        items: [
          { text: 'CustomTable', link: '/components/custom-table' },
          { text: 'Pagination', link: '/components/pagination' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/YongHangPu/vue3-crud-hooks' }
    ],

    footer: {
      message: 'MIT License',
      copyright: 'Copyright © 2025 YongHangPu'
    }
  }
})
