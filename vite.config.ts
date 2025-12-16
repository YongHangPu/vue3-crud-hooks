import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [
    vue(),
    dts({
      // 指定需要生成类型的目录
      include: ['src'],
      tsconfigPath: './tsconfig.json',
      outDir: 'dist',
      // 是否生成类型入口文件
      insertTypesEntry: true,
    })
  ],
  build: {
    // 库模式构建配置
    minify: false,
    lib: {
      // 入口文件
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        useTablePage: resolve(__dirname, 'src/hooks/useTablePage.ts'),
        useFormDialog: resolve(__dirname, 'src/hooks/useFormDialog.ts'),
        useCrudPage: resolve(__dirname, 'src/hooks/useCrudPage.ts'),
        useDataTransform: resolve(__dirname, 'src/hooks/useDataTransform.ts'),
        useMessage: resolve(__dirname, 'src/hooks/useMessage.ts'),
        CustomTable: resolve(__dirname, 'src/components/CustomTable.vue'),
        Pagination: resolve(__dirname, 'src/components/Pagination.vue')
      },
      // 输出格式：ES Module 和 CommonJS
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`
    },
    rollupOptions: {
      // 这些依赖应该由使用该库的项目提供
      external: ['vue', /element-plus/, 'await-to-js'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          'await-to-js': 'to'
        }
      }
    }
  }
})
