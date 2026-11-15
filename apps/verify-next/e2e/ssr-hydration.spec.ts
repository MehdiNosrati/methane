import { test } from '@playwright/test';
import { assertSsrDsdAndHydrationPurity } from './assertions.js';

test('Next 15 SSR DSD and zero-mutation client hydration', async ({ page }) => {
  await assertSsrDsdAndHydrationPurity(page, {
    path: '/api/ssr',
    expectedMarkerText: 'Methane Next.js 15 RSC + React 19 Verification',
  });
});
