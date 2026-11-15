import { expect, test } from '@playwright/test';
import { assertNoErrors, openHarness } from './helpers.js';

test.describe('Select, combobox, async-search, overlays, and navigation controls in real browsers', () => {
  test('<mth-select> supports keyboard open, navigation, selection, Escape close, FormData, and aligned geometry', async ({
    page,
    browserName,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const form = document.createElement('form');
      form.id = 'sel-form';

      const sel = document.createElement('mth-select') as HTMLElement & {
        options: Array<{ value: string; label: string }>;
      };
      sel.id = 'sel-el';
      sel.setAttribute('name', 'framework');
      sel.setAttribute('label', 'Framework');
      sel.setAttribute('force-fallback', '');
      sel.options = [
        { value: 'lit', label: 'Lit' },
        { value: 'astro', label: 'Astro' },
        { value: 'svelte', label: 'Svelte' },
      ];
      form.append(sel);
      root.append(form);
    });

    const trigger = page.locator('#sel-el').locator('button[part="trigger"]');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#sel-el')).toHaveAttribute('open', '');

    const geom = await page.evaluate(() => {
      const sel = document.getElementById('sel-el')!;
      const ctrl = sel.shadowRoot!.querySelector('#mth-select-control')!.getBoundingClientRect();
      const popup = sel.shadowRoot!.querySelector('#mth-select-popup')!.getBoundingClientRect();
      const caret = sel.shadowRoot!.querySelector('[part="caret"]')!.getBoundingClientRect();
      return {
        popupW: popup.width,
        popupH: popup.height,
        popupTop: popup.top,
        ctrlBottom: ctrl.bottom,
        caretW: caret.width,
        caretRight: caret.right,
        ctrlRight: ctrl.right,
      };
    });
    expect(geom.popupW).toBeGreaterThan(0);
    expect(geom.popupH).toBeGreaterThan(0);
    expect(geom.popupTop).toBeGreaterThanOrEqual(geom.ctrlBottom - 2);
    expect(geom.caretW).toBeGreaterThan(0);
    expect(geom.caretRight).toBeLessThanOrEqual(geom.ctrlRight + 1);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('#sel-el')).not.toHaveAttribute('open', '');

    const formData = await page.evaluate(() =>
      Object.fromEntries(new FormData(document.getElementById('sel-form') as HTMLFormElement).entries()),
    );
    expect(formData).toEqual({ framework: 'astro' });

    // Reopen via click (tests Safari/WebKit click-focus fix) and dismiss with Escape
    await trigger.click();
    await expect(page.locator('#sel-el')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('#sel-el')).not.toHaveAttribute('open', '');

    const restoredFocus = await page.evaluate(
      () => document.activeElement?.id === 'sel-el',
    );
    expect(restoredFocus, `Focus restoration on ${browserName}`).toBe(true);
    assertNoErrors(errors);
  });

  test('<mth-combobox> filters options while typing, selects via keyboard, and closes on Escape', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const form = document.createElement('form');
      form.id = 'cb-form';
      const cb = document.createElement('mth-combobox') as HTMLElement & {
        options: Array<{ value: string; label: string }>;
      };
      cb.id = 'cb-el';
      cb.setAttribute('name', 'city');
      cb.setAttribute('label', 'City');
      cb.options = [
        { value: 'nyc', label: 'New York' },
        { value: 'sfo', label: 'San Francisco' },
        { value: 'tok', label: 'Tokyo' },
      ];
      form.append(cb);
      root.append(form);
    });

    const input = page.locator('#cb-el').locator('#mth-cb-input');
    await input.focus();
    await page.keyboard.type('Tok');
    await expect(page.locator('#cb-el')).toHaveAttribute('open', '');

    const popupCheck = await page.evaluate(() => {
      const cb = document.getElementById('cb-el')!;
      const popup = cb.shadowRoot!.querySelector('#mth-cb-popup')!;
      const rect = popup.getBoundingClientRect();
      const options = Array.from(cb.shadowRoot!.querySelectorAll('[role="option"]'));
      return {
        visibleCount: options.length,
        rectW: rect.width,
        rectTop: rect.top,
        withinViewport: rect.right <= window.innerWidth && rect.bottom <= window.innerHeight,
      };
    });
    expect(popupCheck.visibleCount).toBe(1);
    expect(popupCheck.rectW).toBeGreaterThan(0);
    expect(popupCheck.withinViewport).toBe(true);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('#cb-el')).not.toHaveAttribute('open', '');
    const data = await page.evaluate(() =>
      Object.fromEntries(new FormData(document.getElementById('cb-form') as HTMLFormElement).entries()),
    );
    expect(data).toEqual({ city: 'tok' });

    // Reopen and press Escape -> closes and keeps focus on input
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#cb-el')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('#cb-el')).not.toHaveAttribute('open', '');
    expect(
      await page.evaluate(() => Boolean(document.getElementById('cb-el')?.shadowRoot?.activeElement)),
    ).toBe(true);
    assertNoErrors(errors);
  });

  test('<mth-async-search> queries DataSource on typing, navigates results, and updates FormData', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const form = document.createElement('form');
      form.id = 'as-form';

      const asEl = document.createElement('mth-async-search') as HTMLElement & {
        dataSource: { query(req: { filter?: string }): Promise<{ items: Array<{ value: string; label: string }> }> };
      };
      asEl.id = 'as-el';
      asEl.setAttribute('name', 'assignee');
      asEl.setAttribute('label', 'Assignee');
      asEl.setAttribute('debounce-ms', '20');
      const allUsers = [
        { value: 'u1', label: 'Ada Lovelace' },
        { value: 'u2', label: 'Grace Hopper' },
        { value: 'u3', label: 'Alan Turing' },
      ];
      asEl.dataSource = {
        async query(req) {
          const q = (req.filter ?? '').toLowerCase();
          return {
            items: allUsers.filter((u) => u.label.toLowerCase().includes(q)),
          };
        },
      };

      form.append(asEl);
      root.append(form);
    });

    const input = page.locator('#as-el').locator('#mth-as-input');
    await input.focus();
    await page.keyboard.type('Grace');

    await expect(page.locator('#as-el').locator('[role="option"]')).toHaveCount(1);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const formData = await page.evaluate(() =>
      Object.fromEntries(new FormData(document.getElementById('as-form') as HTMLFormElement).entries()),
    );
    expect(formData).toEqual({ assignee: 'u2' });
    assertNoErrors(errors);
  });

  test('<mth-dialog> modal traps Tab/Shift+Tab focus, closes on Escape, and restores focus to opener', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const opener = document.createElement('button');
      opener.id = 'dlg-opener';
      opener.textContent = 'Open Modal';

      const dlg = document.createElement('mth-dialog') as HTMLElement & { show(): Promise<boolean> };
      dlg.id = 'dlg-el';
      dlg.setAttribute('label', 'Edit Item');
      dlg.setAttribute('modal', '');

      const first = document.createElement('input');
      first.id = 'dlg-first';
      first.type = 'text';
      const last = document.createElement('button');
      last.id = 'dlg-last';
      last.textContent = 'Save';

      dlg.append(first, last);
      opener.addEventListener('click', () => void dlg.show());
      root.append(opener, dlg);
    });

    await page.locator('#dlg-opener').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#dlg-el')).toHaveAttribute('open', '');

    // Cycle Tab repeatedly and verify focus never leaves dialog (either shadow close-btn or slotted inputs)
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const dlg = document.getElementById('dlg-el')!;
        const active = document.activeElement;
        return active === dlg || dlg.contains(active) || Boolean(dlg.shadowRoot?.activeElement);
      });
      expect(inside).toBe(true);
    }

    // Shift+Tab also stays trapped inside dialog
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Shift+Tab');
      const inside = await page.evaluate(() => {
        const dlg = document.getElementById('dlg-el')!;
        const active = document.activeElement;
        return active === dlg || dlg.contains(active) || Boolean(dlg.shadowRoot?.activeElement);
      });
      expect(inside).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(page.locator('#dlg-el')).not.toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('dlg-opener');
    assertNoErrors(errors);
  });

  test('<mth-dialog variant="prompt"> submits prompt value and emits mth-confirm', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const dlg = document.createElement('mth-dialog') as HTMLElement & {
        show(): Promise<boolean>;
        returnValue: string;
      };
      dlg.id = 'dlg-prompt';
      dlg.setAttribute('variant', 'prompt');
      dlg.setAttribute('label', 'Rename');
      dlg.setAttribute('description', 'Enter new folder name');

      (window as unknown as { __CONFIRM_DETAIL__?: unknown }).__CONFIRM_DETAIL__ = null;
      dlg.addEventListener('mth-confirm', (e) => {
        (window as unknown as { __CONFIRM_DETAIL__?: unknown }).__CONFIRM_DETAIL__ = (
          e as CustomEvent
        ).detail;
      });
      root.append(dlg);
    });

    await page.evaluate(async () => {
      const dlg = document.getElementById('dlg-prompt') as HTMLElement & { show(): Promise<boolean> };
      await dlg.show();
    });
    await expect(page.locator('#dlg-prompt')).toHaveAttribute('open', '');

    await page.locator('#dlg-prompt').locator('#mth-dialog-prompt').fill('releases-v3');
    await page.locator('#dlg-prompt').locator('.action-btn.primary').click();

    await expect(page.locator('#dlg-prompt')).not.toHaveAttribute('open', '');
    const res = await page.evaluate(() => ({
      detail: (window as unknown as { __CONFIRM_DETAIL__?: { variant: string; value?: string } })
        .__CONFIRM_DETAIL__,
      returnValue: (document.getElementById('dlg-prompt') as HTMLElement & { returnValue: string })
        .returnValue,
    }));
    expect(res.detail).toEqual({ variant: 'prompt', value: 'releases-v3' });
    expect(res.returnValue).toBe('releases-v3');
    assertNoErrors(errors);
  });

  test('<mth-drawer> opens modal sheet, traps focus, closes on Escape, and restores focus', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const opener = document.createElement('button');
      opener.id = 'drw-opener';
      opener.textContent = 'Open Drawer';

      const drawer = document.createElement('mth-drawer') as HTMLElement & {
        show(): Promise<boolean>;
      };
      drawer.id = 'drw-el';
      drawer.setAttribute('label', 'Filters');
      drawer.setAttribute('placement', 'end');

      const input = document.createElement('input');
      input.id = 'drw-input';
      const apply = document.createElement('button');
      apply.id = 'drw-apply';
      apply.textContent = 'Apply';

      drawer.append(input, apply);
      opener.addEventListener('click', () => void drawer.show());
      root.append(opener, drawer);
    });

    await page.locator('#drw-opener').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#drw-el')).toHaveAttribute('open', '');

    const rect = await page.evaluate(() => {
      const popup = document.getElementById('drw-el')!.shadowRoot!.querySelector('[part="popup"]')!;
      const r = popup.getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    expect(rect.width).toBeGreaterThan(100);
    expect(rect.height).toBeGreaterThan(100);

    await page.keyboard.press('Tab');
    const trapped = await page.evaluate(() => {
      const drw = document.getElementById('drw-el')!;
      return drw.contains(document.activeElement) || Boolean(drw.shadowRoot?.activeElement);
    });
    expect(trapped).toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.locator('#drw-el')).not.toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('drw-opener');
    assertNoErrors(errors);
  });

  test('<mth-popover> positions adjacent to trigger in native and force-fallback modes', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const pop = document.createElement('mth-popover');
      pop.id = 'pop-native';
      pop.setAttribute('placement', 'bottom-start');
      pop.style.marginTop = '32px';
      const trig = document.createElement('button');
      trig.slot = 'trigger';
      trig.id = 'pop-native-btn';
      trig.textContent = 'Info';
      const body = document.createElement('div');
      body.textContent = 'Native popover content';
      pop.append(trig, body);

      const popFb = document.createElement('mth-popover');
      popFb.id = 'pop-fb';
      popFb.setAttribute('placement', 'bottom-start');
      popFb.setAttribute('force-fallback', '');
      popFb.style.marginTop = '32px';
      const trigFb = document.createElement('button');
      trigFb.slot = 'trigger';
      trigFb.id = 'pop-fb-btn';
      trigFb.textContent = 'Fallback Info';
      const bodyFb = document.createElement('div');
      bodyFb.textContent = 'Fallback popover content';
      popFb.append(trigFb, bodyFb);

      root.append(pop, popFb);
    });

    await page.locator('#pop-native-btn').click();
    await expect(page.locator('#pop-native')).toHaveAttribute('open', '');
    const nativeRect = await page.evaluate(() => {
      const pop = document.getElementById('pop-native')!;
      const t = document.getElementById('pop-native-btn')!.getBoundingClientRect();
      const s = pop.shadowRoot!.querySelector('#mth-popover-surface')!.getBoundingClientRect();
      return { sTop: s.top, sWidth: s.width, tBottom: t.bottom };
    });
    expect(nativeRect.sWidth).toBeGreaterThan(0);
    expect(nativeRect.sTop).toBeGreaterThanOrEqual(nativeRect.tBottom - 4);
    await page.keyboard.press('Escape');
    await expect(page.locator('#pop-native')).not.toHaveAttribute('open', '');

    await page.locator('#pop-fb-btn').click();
    await expect(page.locator('#pop-fb')).toHaveAttribute('open', '');
    const fbRect = await page.evaluate(() => {
      const pop = document.getElementById('pop-fb') as HTMLElement & {
        lastPositioningResult?: { strategy: string } | null;
      };
      const t = document.getElementById('pop-fb-btn')!.getBoundingClientRect();
      const s = pop.shadowRoot!.querySelector('#mth-popover-surface')!;
      const sr = s.getBoundingClientRect();
      return {
        strategy: pop.lastPositioningResult?.strategy,
        hasFallback: s.hasAttribute('data-mth-top-layer-fallback'),
        sTop: sr.top,
        sWidth: sr.width,
        tBottom: t.bottom,
      };
    });
    expect(fbRect.strategy).toBe('js-fallback');
    expect(fbRect.hasFallback).toBe(true);
    expect(fbRect.sWidth).toBeGreaterThan(0);
    expect(fbRect.sTop).toBeGreaterThanOrEqual(fbRect.tBottom - 2);
    await page.keyboard.press('Escape');
    await expect(page.locator('#pop-fb')).not.toHaveAttribute('open', '');
    assertNoErrors(errors);
  });

  test('<mth-tooltip> opens on focus, positions adjacent to trigger (including fallback), and dismisses on Escape without stealing focus', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const tip = document.createElement('mth-tooltip');
      tip.id = 'tip-el';
      tip.setAttribute('content', 'Keyboard shortcut: Ctrl+S');
      tip.setAttribute('placement', 'bottom');
      tip.setAttribute('delay', '0');
      tip.setAttribute('force-fallback', '');
      tip.style.marginTop = '48px';

      const btn = document.createElement('button');
      btn.id = 'tip-trigger';
      btn.textContent = 'Save';
      tip.append(btn);
      root.append(tip);
    });

    await page.locator('#tip-trigger').focus();
    await expect(page.locator('#tip-el')).toHaveAttribute('open', '');

    const tipState = await page.evaluate(() => {
      const tip = document.getElementById('tip-el')!;
      const surface = tip.shadowRoot!.querySelector('#mth-tooltip-surface')!;
      const sRect = surface.getBoundingClientRect();
      const tRect = document.getElementById('tip-trigger')!.getBoundingClientRect();
      return {
        role: surface.getAttribute('role'),
        width: sRect.width,
        top: sRect.top,
        triggerBottom: tRect.bottom,
        activeId: document.activeElement?.id,
      };
    });
    expect(tipState.role).toBe('tooltip');
    expect(tipState.width).toBeGreaterThan(0);
    expect(tipState.top).toBeGreaterThanOrEqual(tipState.triggerBottom - 2);
    expect(tipState.activeId).toBe('tip-trigger');

    await page.keyboard.press('Escape');
    await expect(page.locator('#tip-el')).not.toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tip-trigger');
    assertNoErrors(errors);
  });

  test('<mth-dropdown-menu> opens on trigger click, navigates items via ArrowDown, handles checkbox vs normal selection, and restores focus on Escape', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const menu = document.createElement('mth-dropdown-menu');
      menu.id = 'dd-el';
      menu.setAttribute('label', 'Actions');
      menu.style.marginTop = '24px';

      const trigger = document.createElement('button');
      trigger.id = 'dd-trigger';
      trigger.slot = 'trigger';
      trigger.textContent = 'Actions';

      const wrap = document.createElement('mth-menu-item');
      wrap.id = 'dd-wrap';
      wrap.setAttribute('type', 'checkbox');
      wrap.setAttribute('value', 'wrap');
      wrap.textContent = 'Word Wrap';

      const rename = document.createElement('mth-menu-item');
      rename.id = 'dd-rename';
      rename.setAttribute('value', 'rename');
      rename.textContent = 'Rename';

      const del = document.createElement('mth-menu-item');
      del.id = 'dd-delete';
      del.setAttribute('value', 'delete');
      del.textContent = 'Delete';

      (window as unknown as { __MENU_SELECTED__?: string[] }).__MENU_SELECTED__ = [];
      menu.addEventListener('mth-select', (e) => {
        (window as unknown as { __MENU_SELECTED__?: string[] }).__MENU_SELECTED__?.push(
          (e as CustomEvent<{ value: string }>).detail.value,
        );
      });

      menu.append(trigger, wrap, rename, del);
      root.append(menu);
    });

    await page.locator('#dd-trigger').click();
    await expect(page.locator('#dd-el')).toHaveAttribute('open', '');

    const surfaceRect = await page.evaluate(() => {
      const menu = document.getElementById('dd-el')!;
      const surface = menu.shadowRoot!.querySelector('#mth-dropdown-menu-surface')!;
      const tRect = document.getElementById('dd-trigger')!.getBoundingClientRect();
      const sRect = surface.getBoundingClientRect();
      return { width: sRect.width, top: sRect.top, triggerBottom: tRect.bottom };
    });
    expect(surfaceRect.width).toBeGreaterThan(0);
    expect(surfaceRect.top).toBeGreaterThanOrEqual(surfaceRect.triggerBottom - 4);

    // Checkbox item toggles without closing menu
    await page.locator('#dd-wrap').click();
    await expect(page.locator('#dd-el')).toHaveAttribute('open', '');

    // Rove via ArrowDown to Rename and select with Enter -> closes menu
    await page.locator('#dd-wrap').focus();
    await page.keyboard.press('ArrowDown');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('dd-rename');
    await page.keyboard.press('Enter');
    await expect(page.locator('#dd-el')).not.toHaveAttribute('open', '');

    // Reopen and close via Escape -> restores focus to trigger
    await page.locator('#dd-trigger').click();
    await expect(page.locator('#dd-el')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('#dd-el')).not.toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('dd-trigger');

    const selected = await page.evaluate(
      () => (window as unknown as { __MENU_SELECTED__?: string[] }).__MENU_SELECTED__,
    );
    expect(selected).toEqual(['wrap', 'rename']);
    assertNoErrors(errors);
  });

  test('<mth-tabs> moves focus via ArrowRight/ArrowLeft/Home/End and switches panels', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const tabs = document.createElement('mth-tabs');
      tabs.id = 'tabs-el';
      tabs.setAttribute('value', 'overview');

      for (const [val, label, body] of [
        ['overview', 'Overview', 'Overview panel content'],
        ['api', 'API', 'API panel content'],
        ['examples', 'Examples', 'Examples panel content'],
      ] as const) {
        const t = document.createElement('mth-tab');
        t.id = `tab-${val}`;
        t.slot = 'tab';
        t.setAttribute('value', val);
        t.textContent = label;

        const p = document.createElement('mth-tab-panel');
        p.id = `panel-${val}`;
        p.setAttribute('value', val);
        p.textContent = body;

        tabs.append(t, p);
      }
      root.append(tabs);
    });

    await page.locator('#tab-overview').focus();
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tab-api');
    await expect(page.locator('#panel-api')).toHaveAttribute('active', '');
    await expect(page.locator('#panel-api')).toBeVisible();
    await expect(page.locator('#panel-overview')).not.toHaveAttribute('active', '');
    await expect(page.locator('#panel-overview')).toBeHidden();

    await page.keyboard.press('End');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tab-examples');
    await expect(page.locator('#panel-examples')).toHaveAttribute('active', '');
    await expect(page.locator('#panel-examples')).toBeVisible();

    await page.keyboard.press('Home');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tab-overview');
    await page.keyboard.press('ArrowLeft');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('tab-examples');
    assertNoErrors(errors);
  });

  test('<mth-accordion> enforces single-expand vs multiple mode and keyboard toggles', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const acc = document.createElement('mth-accordion');
      acc.id = 'acc-el';
      acc.setAttribute('value', 'one');

      for (const [val, heading, body] of [
        ['one', 'Section 1', 'First body'],
        ['two', 'Section 2', 'Second body'],
      ] as const) {
        const item = document.createElement('mth-accordion-item');
        item.id = `acc-${val}`;
        item.setAttribute('value', val);
        item.setAttribute('heading', heading);
        item.textContent = body;
        acc.append(item);
      }
      root.append(acc);
    });

    await expect(page.locator('#acc-one')).toHaveAttribute('expanded', '');
    await expect(page.locator('#acc-two')).not.toHaveAttribute('expanded', '');

    // Click second item in single-expand mode -> expands two, collapses one
    await page.locator('#acc-two').locator('[part="trigger"]').click();
    await expect(page.locator('#acc-two')).toHaveAttribute('expanded', '');
    await expect(page.locator('#acc-one')).not.toHaveAttribute('expanded', '');

    // Enable multiple mode and toggle first item via Enter
    await page.evaluate(() => {
      document.getElementById('acc-el')!.setAttribute('multiple', '');
    });
    await page.locator('#acc-one').locator('[part="trigger"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#acc-one')).toHaveAttribute('expanded', '');
    await expect(page.locator('#acc-two')).toHaveAttribute('expanded', '');
    assertNoErrors(errors);
  });

  test('<mth-table> sorts columns via click and Enter, emits mth-sort, and handles row selection', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const tbl = document.createElement('mth-table') as HTMLElement & {
        columns: Array<{ field: string; header: string; sortable?: boolean }>;
        rows: Array<{ id: string; name: string; score: number }>;
      };
      tbl.id = 'tbl-el';
      tbl.setAttribute('label', 'Leaderboard');
      tbl.setAttribute('selectable', 'multiple');
      tbl.columns = [
        { field: 'name', header: 'Name', sortable: true },
        { field: 'score', header: 'Score', sortable: true },
      ];
      tbl.rows = [
        { id: '1', name: 'Zoe', score: 90 },
        { id: '2', name: 'Ada', score: 99 },
      ];

      (window as unknown as { __SORT_EVENTS__?: unknown[] }).__SORT_EVENTS__ = [];
      tbl.addEventListener('mth-sort', (e) => {
        (window as unknown as { __SORT_EVENTS__?: unknown[] }).__SORT_EVENTS__?.push(
          (e as CustomEvent).detail,
        );
      });
      root.append(tbl);
    });

    const sortBtn = page.locator('#tbl-el').locator('[part="sort-button"]').first();
    await sortBtn.click();

    const ascState = await page.evaluate(() => {
      const tbl = document.getElementById('tbl-el')!;
      const firstHeader = tbl.shadowRoot!.querySelector('th[aria-sort]');
      const firstRowText = tbl.shadowRoot!.querySelectorAll('tbody tr')[0]?.textContent ?? '';
      return {
        ariaSort: firstHeader?.getAttribute('aria-sort'),
        firstRowText,
      };
    });
    expect(ascState.ariaSort).toBe('ascending');
    expect(ascState.firstRowText).toContain('Ada');

    await sortBtn.focus();
    await page.keyboard.press('Enter');
    const descState = await page.evaluate(() => {
      const tbl = document.getElementById('tbl-el')!;
      const firstHeader = tbl.shadowRoot!.querySelector('th[aria-sort]');
      const firstRowText = tbl.shadowRoot!.querySelectorAll('tbody tr')[0]?.textContent ?? '';
      return {
        ariaSort: firstHeader?.getAttribute('aria-sort'),
        firstRowText,
        sortEvents: (window as unknown as { __SORT_EVENTS__?: unknown[] }).__SORT_EVENTS__?.length ?? 0,
      };
    });
    expect(descState.ariaSort).toBe('descending');
    expect(descState.firstRowText).toContain('Zoe');
    expect(descState.sortEvents).toBe(2);

    // Select first row checkbox
    await page.locator('#tbl-el').locator('[part="row-select"]').first().click();
    const selectedIds = await page.evaluate(
      () => (document.getElementById('tbl-el') as HTMLElement & { selectedIds: string[] }).selectedIds,
    );
    expect(selectedIds.length).toBe(1);
    assertNoErrors(errors);
  });

  test('<mth-pagination> navigates pages via click and Enter, updating aria-current="page" and emitting mth-change', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const pg = document.createElement('mth-pagination');
      pg.id = 'pg-el';
      pg.setAttribute('page', '1');
      pg.setAttribute('total-pages', '5');

      (window as unknown as { __PAGES__?: number[] }).__PAGES__ = [];
      pg.addEventListener('mth-change', (e) => {
        (window as unknown as { __PAGES__?: number[] }).__PAGES__?.push(
          (e as CustomEvent<{ page: number }>).detail.page,
        );
      });
      root.append(pg);
    });

    await page.locator('#pg-el').locator('[part="next"]').click();
    expect(
      await page.evaluate(() => (document.getElementById('pg-el') as HTMLElement & { page: number }).page),
    ).toBe(2);

    const page4Btn = page.locator('#pg-el').locator('[part="page"]', { hasText: '4' });
    await page4Btn.focus();
    await page.keyboard.press('Enter');

    const state = await page.evaluate(() => {
      const pg = document.getElementById('pg-el') as HTMLElement & { page: number };
      const current = pg.shadowRoot!.querySelector('[aria-current="page"]');
      return {
        page: pg.page,
        currentText: current?.textContent?.trim(),
        events: (window as unknown as { __PAGES__?: number[] }).__PAGES__,
      };
    });
    expect(state.page).toBe(4);
    expect(state.currentText).toBe('4');
    expect(state.events).toEqual([2, 4]);
    assertNoErrors(errors);
  });
});
