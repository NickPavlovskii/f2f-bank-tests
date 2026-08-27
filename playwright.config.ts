import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE } from './tests/helpers/test-data';

/**
 * Проекты:
 * - setup      — один раз логин → playwright/.auth/user.json
 * - logged-out — регистрация, логин, гостевой доступ
 * - logged-in  — logout + API с storageState
 */
export default defineConfig({
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /logged-in\/login\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'logged-out',
      testDir: './tests/logged-out',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'logged-in',
      testDir: './tests/logged-in',
      testMatch: /\/(logout|api)\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
    },
  ],
});
