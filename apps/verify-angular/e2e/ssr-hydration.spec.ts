import { test } from '@playwright/test';
import { assertSsrDsdAndHydrationPurity } from '../../verify-next/e2e/assertions.js';

test('Angular 19 SSR DSD and interactive zero-error client hydration', async ({ page }) => {
  await assertSsrDsdAndHydrationPurity(page, {
    path: '/',
    expectedMarkerText: 'Methane Angular 19 SSR + Reactive Forms Verification',
    expectedTypedValue: 'angular-hydrated@methane.dev',
    interactiveStateTestId: 'form-snapshot',
  });
});
