import { expect, test, type Page } from '@playwright/test';

async function attachErrorCollectors(page: Page): Promise<{ pageErrors: string[]; consoleErrors: string[] }> {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  return { pageErrors, consoleErrors };
}

test.describe('ADR-010 dual-path real-browser overlay & positioning', () => {
  test('Modern Chromium path uses native showModal, :popover-open, customizable select, and CSS Anchor positioning', async ({
    page,
  }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto('/');
    await page.waitForFunction(() => (window as unknown as { __METHANE_READY__?: boolean }).__METHANE_READY__);

    // 1. <mth-dialog> modal: native showModal(), :modal, focus trap, Escape + backdrop close
    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const opener = document.createElement('button');
      opener.id = 'open-dialog-btn';
      opener.textContent = 'Open Dialog';

      const dialog = document.createElement('mth-dialog');
      dialog.id = 'test-dialog';
      dialog.setAttribute('label', 'Modern Modal');
      dialog.modal = true;
      const insideBtn = document.createElement('button');
      insideBtn.id = 'dialog-inside-btn';
      insideBtn.textContent = 'Dialog Action';
      dialog.append(insideBtn);

      opener.addEventListener('click', () => {
        void (dialog as HTMLElement & { show(): Promise<void> }).show();
      });

      root.append(opener, dialog);
    });

    await page.click('#open-dialog-btn');
    await expect(page.locator('#test-dialog')).toHaveAttribute('open', '');

    const modalCheck = await page.evaluate(() => {
      const dialog = document.getElementById('test-dialog')!;
      const surface = dialog.shadowRoot!.querySelector<HTMLDialogElement>('#mth-dialog-surface')!;
      return {
        open: surface.open,
        isModal: surface.matches(':modal'),
        hasFallbackAttr: surface.hasAttribute('data-mth-top-layer-fallback'),
        activeInsideDialog:
          dialog.contains(document.activeElement) || Boolean(dialog.shadowRoot!.activeElement),
      };
    });
    expect(modalCheck.open).toBe(true);
    expect(modalCheck.isModal).toBe(true);
    expect(modalCheck.hasFallbackAttr).toBe(false);
    expect(modalCheck.activeInsideDialog).toBe(true);

    // Escape closes dialog
    await page.keyboard.press('Escape');
    await expect(page.locator('#test-dialog')).not.toHaveAttribute('open', '');

    // Reopen and verify close button inside dialog closes modal cleanly
    await page.click('#open-dialog-btn');
    await expect(page.locator('#test-dialog')).toHaveAttribute('open', '');
    await page.evaluate(() => {
      const dialog = document.getElementById('test-dialog')!;
      dialog.shadowRoot!.querySelector<HTMLButtonElement>('[part="close-button"]')!.click();
    });
    await expect(page.locator('#test-dialog')).not.toHaveAttribute('open', '');

    // 2. <mth-popover> uses native showPopover() (:popover-open) + css-anchor
    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const pop = document.createElement('mth-popover');
      pop.id = 'test-popover';
      pop.setAttribute('placement', 'bottom-start');
      pop.style.marginTop = '40px';
      const trigger = document.createElement('button');
      trigger.slot = 'trigger';
      trigger.id = 'popover-trigger';
      trigger.textContent = 'Toggle Popover';
      const body = document.createElement('div');
      body.id = 'popover-body';
      body.textContent = 'Popover content';
      pop.append(trigger, body);
      root.append(pop);
    });

    await page.click('#popover-trigger');
    await expect(page.locator('#test-popover')).toHaveAttribute('open', '');
    const popState = await page.evaluate(() => {
      const pop = document.getElementById('test-popover') as HTMLElement & {
        lastPositioningResult?: { strategy: string } | null;
      };
      const surface = pop.shadowRoot!.querySelector<HTMLElement>('#mth-popover-surface')!;
      const trigger = document.getElementById('popover-trigger')!;
      const sRect = surface.getBoundingClientRect();
      const tRect = trigger.getBoundingClientRect();
      return {
        matchesPopoverOpen: surface.matches(':popover-open'),
        hasFallbackAttr: surface.hasAttribute('data-mth-top-layer-fallback'),
        strategy: pop.lastPositioningResult?.strategy,
        width: sRect.width,
        height: sRect.height,
        top: sRect.top,
        triggerBottom: tRect.bottom,
      };
    });
    expect(popState.matchesPopoverOpen).toBe(true);
    expect(popState.hasFallbackAttr).toBe(false);
    expect(popState.strategy).toBe('css-anchor');
    expect(popState.width).toBeGreaterThan(0);
    expect(popState.height).toBeGreaterThan(0);
    expect(popState.top).toBeGreaterThanOrEqual(popState.triggerBottom - 4);
    await page.keyboard.press('Escape');
    await expect(page.locator('#test-popover')).not.toHaveAttribute('open', '');

    // 3. <mth-select> single customizable base-select + <mth-select multiple> popover (:popover-open)
    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const single = document.createElement('mth-select') as HTMLElement & {
        options: Array<{ value: string; label: string }>;
      };
      single.id = 'test-select-single';
      single.setAttribute('label', 'Role');
      single.options = [
        { value: 'eng', label: 'Engineer' },
        { value: 'des', label: 'Designer' },
      ];

      const multi = document.createElement('mth-select') as HTMLElement & {
        options: Array<{ value: string; label: string }>;
      };
      multi.id = 'test-select-multi';
      multi.setAttribute('label', 'Tags');
      multi.setAttribute('multiple', '');
      multi.options = [
        { value: 'a11y', label: 'A11y' },
        { value: 'ssr', label: 'SSR' },
        { value: 'css', label: 'CSS' },
      ];
      root.append(single, multi);
    });

    const selectModes = await page.evaluate(() => {
      const single = document.getElementById('test-select-single') as HTMLElement & {
        renderMode?: string;
      };
      const multi = document.getElementById('test-select-multi') as HTMLElement & {
        renderMode?: string;
      };
      return {
        singleHasNative: Boolean(single.shadowRoot!.querySelector('select[part="native-select"]')),
        multiHasNative: Boolean(
          multi.shadowRoot!.querySelector('select[part="native-select"][multiple]'),
        ),
        singleMode: single.renderMode,
        multiMode: multi.renderMode,
      };
    });
    expect(selectModes.singleHasNative).toBe(true);
    expect(selectModes.multiHasNative).toBe(true);
    expect(selectModes.singleMode).toBe('base-select');
    expect(selectModes.multiMode).toBe('base-select');

    await page
      .locator('#test-select-single')
      .locator('select[part="native-select"]')
      .selectOption('eng');
    await page
      .locator('#test-select-multi')
      .locator('select[part="native-select"]')
      .selectOption(['a11y', 'ssr']);

    const selectedValues = await page.evaluate(() => ({
      single: (document.getElementById('test-select-single') as HTMLElement & { value: string }).value,
      multi: (
        document.getElementById('test-select-multi') as HTMLElement & {
          selectedValues: string[];
        }
      ).selectedValues,
    }));
    expect(selectedValues.single).toBe('eng');
    expect(selectedValues.multi).toEqual(['a11y', 'ssr']);

    // 4. <mth-combobox> keyboard Arrow/Enter/Escape + css-anchor positioning
    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const cb = document.createElement('mth-combobox') as HTMLElement & {
        options: Array<{ value: string; label: string }>;
      };
      cb.id = 'test-combobox';
      cb.setAttribute('label', 'Framework');
      cb.options = [
        { value: 'lit', label: 'Lit 3' },
        { value: 'react', label: 'React 19' },
        { value: 'vue', label: 'Vue 3' },
      ];
      root.append(cb);
    });

    const cbInput = page.locator('#test-combobox').locator('#mth-cb-input');
    await cbInput.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#test-combobox')).toHaveAttribute('open', '');
    const cbRectState = await page.evaluate(() => {
      const cb = document.getElementById('test-combobox') as HTMLElement & {
        lastPositioningResult?: { strategy: string } | null;
      };
      const popup = cb.shadowRoot!.querySelector<HTMLElement>('#mth-cb-popup')!;
      const rect = popup.getBoundingClientRect();
      const ctrlRect = cb.shadowRoot!.querySelector<HTMLElement>('#mth-cb-control')!.getBoundingClientRect();
      return {
        strategy: cb.lastPositioningResult?.strategy,
        width: rect.width,
        top: rect.top,
        ctrlBottom: ctrlRect.bottom,
      };
    });
    expect(cbRectState.strategy).toBe('css-anchor');
    expect(cbRectState.width).toBeGreaterThan(0);
    expect(cbRectState.top).toBeGreaterThanOrEqual(cbRectState.ctrlBottom - 4);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('#test-combobox')).not.toHaveAttribute('open', '');
    const cbVal = await page.evaluate(
      () => (document.getElementById('test-combobox') as HTMLElement & { value: string }).value,
    );
    expect(cbVal).toBe('react');

    // 5. <mth-tooltip> uses :popover-open + css-anchor + Escape dismiss
    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const tip = document.createElement('mth-tooltip');
      tip.id = 'test-tooltip';
      tip.setAttribute('content', 'Helpful keyboard tip');
      tip.setAttribute('show-delay', '0');
      const btn = document.createElement('button');
      btn.id = 'tip-btn';
      btn.textContent = 'Hover or Focus Me';
      tip.append(btn);
      root.append(tip);
    });

    await page.locator('#tip-btn').focus();
    await expect(page.locator('#test-tooltip')).toHaveAttribute('open', '');
    const tipState = await page.evaluate(() => {
      const tip = document.getElementById('test-tooltip') as HTMLElement & {
        lastPositioningResult?: { strategy: string } | null;
      };
      const surface = tip.shadowRoot!.querySelector<HTMLElement>('#mth-tooltip-surface')!;
      const rect = surface.getBoundingClientRect();
      return {
        matchesPopoverOpen: surface.matches(':popover-open'),
        strategy: tip.lastPositioningResult?.strategy,
        width: rect.width,
        height: rect.height,
      };
    });
    expect(tipState.matchesPopoverOpen).toBe(true);
    expect(tipState.strategy).toBe('css-anchor');
    expect(tipState.width).toBeGreaterThan(0);
    expect(tipState.height).toBeGreaterThan(0);

    await page.keyboard.press('Escape');
    await expect(page.locator('#test-tooltip')).not.toHaveAttribute('open', '');

    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('Forced Fallback path activates [data-mth-top-layer-fallback] + js-fallback coordinates without native Popover or CSS Anchor APIs', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = await attachErrorCollectors(page);

    await page.addInitScript(() => {
      const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
      delete proto['showPopover'];
      delete proto['hidePopover'];
      delete proto['togglePopover'];

      if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
        const origSupports = CSS.supports.bind(CSS);
        CSS.supports = (propOrCond: string, value?: string): boolean => {
          const combined = `${propOrCond} ${value ?? ''}`;
          if (
            /anchor-name|position-anchor|position-area|position-try|base-select/i.test(combined)
          ) {
            return false;
          }
          return value !== undefined ? origSupports(propOrCond, value) : origSupports(propOrCond);
        };
      }
    });

    await page.goto('/');
    await page.waitForFunction(() => (window as unknown as { __METHANE_READY__?: boolean }).__METHANE_READY__);

    // 1. <mth-popover> fallback
    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const pop = document.createElement('mth-popover');
      pop.id = 'fb-popover';
      pop.setAttribute('placement', 'bottom-start');
      pop.style.marginTop = '80px';
      const trigger = document.createElement('button');
      trigger.slot = 'trigger';
      trigger.id = 'fb-popover-trigger';
      trigger.textContent = 'Fallback Popover';
      const content = document.createElement('div');
      content.textContent = 'Fallback body';
      pop.append(trigger, content);
      root.append(pop);
    });

    await page.click('#fb-popover-trigger');
    await expect(page.locator('#fb-popover')).toHaveAttribute('open', '');
    const fbPop = await page.evaluate(() => {
      const pop = document.getElementById('fb-popover') as HTMLElement & {
        lastPositioningResult?: { strategy: string } | null;
      };
      const surface = pop.shadowRoot!.querySelector<HTMLElement>('#mth-popover-surface')!;
      const tRect = document.getElementById('fb-popover-trigger')!.getBoundingClientRect();
      const sRect = surface.getBoundingClientRect();
      return {
        hasFallbackAttr: surface.hasAttribute('data-mth-top-layer-fallback'),
        strategy: pop.lastPositioningResult?.strategy,
        width: sRect.width,
        top: sRect.top,
        triggerBottom: tRect.bottom,
      };
    });
    expect(fbPop.hasFallbackAttr).toBe(true);
    expect(fbPop.strategy).toBe('js-fallback');
    expect(fbPop.width).toBeGreaterThan(0);
    expect(fbPop.top).toBeGreaterThanOrEqual(fbPop.triggerBottom - 2);
    await page.keyboard.press('Escape');
    await expect(page.locator('#fb-popover')).not.toHaveAttribute('open', '');

    // 2. <mth-select> single falls back from base-select to popover listbox + js-fallback
    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const sel = document.createElement('mth-select') as HTMLElement & {
        options: Array<{ value: string; label: string }>;
      };
      sel.id = 'fb-select';
      sel.setAttribute('label', 'Fallback Role');
      sel.setAttribute('placement', 'bottom-start');
      sel.options = [
        { value: 'eng', label: 'Engineer' },
        { value: 'pm', label: 'Product Manager' },
      ];
      root.append(sel);
    });

    const fbSelectTrigger = page.locator('#fb-select').locator('button[part="trigger"]');
    await fbSelectTrigger.click();
    await expect(page.locator('#fb-select')).toHaveAttribute('open', '');
    const fbSel = await page.evaluate(() => {
      const sel = document.getElementById('fb-select') as HTMLElement & {
        lastPositioningResult?: { strategy: string } | null;
      };
      const popup = sel.shadowRoot!.querySelector<HTMLElement>('#mth-select-popup')!;
      const trigger = sel.shadowRoot!.querySelector<HTMLElement>('#mth-select-control')!;
      const pRect = popup.getBoundingClientRect();
      const tRect = trigger.getBoundingClientRect();
      return {
        hasNativeSelect: Boolean(sel.shadowRoot!.querySelector('select[part="native-select"]')),
        hasFallbackAttr: popup.hasAttribute('data-mth-top-layer-fallback'),
        strategy: sel.lastPositioningResult?.strategy,
        width: pRect.width,
        top: pRect.top,
        triggerBottom: tRect.bottom,
      };
    });
    expect(fbSel.hasNativeSelect).toBe(false);
    expect(fbSel.hasFallbackAttr).toBe(true);
    expect(fbSel.strategy).toBe('js-fallback');
    expect(fbSel.width).toBeGreaterThan(0);
    expect(fbSel.top).toBeGreaterThanOrEqual(fbSel.triggerBottom - 2);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('#fb-select')).not.toHaveAttribute('open', '');
    const fbSelVal = await page.evaluate(
      () => (document.getElementById('fb-select') as HTMLElement & { value: string }).value,
    );
    expect(fbSelVal).toBe('pm');

    // Reopen and dismiss via outside click
    await fbSelectTrigger.click();
    await expect(page.locator('#fb-select')).toHaveAttribute('open', '');
    await page.mouse.click(2, 2);
    await expect(page.locator('#fb-select')).not.toHaveAttribute('open', '');

    // 3. <mth-combobox> fallback + keyboard/click + outside dismiss
    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const cb = document.createElement('mth-combobox') as HTMLElement & {
        options: Array<{ value: string; label: string }>;
      };
      cb.id = 'fb-combobox';
      cb.setAttribute('label', 'Fallback Stack');
      cb.options = [
        { value: 'lit', label: 'Lit' },
        { value: 'astro', label: 'Astro' },
      ];
      root.append(cb);
    });

    await page.locator('#fb-combobox').locator('#mth-cb-input').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#fb-combobox')).toHaveAttribute('open', '');
    const fbCb = await page.evaluate(() => {
      const cb = document.getElementById('fb-combobox') as HTMLElement & {
        lastPositioningResult?: { strategy: string } | null;
      };
      const popup = cb.shadowRoot!.querySelector<HTMLElement>('#mth-cb-popup')!;
      const ctrl = cb.shadowRoot!.querySelector<HTMLElement>('#mth-cb-control')!;
      const pRect = popup.getBoundingClientRect();
      const cRect = ctrl.getBoundingClientRect();
      return {
        hasFallbackAttr: popup.hasAttribute('data-mth-top-layer-fallback'),
        strategy: cb.lastPositioningResult?.strategy,
        width: pRect.width,
        top: pRect.top,
        triggerBottom: cRect.bottom,
      };
    });
    expect(fbCb.hasFallbackAttr).toBe(true);
    expect(fbCb.strategy).toBe('js-fallback');
    expect(fbCb.width).toBeGreaterThan(0);
    expect(fbCb.top).toBeGreaterThanOrEqual(fbCb.triggerBottom - 2);

    await page.mouse.click(2, 2);
    await expect(page.locator('#fb-combobox')).not.toHaveAttribute('open', '');

    // 4. <mth-tooltip> fallback
    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const tip = document.createElement('mth-tooltip');
      tip.id = 'fb-tooltip';
      tip.setAttribute('content', 'Fallback tooltip text');
      tip.setAttribute('show-delay', '0');
      tip.setAttribute('placement', 'bottom');
      tip.style.marginTop = '80px';
      const btn = document.createElement('button');
      btn.id = 'fb-tip-btn';
      btn.textContent = 'Trigger';
      tip.append(btn);
      root.append(tip);
    });

    await page.locator('#fb-tip-btn').focus();
    await expect(page.locator('#fb-tooltip')).toHaveAttribute('open', '');
    const fbTip = await page.evaluate(() => {
      const tip = document.getElementById('fb-tooltip') as HTMLElement & {
        lastPositioningResult?: { strategy: string } | null;
      };
      const surface = tip.shadowRoot!.querySelector<HTMLElement>('#mth-tooltip-surface')!;
      const tRect = document.getElementById('fb-tip-btn')!.getBoundingClientRect();
      const sRect = surface.getBoundingClientRect();
      return {
        hasFallbackAttr: surface.hasAttribute('data-mth-top-layer-fallback'),
        strategy: tip.lastPositioningResult?.strategy,
        width: sRect.width,
        top: sRect.top,
        triggerBottom: tRect.bottom,
      };
    });
    expect(fbTip.hasFallbackAttr).toBe(true);
    expect(fbTip.strategy).toBe('js-fallback');
    expect(fbTip.width).toBeGreaterThan(0);
    expect(fbTip.top).toBeGreaterThanOrEqual(fbTip.triggerBottom - 2);

    await page.keyboard.press('Escape');
    await expect(page.locator('#fb-tooltip')).not.toHaveAttribute('open', '');

    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
    await context.close();
  });
});
