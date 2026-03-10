import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

const envTest = dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3005',
    ...devices['iPhone 13'],
    viewport: { width: 375, height: 812 },
  },
  webServer: {
    command: 'npm run build && npm run start -- -p 3005',
    port: 3005,
    reuseExistingServer: true,
    env: {
      ...envTest.parsed,
      PLAYWRIGHT_TEST: '1',
    },
  },
})
