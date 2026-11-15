import { test } from '@playwright/test';
import { assertSsrDsdAndHydrationPurity } from '../../verify-next/e2e/assertions.js';

test('Nuxt 3 SSR DSD and interactive zero-error client hydration', async ({ page }) => {
  await assertSsrDsdAndHydrationPurity(page, {
    path: '/',
    expectedMarkerText: 'Verify Nuxt',
    expectedTypedValue: 'nuxt-hydrated@methane.dev',
    interactiveStateTestId: 'nuxt-state',
  });
});
