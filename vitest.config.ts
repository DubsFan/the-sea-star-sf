import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    setupFiles: ['tests/setup/env.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 80,
      },
      include: [
        'lib/scheduler.ts',
        'lib/mailer.ts',
        'lib/publisher.ts',
        'lib/social-post.ts',
        'lib/activity.ts',
        'lib/ai.ts',
        'lib/recurrence.ts',
        'lib/publish-workflow.ts',
      ],
    },
  },
})
