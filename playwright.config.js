const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './src/tests',
  testMatch: ['**/*.spec.js', '**/*.test.js'],
  retries : 1,
  timeout: 40_000,
  expect: {
    timeout: 40_000,
  },
  reporter: [
    ['line'],
    ['html', { open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results', detail: false, suiteTitle: false }],
  ],
  use: {
    browserName: 'chromium',
    headless: isCI ? true : false,
    trace: 'retain-on-failure',
    screenshot: 'on',
    viewport: { width: 420, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: isCI ? true : false,
        trace: 'retain-on-failure',
        screenshot: 'on',
        viewport: { width: 420, height: 800 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        headless: isCI ? true : false,
        trace: 'retain-on-failure',
        screenshot: 'on',
        viewport: { width: 420, height: 800 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        headless: isCI ? true : false,
        trace: 'retain-on-failure',
        screenshot: 'on',
        viewport: { width: 420, height: 800 },
      },
    },
  ],
});
