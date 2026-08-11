import { h, defineComponent } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ElementPlus, { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'
import { ElementPlusContainer } from '@vitepress-demo-preview/component'
import '@vitepress-demo-preview/component/dist/style.css'
import 'element-plus/dist/index.css'
// Element Plus 暗色模式 CSS 变量（自动响应 <html class="dark">）
import 'element-plus/theme-chalk/dark/css-vars.css'
// 导入库组件样式（按钮间距、分页布局等）
// VitePress 模式下直接通过 custom.css 加载，此处不再额外引入
import './custom.css'

// 包装 ElementPlusContainer：插件会传入 suffixName/absolutePath/relativePath 等文件路径属性，
// 但 ElementPlusContainer 渲染 Fragment，无法继承这些非 prop 属性，Vue 会报警告。
// 将这些属性声明为 props 让 Vue 知道它们是预期的，不再视为外来属性。
const DemoPreview = defineComponent({
  props: {
    title: String,
    description: String,
    code: String,
    showCode: String,
    // 以下三个是插件注入的文件路径属性，仅用于展示定位，组件本身不需要处理
    suffixName: String,
    absolutePath: String,
    relativePath: String,
  },
  setup(props, { slots }) {
    // 将有效属性传递给 ElementPlusContainer
    return () => h(ElementPlusContainer, {
      title: props.title,
      description: props.description,
      code: props.code,
      showCode: props.showCode,
    }, slots)
  },
})

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(ElementPlus)
    // element-plus 在 SSR(vitepress 构建)下渲染弹窗等组件需要 id/z-index provider,否则报 IdInjection/ZIndexInjection 警告
    app.provide(ID_INJECTION_KEY, { prefix: 100, current: 0 })
    app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
    app.component('demo-preview', DemoPreview)
  },
} satisfies Theme
