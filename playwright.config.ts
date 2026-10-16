import { defineConfig, devices } from '@playwright/test';

/** E2E against the production build (vite preview). Run `npm run build` first. */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173/maths-practice/',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/maths-practice/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone-webkit', use: { ...devices['iPhone 14'] } },
    { name: 'tablet-webkit', use: { ...devices['iPad Pro 11 landscape'] } },
    { name: 'phone-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
