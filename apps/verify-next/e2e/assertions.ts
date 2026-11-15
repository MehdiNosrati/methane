import { expect, type Page } from '@playwright/test';

export interface VerifyE2eExpectations {
  readonly path: string;
  readonly expectedMarkerText: string;
  readonly expectedTags?: ReadonlyArray<string>;
}

const DEFAULT_CANARY_TAGS: ReadonlyArray<string> = [
  'mth-skip-link',
  'mth-visually-hidden',
  'mth-error-boundary',
  'mth-field',
  'mth-input',
  'mth-dialog',
  'mth-combobox',
  'mth-option-group',
  'mth-option',
];

/**
 * Shared Playwright E2E verifier asserting:
 * 1. Raw HTTP SSR HTML contains `<template ... shadowrootmode="open">` (DSD) for all Phase 0 canary tags.
 * 2. Browser client hydration attaches all canary shadow roots with 0 shadow-DOM childList mutations.
 */
export async function assertSsrDsdAndHydrationPurity(
  page: Page,
  expectations: VerifyE2eExpectations,
): Promise<void> {
  const expectedTags = expectations.expectedTags ?? DEFAULT_CANARY_TAGS;
  const response = await page.request.get(expectations.path);
  expect(response.ok()).toBe(true);
  const rawHtml = await response.text();
  expect(rawHtml).toContain(expectations.expectedMarkerText);
  expect(rawHtml).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);

  for (const tag of expectedTags) {
    expect(
      rawHtml,
      `Expected SSR HTML at ${expectations.path} to render DSD <${tag}>`,
    ).toMatch(
      new RegExp(
        `<${tag}\\b[^>]*>(?:<!--[\\s\\S]*?-->|\\s)*<template\\b[^>]*\\bshadowrootmode="open"`,
        'i',
      ),
    );
  }

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

  const state = await page.evaluate((tags) => {
    const counts =
      (window as unknown as { __methaneShadowMutations?: Record<string, number> })
        .__methaneShadowMutations ?? {};
    const hydratedShadowRoots: Record<string, boolean> = {};
    for (const tag of tags) {
      const el = document.querySelector(tag);
      hydratedShadowRoots[tag] = Boolean(el?.shadowRoot);
    }
    return { counts, hydratedShadowRoots };
  }, [...expectedTags]);

  for (const tag of expectedTags) {
    expect(state.hydratedShadowRoots[tag], `Expected hydrated shadowRoot on <${tag}>`).toBe(true);
  }
  for (const [tag, total] of Object.entries(state.counts)) {
    expect(total, `Expected 0 shadow DOM node replacements on ${tag}`).toBe(0);
  }
}
