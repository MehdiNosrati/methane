import { defineConfig, devices } from '@playwright/test';

const RUN_WEBSERVERS = process.env['METHANE_E2E_SERVERS'] === '1';

export default defineConfig({
  testDir: './apps',
  testMatch: '**/e2e/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'verify-next',
      testMatch: /verify-next\/e2e\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env['VERIFY_NEXT_URL'] ?? 'http://127.0.0.1:3101',
      },
    },
    {
      name: 'verify-nuxt',
      testMatch: /verify-nuxt\/e2e\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env['VERIFY_NUXT_URL'] ?? 'http://127.0.0.1:3102',
      },
    },
    {
      name: 'verify-angular',
      testMatch: /verify-angular\/e2e\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env['VERIFY_ANGULAR_URL'] ?? 'http://127.0.0.1:3103',
      },
    },
    {
      name: 'verify-sveltekit',
      testMatch: /verify-sveltekit\/e2e\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env['VERIFY_SVELTEKIT_URL'] ?? 'http://127.0.0.1:3104',
      },
    },
  ],
  ...(RUN_WEBSERVERS
    ? {
        webServer: [
          {
            command: 'pnpm --filter @methane/verify-next exec next start -p 3101 -H 127.0.0.1',
            env: { NEXT_TELEMETRY_DISABLED: '1' },
            port: 3101,
            reuseExistingServer: !process.env['CI'],
          },
          {
            command: 'PORT=3102 HOST=127.0.0.1 node apps/verify-nuxt/.output/server/index.mjs',
            env: { NUXT_TELEMETRY_DISABLED: '1' },
            port: 3102,
            reuseExistingServer: !process.env['CI'],
          },
          {
            command: 'PORT=3103 HOST=127.0.0.1 node apps/verify-angular/dist/node-server/http-server.js',
            port: 3103,
            reuseExistingServer: !process.env['CI'],
          },
          {
            command: 'PORT=3104 HOST=127.0.0.1 ORIGIN=http://127.0.0.1:3104 node apps/verify-sveltekit/build/index.js',
            port: 3104,
            reuseExistingServer: !process.env['CI'],
          },
        ],
      }
    : {}),
});
