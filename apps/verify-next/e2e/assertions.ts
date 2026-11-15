import { expect, type Page } from '@playwright/test';

export interface VerifyE2eExpectations {
  readonly path: string;
  readonly interactivePath?: string;
  readonly expectedMarkerText: string;
  readonly expectedTags?: ReadonlyArray<string>;
  readonly expectedTypedValue?: string;
  readonly interactiveStateTestId?: string;
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
 * 2. Browser client hydration attaches all canary shadow roots with 0 shadow-DOM childList mutations,
 *    0 page/console errors, non-zero rendered dimensions + token styling, and interactive typing/click events.
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

  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto(expectations.path, { waitUntil: 'networkidle' });
  await expect(page.locator('[data-methane-canary-slot="true"]')).toBeVisible();

  const dsdState = await page.evaluate((tags) => {
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
    expect(dsdState.hydratedShadowRoots[tag], `Expected hydrated shadowRoot on <${tag}>`).toBe(
      true,
    );
  }
  for (const [tag, total] of Object.entries(dsdState.counts)) {
    expect(total, `Expected 0 shadow DOM node replacements on ${tag}`).toBe(0);
  }

  // Navigate to interactive entry path if separate from raw DSD endpoint (e.g. Next App Router `/`),
  // resetting error logs so static placeholder URLs on `/api/ssr` don't pollute runtime console checks.
  const targetPath = expectations.interactivePath ?? expectations.path;
  if (targetPath !== expectations.path) {
    pageErrors.length = 0;
    consoleErrors.length = 0;
    await page.goto(targetPath, { waitUntil: 'networkidle' });
    await expect(page.locator('[data-methane-canary-slot="true"]')).toBeVisible();
  }

  await page.waitForFunction(() => Boolean(customElements.get('mth-input') && customElements.get('mth-combobox')));

  // Verify existing shadowRoot, non-zero dimensions, and resolved design token colors
  const visualState = await page.evaluate(() => {
    const inputEl = document.querySelector('mth-input');
    const comboboxEl = document.querySelector('mth-combobox');
    const btnEl = document.querySelector('mth-button');
    const bodyStyle = getComputedStyle(document.body);
    return {
      inputRect: inputEl?.getBoundingClientRect().toJSON() as DOMRect | undefined,
      comboboxRect: comboboxEl?.getBoundingClientRect().toJSON() as DOMRect | undefined,
      btnRect: btnEl?.getBoundingClientRect().toJSON() as DOMRect | undefined,
      hasInputShadow: Boolean(inputEl?.shadowRoot),
      hasComboboxShadow: Boolean(comboboxEl?.shadowRoot),
      bodyColor: bodyStyle.color,
      tokenBg: bodyStyle.getPropertyValue('--mth-color-bg').trim(),
    };
  });

  expect(visualState.hasInputShadow).toBe(true);
  expect(visualState.hasComboboxShadow).toBe(true);
  expect(visualState.inputRect?.width ?? 0).toBeGreaterThan(0);
  expect(visualState.inputRect?.height ?? 0).toBeGreaterThan(0);
  expect(visualState.comboboxRect?.width ?? 0).toBeGreaterThan(0);
  expect(visualState.comboboxRect?.height ?? 0).toBeGreaterThan(0);
  expect(visualState.bodyColor.length).toBeGreaterThan(0);
  expect(visualState.tokenBg.length).toBeGreaterThan(0);

  if (visualState.btnRect) {
    expect(visualState.btnRect.width).toBeGreaterThan(0);
    expect(visualState.btnRect.height).toBeGreaterThan(0);
  }

  // Real user typing into hydrated <mth-input> + mth-input event verification
  const typedValue = expectations.expectedTypedValue ?? 'hydrated-e2e@methane.dev';
  await page.evaluate(() => {
    (window as unknown as { __MTH_EVENTS__?: string[] }).__MTH_EVENTS__ = [];
    document.querySelector('mth-input')?.addEventListener('mth-input', () => {
      (window as unknown as { __MTH_EVENTS__?: string[] }).__MTH_EVENTS__?.push('mth-input');
    });
    document.querySelector('mth-button')?.addEventListener('mth-press', () => {
      (window as unknown as { __MTH_EVENTS__?: string[] }).__MTH_EVENTS__?.push('mth-press');
    });
  });

  const innerInput = page.locator('mth-input').locator('input').first();
  await innerInput.fill(typedValue);
  await expect(innerInput).toHaveValue(typedValue);

  if (expectations.interactiveStateTestId) {
    await expect(page.getByTestId(expectations.interactiveStateTestId)).toContainText(typedValue);
  }

  // Real user click on hydrated <mth-button> (when present on page)
  const mthButton = page.locator('mth-button').first();
  if ((await mthButton.count()) > 0) {
    await mthButton.click();
  }

  const firedEvents = await page.evaluate(
    () => (window as unknown as { __MTH_EVENTS__?: string[] }).__MTH_EVENTS__ ?? [],
  );
  expect(firedEvents).toContain('mth-input');
  if ((await mthButton.count()) > 0) {
    expect(firedEvents).toContain('mth-press');
  }

  expect(pageErrors, `Unexpected page errors on ${targetPath}`).toEqual([]);
  expect(consoleErrors, `Unexpected console errors on ${targetPath}`).toEqual([]);
}
