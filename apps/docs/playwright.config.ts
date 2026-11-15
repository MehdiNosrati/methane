import { defineConfig, devices } from '@playwright/test';

const DOCS_URL = process.env['DOCS_URL'];

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    ...(process.env['CI'] ? {} : { channel: 'chrome' }),
    baseURL: DOCS_URL ?? 'http://127.0.0.1:3105/methane/',
    trace: 'on-first-retry',
  },
  ...(DOCS_URL
    ? {}
    : {
        webServer: {
          command:
            'pnpm --filter @methane/docs exec astro preview --port 3105 --host 127.0.0.1 --ignore-lock',
          url: 'http://127.0.0.1:3105/methane/',
          reuseExistingServer: !process.env['CI'],
        },
      }),
});
