import { expect, type Page } from '@playwright/test';

export interface VerifyE2eExpectations {
  readonly path: string;
  readonly expectedMarkerText: string;
}

/**
 * Shared Playwright E2E verifier asserting:
 * 1. Raw HTTP SSR HTML contains `<template ... shadowrootmode="open">` (DSD).
 * 2. Browser client hydration causes 0 shadow-DOM childList mutations inside `<mth-*>` hosts.
 */
export async function assertSsrDsdAndHydrationPurity(
  page: Page,
  expectations: VerifyE2eExpectations,
): Promise<void> {
  const response = await page.request.get(expectations.path);
  expect(response.ok()).toBe(true);
  const rawHtml = await response.text();
  expect(rawHtml).toContain(expectations.expectedMarkerText);
  expect(rawHtml).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);

  await page.addInitScript(() => {
    const counts: Record<string, number> = {};
    (window as unknown as { __methaneShadowMutations?: Record<string, number> }).__methaneShadowMutations =
      counts;

    const attachObservers = (): void => {
      document.querySelectorAll('*').forEach((el) => {
        if (!el.localName.startsWith('mth-') || !el.shadowRoot) return;
        const tag = el.localName;
        if (tag in counts) return;
        counts[tag] = 0;
        const observer = new MutationObserver((records) => {
          for (const rec of records) {
            counts[tag] = (counts[tag] ?? 0) + rec.addedNodes.length + rec.removedNodes.length;
          }
        });
        observer.observe(el.shadowRoot, { childList: true, subtree: true });
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachObservers, { once: true });
    } else {
      attachObservers();
    }
  });

  await page.goto(expectations.path, { waitUntil: 'networkidle' });
  await expect(page.locator('[data-methane-canary-slot="true"]')).toBeVisible();

  const mutations = await page.evaluate(
    () => (window as unknown as { __methaneShadowMutations?: Record<string, number> }).__methaneShadowMutations ?? {},
  );
  for (const [tag, total] of Object.entries(mutations)) {
    expect(total, `Expected 0 shadow DOM node replacements on ${tag}`).toBe(0);
  }
}
