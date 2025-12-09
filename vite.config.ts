import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    // 自动生成 TypeScript 类型声明文件 (.d.ts)
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
    lib: {
      // 入口文件
      entry: resolve(__dirname, 'src/index.ts'),
      // 库名称（UMD/IIFE 模式下全局变量名）
      name: 'Vue3CrudHooks',
      // 输出文件名格式
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
      // 输出格式：ES Module 和 CommonJS
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      // 这些依赖应该由使用该库的项目提供
      external: ['vue', 'element-plus', 'await-to-js'],
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
