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

test.describe('@methane-ui/docs visual, custom-element & interactive QA', () => {
  const routes = [
    '/methane/',
    '/methane/css/',
    '/methane/guides/skills/',
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

  test('theme-builder keeps Wave A defaults in sync and high fg/bg contrast across light and dark preview schemes', async ({
    page,
  }) => {
    await page.goto(docsUrl('/methane/theme-builder/'), { waitUntil: 'networkidle' });

    const initial = await page.evaluate(() => ({
      l: (document.getElementById('tb-l') as HTMLInputElement).value,
      c: (document.getElementById('tb-c') as HTMLInputElement).value,
      h: (document.getElementById('tb-h') as HTMLInputElement).value,
      badge: document.getElementById('tb-seed-badge')?.textContent?.trim() ?? '',
      css: document.getElementById('tb-css-output')?.textContent ?? '',
    }));

    expect(initial.l).toBe('0.55');
    expect(initial.c).toBe('0.23');
    expect(initial.h).toBe('264');
    expect(initial.badge).toBe('oklch(0.55 0.23 264)');
    expect(initial.css).toContain('--mth-color-seed-brand: oklch(0.55 0.23 264);');
    expect(initial.css).toContain('--mth-radius-sm: 0.375rem;');
    expect(initial.css).toContain('--mth-radius-md: 0.5rem;');
    expect(initial.css).toContain('--mth-radius-lg: 0.75rem;');
    expect(initial.css).toContain('--mth-radius-xl: 1rem;');

    await page.locator('#docs-theme-select').selectOption('light');
    await page.locator('#tb-scheme').selectOption('light');

    const getPreviewColors = () =>
      page.evaluate(() => {
        const preview = document.getElementById('tb-preview')!;
        const cs = getComputedStyle(preview);
        return { color: cs.color, bg: cs.backgroundColor };
      });

    const lightPreview = await getPreviewColors();
    await page.locator('#tb-scheme').selectOption('dark');
    const darkPreview = await getPreviewColors();

    expect(darkPreview.bg).not.toBe(lightPreview.bg);
    expect(darkPreview.color).not.toBe(lightPreview.color);
    expect(darkPreview.color).not.toBe(darkPreview.bg);

    const parseColorLightness = (value: string): number => {
      const oklchMatch = /oklch\(\s*([0-9.]+)/.exec(value);
      if (oklchMatch?.[1]) return parseFloat(oklchMatch[1]);
      const rgbMatch = /rgba?\(\s*([0-9.]+)[,\s]+([0-9.]+)[,\s]+([0-9.]+)/.exec(value);
      if (rgbMatch?.[1] && rgbMatch[2] && rgbMatch[3]) {
        return (
          (0.2126 * parseFloat(rgbMatch[1]) +
            0.7152 * parseFloat(rgbMatch[2]) +
            0.0722 * parseFloat(rgbMatch[3])) /
          255
        );
      }
      const srgbMatch = /color\(srgb\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)/.exec(value);
      if (srgbMatch?.[1] && srgbMatch[2] && srgbMatch[3]) {
        return (
          0.2126 * parseFloat(srgbMatch[1]) +
          0.7152 * parseFloat(srgbMatch[2]) +
          0.0722 * parseFloat(srgbMatch[3])
        );
      }
      throw new Error(`Unsupported computed color format: ${value}`);
    };

    const lightFgL = parseColorLightness(lightPreview.color);
    const lightBgL = parseColorLightness(lightPreview.bg);
    const darkFgL = parseColorLightness(darkPreview.color);
    const darkBgL = parseColorLightness(darkPreview.bg);

    expect(lightBgL - lightFgL).toBeGreaterThan(0.6);
    expect(darkFgL - darkBgL).toBeGreaterThan(0.6);
  });

  test('renders .mth-feature-icon without horizontal overflow and formats inline code without raw backticks', async ({
    page,
  }) => {
    await page.goto(docsUrl('/methane/'), { waitUntil: 'networkidle' });

    const iconOverflow = await page.evaluate(() => {
      const icons = Array.from(document.querySelectorAll<HTMLElement>('.mth-feature-icon'));
      return icons.map((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        hasSvg: Boolean(el.querySelector('svg')),
      }));
    });
    expect(iconOverflow.length).toBeGreaterThanOrEqual(3);
    for (const metric of iconOverflow) {
      expect(metric.hasSvg).toBe(true);
      expect(metric.scrollWidth).toBeLessThanOrEqual(metric.clientWidth);
    }

    await page.goto(docsUrl('/methane/components/'), { waitUntil: 'networkidle' });
    const cardRawBackticks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-comp-card] p'))
        .map((p) => p.textContent ?? '')
        .filter((text) => text.includes('`'));
    });
    expect(cardRawBackticks).toEqual([]);

    await page.goto(docsUrl('/methane/components/mth-button/'), { waitUntil: 'networkidle' });
    const detailRawBackticks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('main .mth-stack > p, main td'))
        .map((el) => el.textContent ?? '')
        .filter((text) => text.includes('`'));
    });
    expect(detailRawBackticks).toEqual([]);
  });

  test('aligns bottom CTA buttons across multi-card rows on /components/ and home bento grid', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(docsUrl('/methane/components/'), { waitUntil: 'networkidle' });

    const componentRows = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-comp-card]')).filter(
        (card) => !card.hidden && card.getBoundingClientRect().height > 0,
      );

      type CardMetric = { tag: string; cardTop: number; btnBottom: number };
      const rows: CardMetric[][] = [];

      for (const card of cards) {
        const cardRect = card.getBoundingClientRect();
        const btn = card.querySelector<HTMLElement>('a.docs-btn');
        if (!btn) continue;
        const btnRect = btn.getBoundingClientRect();
        const tag = card.querySelector('code')?.textContent?.trim() ?? '';
        const metric: CardMetric = { tag, cardTop: cardRect.top, btnBottom: btnRect.bottom };

        const existingRow = rows.find((row) => Math.abs(row[0]!.cardTop - metric.cardTop) <= 2);
        if (existingRow) {
          existingRow.push(metric);
        } else {
          rows.push([metric]);
        }
      }
      return rows;
    });

    const multiCardRows = componentRows.filter((row) => row.length > 1);
    expect(multiCardRows.length).toBeGreaterThan(0);

    const checkedTags = multiCardRows.flatMap((row) => row.map((item) => item.tag));
    expect(checkedTags).toEqual(
      expect.arrayContaining(['<mth-alert>', '<mth-artifact-pane>', '<mth-async-search>']),
    );

    for (const row of multiCardRows) {
      const baselineBottom = row[0]!.btnBottom;
      for (const item of row) {
        expect(
          Math.abs(item.btnBottom - baselineBottom),
          `Expected ${item.tag} CTA bottom (${item.btnBottom}) to match row baseline (${baselineBottom}) within 1px`,
        ).toBeLessThanOrEqual(1);
      }
    }

    await page.goto(docsUrl('/methane/'), { waitUntil: 'networkidle' });
    const bentoBottoms = await page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll<HTMLElement>('.mth-bento-grid > .mth-bento-item'),
      );
      return items.map((item) => {
        const btn = item.querySelector<HTMLElement>('.docs-btn');
        return {
          cardTop: item.getBoundingClientRect().top,
          btnBottom: btn ? btn.getBoundingClientRect().bottom : null,
        };
      });
    });

    expect(bentoBottoms.length).toBe(2);
    expect(Math.abs(bentoBottoms[0]!.cardTop - bentoBottoms[1]!.cardTop)).toBeLessThanOrEqual(2);
    expect(bentoBottoms[0]!.btnBottom).not.toBeNull();
    expect(bentoBottoms[1]!.btnBottom).not.toBeNull();
    expect(
      Math.abs(bentoBottoms[0]!.btnBottom! - bentoBottoms[1]!.btnBottom!),
    ).toBeLessThanOrEqual(1);
  });

  test('renders interactive <mth-availability-picker> matrix, toggles slots, and emits mth-change', async ({
    page,
  }) => {
    const { pageErrors, consoleErrors } = attachErrorListeners(page);
    const response = await page.goto(docsUrl('/methane/components/mth-availability-picker/'), {
      waitUntil: 'networkidle',
    });
    expect(response?.status()).toBe(200);

    await page.evaluate(async () => {
      await customElements.whenDefined('mth-availability-picker');
      const el = document.querySelector('[data-preview-target]') as
        | (HTMLElement & { updateComplete?: Promise<unknown> })
        | null;
      await el?.updateComplete;
    });

    const initial = await page.evaluate(() => {
      const target = document.querySelector<HTMLElement>('[data-preview-target]');
      const sr = target?.shadowRoot ?? null;
      const cells = sr ? Array.from(sr.querySelectorAll<HTMLButtonElement>('.slot-cell')) : [];
      const pressedCount = cells.filter((c) => c.getAttribute('aria-pressed') === 'true').length;
      const rect = target?.getBoundingClientRect();
      return {
        defined: Boolean(customElements.get('mth-availability-picker')),
        statusText: document.querySelector('[data-preview-status]')?.textContent?.trim() ?? '',
        hasShadowRoot: Boolean(sr),
        cellCount: cells.length,
        pressedCount,
        width: rect?.width ?? 0,
        height: rect?.height ?? 0,
        firstCellPressed: cells[0]?.getAttribute('aria-pressed') ?? null,
      };
    });

    expect(initial.defined).toBe(true);
    expect(initial.statusText).toContain('Live Custom Element');
    expect(initial.hasShadowRoot).toBe(true);
    expect(initial.cellCount).toBe(35);
    expect(initial.pressedCount).toBeGreaterThanOrEqual(8);
    expect(initial.width).toBeGreaterThanOrEqual(300);
    expect(initial.height).toBeGreaterThanOrEqual(180);

    await page.evaluate(() => {
      const target = document.querySelector<HTMLElement>('[data-preview-target]');
      const firstCell = target?.shadowRoot?.querySelector<HTMLButtonElement>('.slot-cell');
      firstCell?.click();
    });

    const after = await page.evaluate(async () => {
      const target = document.querySelector<HTMLElement>('[data-preview-target]') as
        | (HTMLElement & { updateComplete?: Promise<unknown> })
        | null;
      await target?.updateComplete;
      const firstCell = target?.shadowRoot?.querySelector<HTMLButtonElement>('.slot-cell');
      return {
        firstCellPressed: firstCell?.getAttribute('aria-pressed') ?? null,
        readout: document.querySelector('[data-preview-readout]')?.textContent?.trim() ?? '',
      };
    });

    expect(after.firstCellPressed).not.toBe(initial.firstCellPressed);
    expect(after.readout).toContain('mth-change');
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  const packageRepresentatives: ReadonlyArray<{ pkg: string; tag: string }> = [
    { pkg: '@methane-ui/ui', tag: 'mth-async-search' },
    { pkg: '@methane-ui/ui', tag: 'mth-tree' },
    { pkg: '@methane-ui/primitives', tag: 'mth-error-boundary' },
    { pkg: '@methane-ui/primitives', tag: 'mth-skip-link' },
    { pkg: '@methane-ui/admin', tag: 'mth-availability-picker' },
    { pkg: '@methane-ui/admin', tag: 'mth-kanban' },
    { pkg: '@methane-ui/ai', tag: 'mth-ai-message' },
    { pkg: '@methane-ui/ai', tag: 'mth-prompt-input' },
    { pkg: '@methane-ui/auth', tag: 'mth-auth-form' },
    { pkg: '@methane-ui/auth', tag: 'mth-role-matrix' },
    { pkg: '@methane-ui/chat', tag: 'mth-chat-thread' },
    { pkg: '@methane-ui/chat', tag: 'mth-message-composer' },
    { pkg: '@methane-ui/commerce', tag: 'mth-cart' },
    { pkg: '@methane-ui/commerce', tag: 'mth-plan-picker' },
    { pkg: '@methane-ui/3d', tag: 'mth-model-viewer' },
    { pkg: '@methane-ui/charts', tag: 'mth-chart' },
    { pkg: '@methane-ui/code', tag: 'mth-code-editor' },
    { pkg: '@methane-ui/code', tag: 'mth-diff-viewer' },
    { pkg: '@methane-ui/datagrid', tag: 'mth-datagrid' },
    { pkg: '@methane-ui/datagrid', tag: 'mth-gantt' },
    { pkg: '@methane-ui/editor', tag: 'mth-rich-editor' },
    { pkg: '@methane-ui/editor', tag: 'mth-markdown-editor' },
    { pkg: '@methane-ui/flow', tag: 'mth-flow-editor' },
    { pkg: '@methane-ui/flow', tag: 'mth-org-chart' },
    { pkg: '@methane-ui/maps', tag: 'mth-map' },
    { pkg: '@methane-ui/media', tag: 'mth-waveform' },
    { pkg: '@methane-ui/media', tag: 'mth-lottie' },
    { pkg: '@methane-ui/pdf', tag: 'mth-pdf-viewer' },
    { pkg: '@methane-ui/rtc', tag: 'mth-video-grid' },
    { pkg: '@methane-ui/spreadsheet', tag: 'mth-spreadsheet' },
    { pkg: '@methane-ui/spreadsheet', tag: 'mth-formula-bar' },
  ];

  for (const { pkg, tag } of packageRepresentatives) {
    test(`hydrates live <${tag}> (${pkg}) with visible UI and zero errors`, async ({ page }) => {
      const { pageErrors, consoleErrors } = attachErrorListeners(page);
      const response = await page.goto(docsUrl(`/methane/components/${tag}/`), {
        waitUntil: 'networkidle',
      });
      expect(response?.status()).toBe(200);

      const state = await page.evaluate(async (expectedTag) => {
        await customElements.whenDefined(expectedTag);
        const target = document.querySelector<HTMLElement>('[data-preview-target]') as
          | (HTMLElement & { updateComplete?: Promise<unknown> })
          | null;
        await target?.updateComplete;
        const canvas = document.querySelector<HTMLElement>('[data-preview-canvas]');
        const canvasRect = canvas?.getBoundingClientRect();
        const targetRect = target?.getBoundingClientRect();
        const targetDisplay = target ? getComputedStyle(target).display : '';
        return {
          defined: Boolean(customElements.get(expectedTag)),
          statusText: document.querySelector('[data-preview-status]')?.textContent?.trim() ?? '',
          hasShadowRoot: Boolean(target?.shadowRoot),
          canvasWidth: canvasRect?.width ?? 0,
          canvasHeight: canvasRect?.height ?? 0,
          targetWidth: targetRect?.width ?? 0,
          targetHeight: targetRect?.height ?? 0,
          targetDisplay,
        };
      }, tag);

      expect(state.defined, `${tag} was not defined`).toBe(true);
      expect(state.statusText).toContain('Live Custom Element');
      expect(state.statusText).not.toContain('Token-Styled Preview');
      expect(state.hasShadowRoot, `${tag} missing shadowRoot`).toBe(true);
      expect(state.canvasWidth).toBeGreaterThan(40);
      expect(state.canvasHeight).toBeGreaterThan(24);
      if (state.targetDisplay !== 'contents') {
        expect(state.targetWidth, `${tag} host width collapsed`).toBeGreaterThan(40);
        expect(state.targetHeight, `${tag} host height collapsed`).toBeGreaterThan(24);
      }
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }

  test('renders non-collapsed container-query inputs and populated offline media demos without error states', async ({
    page,
  }) => {
    const { pageErrors, consoleErrors } = attachErrorListeners(page);

    await page.goto(docsUrl('/methane/components/mth-otp-input/'), { waitUntil: 'networkidle' });
    const otpWidth = await page.evaluate(async () => {
      await customElements.whenDefined('mth-otp-input');
      const target = document.querySelector<HTMLElement>('[data-preview-target]') as
        | (HTMLElement & { updateComplete?: Promise<unknown> })
        | null;
      await target?.updateComplete;
      return target?.getBoundingClientRect().width ?? 0;
    });
    expect(otpWidth).toBeGreaterThanOrEqual(180);

    await page.goto(docsUrl('/methane/components/mth-input/'), { waitUntil: 'networkidle' });
    const showcaseInputWidths = await page.evaluate(async () => {
      await customElements.whenDefined('mth-input');
      const inputs = Array.from(
        document.querySelectorAll<HTMLElement>('[data-variants-showcase] mth-input'),
      );
      await Promise.all(
        inputs.map(
          (el) => (el as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete,
        ),
      );
      return inputs.map((el) => el.getBoundingClientRect().width);
    });
    expect(showcaseInputWidths.length).toBeGreaterThanOrEqual(4);
    for (const width of showcaseInputWidths) {
      expect(width).toBeGreaterThanOrEqual(180);
    }

    await page.goto(docsUrl('/methane/components/mth-gallery/'), { waitUntil: 'networkidle' });
    const galleryMetrics = await page.evaluate(async () => {
      await customElements.whenDefined('mth-gallery');
      const target = document.querySelector<HTMLElement>('[data-preview-target]') as
        | (HTMLElement & { updateComplete?: Promise<unknown> })
        | null;
      await target?.updateComplete;
      const sr = target?.shadowRoot;
      const baseRect = sr?.querySelector<HTMLElement>('.base')?.getBoundingClientRect();
      return {
        thumbs: sr?.querySelectorAll('[part="thumbnail"]').length ?? 0,
        innerHeight: baseRect?.height ?? 0,
      };
    });
    expect(galleryMetrics.thumbs).toBe(3);
    expect(galleryMetrics.innerHeight).toBeGreaterThanOrEqual(100);

    await page.goto(docsUrl('/methane/components/mth-image/'), { waitUntil: 'networkidle' });
    const imageMetrics = await page.evaluate(async () => {
      await customElements.whenDefined('mth-image');
      const target = document.querySelector<HTMLElement>('[data-preview-target]') as
        | (HTMLElement & { updateComplete?: Promise<unknown> })
        | null;
      await target?.updateComplete;
      const img = target?.shadowRoot?.querySelector<HTMLImageElement>('img');
      if (img && !img.complete) {
        await new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      }
      return {
        complete: Boolean(img?.complete),
        naturalWidth: img?.naturalWidth ?? 0,
        isErrorState: target?.matches(':state(error)') ?? false,
      };
    });
    expect(imageMetrics.complete).toBe(true);
    expect(imageMetrics.naturalWidth).toBeGreaterThan(0);
    expect(imageMetrics.isErrorState).toBe(false);

    await page.goto(docsUrl('/methane/components/mth-audio-player/'), { waitUntil: 'networkidle' });
    const audioMetrics = await page.evaluate(async () => {
      await customElements.whenDefined('mth-audio-player');
      const target = document.querySelector<HTMLElement>('[data-preview-target]') as
        | (HTMLElement & { updateComplete?: Promise<unknown> })
        | null;
      await target?.updateComplete;
      const playBtn = target?.shadowRoot?.querySelector<HTMLButtonElement>('[part="play-button"]');
      return {
        hasPlayBtn: Boolean(playBtn),
        playDisabled: Boolean(playBtn?.disabled),
      };
    });
    expect(audioMetrics.hasPlayBtn).toBe(true);
    expect(audioMetrics.playDisabled).toBe(false);

    await page.goto(docsUrl('/methane/components/mth-video-player/'), { waitUntil: 'networkidle' });
    const videoMetrics = await page.evaluate(async () => {
      await customElements.whenDefined('mth-video-player');
      const target = document.querySelector<HTMLElement>('[data-preview-target]') as
        | (HTMLElement & { updateComplete?: Promise<unknown> })
        | null;
      await target?.updateComplete;
      const sr = target?.shadowRoot;
      return {
        hasVideo: Boolean(sr?.querySelector('video')),
        text: sr?.textContent ?? '',
      };
    });
    expect(videoMetrics.hasVideo).toBe(true);
    expect(videoMetrics.text).not.toContain('Video source unavailable');

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
