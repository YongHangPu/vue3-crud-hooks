import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.ts'],
      restoreMocks: true,
      clearMocks: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        reportsDirectory: './coverage',
        include: ['src/**/*.ts', 'src/**/*.vue'],
        exclude: [
          'src/index.ts',
          'src/**/*.d.ts',
          'src/types/**/*.ts',
          'src/utils/index.ts'
        ]
      }
    }
  })
)
