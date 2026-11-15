import { test } from '@playwright/test';
import { assertSsrDsdAndHydrationPurity } from '../../verify-next/e2e/assertions.js';

test('SvelteKit 2 SSR DSD and interactive zero-error client hydration', async ({ page }) => {
  await assertSsrDsdAndHydrationPurity(page, {
    path: '/',
    expectedMarkerText: 'Methane SvelteKit SSR + Svelte 5 Binding Verification',
    expectedTypedValue: 'svelte-hydrated@methane.dev',
    interactiveStateTestId: 'svelte-state',
  });
});
