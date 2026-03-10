import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../..'),
    },
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    setupFiles: [path.resolve(__dirname, '../setup/env.ts')],
    include: ['tests/verification/**/*.test.ts'],
    exclude: ['node_modules/**'],
  },
})
