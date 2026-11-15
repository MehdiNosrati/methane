import { expect, test, type Page } from '@playwright/test';

const DOCS_ORIGIN = (() => {
  const raw = process.env.DOCS_URL ?? 'http://127.0.0.1:3105/methane/';
  return raw.endsWith('/') ? raw : `${raw}/`;
})();

function docsUrl(path: string): string {
  const rel = path.replace(/^\/?(?:methane\/)?/, '');
  return new URL(rel, DOCS_ORIGIN).toString();
}

function attachErrorListeners(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  return { pageErrors, consoleErrors };
}

test.describe('@methane/docs visual, custom-element & interactive QA', () => {
  const routes = [
    '/methane/',
    '/methane/css/',
    '/methane/theme-builder/',
    '/methane/components/',
    '/methane/components/mth-button/',
    '/methane/components/mth-select/',
    '/methane/components/mth-combobox/',
    '/methane/components/mth-dialog/',
  ];

  for (const route of routes) {
    test(`loads ${route} cleanly with HTTP 200 and zero runtime/console errors`, async ({ page }) => {
      const { pageErrors, consoleErrors } = attachErrorListeners(page);
      const response = await page.goto(docsUrl(route), { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }

  test('defines and hydrates <mth-button> and <mth-select> with live shadowRoots', async ({ page }) => {
    const { pageErrors, consoleErrors } = attachErrorListeners(page);
    await page.goto(docsUrl('/methane/'), { waitUntil: 'networkidle' });

    const hydration = await page.evaluate(async () => {
      await Promise.all([
        customElements.whenDefined('mth-button'),
        customElements.whenDefined('mth-select'),
      ]);
      const btn = document.querySelector('mth-button');
      const sel = document.querySelector('mth-select');
      return {
        buttonDefined: Boolean(customElements.get('mth-button')),
        selectDefined: Boolean(customElements.get('mth-select')),
        buttonHasShadow: Boolean(btn?.shadowRoot),
        selectHasShadow: Boolean(sel?.shadowRoot),
      };
    });

    expect(hydration).toEqual({
      buttonDefined: true,
      selectDefined: true,
      buttonHasShadow: true,
      selectHasShadow: true,
    });
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('renders distinct button variants and updates live stage target on variant change', async ({
    page,
  }) => {
    const { pageErrors, consoleErrors } = attachErrorListeners(page);
    await page.goto(docsUrl('/methane/components/mth-button/'), { waitUntil: 'networkidle' });

    await page.evaluate(async () => {
      await customElements.whenDefined('mth-button');
    });

    const showcaseStyles = await page.evaluate(() => {
      const showcase = document.querySelector('[data-variants-showcase]');
      if (!showcase) return null;
      const out: Record<
        string,
        { width: number; height: number; bg: string; borderWidth: string; borderColor: string }
      > = {};
      for (const variant of ['solid', 'soft', 'outline', 'ghost', 'danger']) {
        const host = showcase.querySelector(`mth-button[variant="${variant}"]`);
        const control = host?.shadowRoot?.querySelector('[part="control"]');
        if (!host || !control) continue;
        const rect = control.getBoundingClientRect();
        const cs = getComputedStyle(control);
        out[variant] = {
          width: rect.width,
          height: rect.height,
          bg: cs.backgroundColor,
          borderWidth: cs.borderTopWidth,
          borderColor: cs.borderTopColor,
        };
      }
      return out;
    });

    expect(showcaseStyles).not.toBeNull();
    for (const variant of ['solid', 'soft', 'outline', 'ghost', 'danger']) {
      expect(showcaseStyles?.[variant]?.width ?? 0).toBeGreaterThan(20);
      expect(showcaseStyles?.[variant]?.height ?? 0).toBeGreaterThan(20);
    }

    const solidStyle = showcaseStyles!.solid!;
    const outlineStyle = showcaseStyles!.outline!;
    expect(parseFloat(outlineStyle.borderWidth)).toBeGreaterThanOrEqual(1);
    expect(outlineStyle.borderColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(outlineStyle.borderColor).not.toBe('transparent');
    expect(outlineStyle.bg).not.toBe(solidStyle.bg);

    const beforeTarget = await page.evaluate(() => {
      const target = document.querySelector('[data-preview-target]');
      const control = target?.shadowRoot?.querySelector('[part="control"]');
      if (!control) return null;
      const cs = getComputedStyle(control);
      return { bg: cs.backgroundColor, borderColor: cs.borderTopColor };
    });

    const variantSelect = page.locator('[data-preview-prop="variant"]');
    await variantSelect.selectOption('outline');

    const afterTarget = await page.evaluate(() => {
      const target = document.querySelector('[data-preview-target]');
      const control = target?.shadowRoot?.querySelector('[part="control"]');
      if (!control) return null;
      const cs = getComputedStyle(control);
      return {
        variantAttr: target?.getAttribute('variant'),
        bg: cs.backgroundColor,
        borderColor: cs.borderTopColor,
      };
    });

    expect(afterTarget?.variantAttr).toBe('outline');
    expect(afterTarget?.bg).not.toBe(beforeTarget?.bg);
    expect(afterTarget?.borderColor).not.toBe(beforeTarget?.borderColor);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('applies appearance: none and adequate inline-end padding on all doc selects', async ({
    page,
  }) => {
    await page.goto(docsUrl('/methane/components/mth-button/'), { waitUntil: 'networkidle' });

    const selectMetrics = await page.evaluate(() => {
      const selectors = [
        '#docs-theme-select',
        '#docs-density-select',
        '[data-preview-theme]',
        '[data-preview-dir]',
        '[data-preview-prop="variant"]',
      ];
      return selectors.map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, missing: true, appearance: '', padEnd: 0 };
        const cs = getComputedStyle(el);
        return {
          sel,
          missing: false,
          appearance: cs.appearance,
          padEnd: parseFloat(cs.paddingInlineEnd),
        };
      });
    });

    for (const metric of selectMetrics) {
      expect(metric.missing, `Missing select ${metric.sel}`).toBe(false);
      expect(metric.appearance, `Expected appearance:none on ${metric.sel}`).toBe('none');
      expect(metric.padEnd, `Expected paddingInlineEnd >= 28 on ${metric.sel}`).toBeGreaterThanOrEqual(
        28,
      );
    }
  });

  test('switches theme (light/dark) and density (compact/comfortable) with observable style updates', async ({
    page,
  }) => {
    await page.goto(docsUrl('/methane/'), { waitUntil: 'networkidle' });

    await page.locator('#docs-theme-select').selectOption('light');
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.locator('#docs-theme-select').selectOption('dark');
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    expect(darkBg).not.toBe(lightBg);

    await page.locator('#docs-density-select').selectOption('compact');
    const compactMetrics = await page.evaluate(() => {
      const sel = document.querySelector('#docs-theme-select')!;
      const cs = getComputedStyle(sel);
      return {
        height: sel.getBoundingClientRect().height,
        padBlock: parseFloat(cs.paddingBlockStart),
      };
    });

    await page.locator('#docs-density-select').selectOption('comfortable');
    const comfortableMetrics = await page.evaluate(() => {
      const sel = document.querySelector('#docs-theme-select')!;
      const cs = getComputedStyle(sel);
      return {
        height: sel.getBoundingClientRect().height,
        padBlock: parseFloat(cs.paddingBlockStart),
      };
    });

    expect(comfortableMetrics.padBlock).toBeGreaterThan(compactMetrics.padBlock);
    expect(comfortableMetrics.height).toBeGreaterThan(compactMetrics.height);
  });
});
