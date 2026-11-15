import { expect, test } from '@playwright/test';
import { assertNoErrors, openHarness } from './helpers.js';

test.describe('Buttons, feedback, and status components in real browsers', () => {
  test('<mth-button> activates on pointer click, Enter, and Space and emits mth-press', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const btn = document.createElement('mth-button');
      btn.id = 'btn-activate';
      btn.textContent = 'Save changes';
      (window as unknown as { __PRESSES__?: number }).__PRESSES__ = 0;
      btn.addEventListener('mth-press', () => {
        const w = window as unknown as { __PRESSES__?: number };
        w.__PRESSES__ = (w.__PRESSES__ ?? 0) + 1;
      });
      root.append(btn);
    });

    await page.locator('#btn-activate').click();
    await page.locator('#btn-activate').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');

    const presses = await page.evaluate(
      () => (window as unknown as { __PRESSES__?: number }).__PRESSES__,
    );
    expect(presses).toBe(3);
    assertNoErrors(errors);
  });

  test('<mth-button> disabled and loading states block mth-press and expose aria-busy', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const disabledBtn = document.createElement('mth-button');
      disabledBtn.id = 'btn-disabled';
      disabledBtn.setAttribute('disabled', '');
      disabledBtn.textContent = 'Disabled';

      const loadingBtn = document.createElement('mth-button');
      loadingBtn.id = 'btn-loading';
      loadingBtn.setAttribute('loading', '');
      loadingBtn.textContent = 'Loading';

      (window as unknown as { __BLOCKED_PRESSES__?: number }).__BLOCKED_PRESSES__ = 0;
      for (const el of [disabledBtn, loadingBtn]) {
        el.addEventListener('mth-press', () => {
          const w = window as unknown as { __BLOCKED_PRESSES__?: number };
          w.__BLOCKED_PRESSES__ = (w.__BLOCKED_PRESSES__ ?? 0) + 1;
        });
      }

      root.append(disabledBtn, loadingBtn);
    });

    await page.locator('#btn-disabled').click({ force: true });
    await page.locator('#btn-loading').click({ force: true });

    const state = await page.evaluate(() => {
      const d = document.getElementById('btn-disabled')!;
      const l = document.getElementById('btn-loading')!;
      return {
        blocked: (window as unknown as { __BLOCKED_PRESSES__?: number }).__BLOCKED_PRESSES__,
        disabledState: d.matches(':state(disabled)'),
        loadingState: l.matches(':state(loading)'),
        loadingBusy: l.shadowRoot!.querySelector('[part="control"]')!.getAttribute('aria-busy'),
        hasSpinner: Boolean(l.shadowRoot!.querySelector('[part="spinner"]')),
      };
    });

    expect(state.blocked).toBe(0);
    expect(state.disabledState).toBe(true);
    expect(state.loadingState).toBe(true);
    expect(state.loadingBusy).toBe('true');
    expect(state.hasSpinner).toBe(true);
    assertNoErrors(errors);
  });

  test('<mth-button> integrates with <form> submit (name/value) and reset', async ({ page }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const form = document.createElement('form');
      form.id = 'btn-form';
      (window as unknown as { __SUBMIT_DATA__?: Record<string, string> | null }).__SUBMIT_DATA__ =
        null;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        (window as unknown as { __SUBMIT_DATA__?: Record<string, string> }).__SUBMIT_DATA__ =
          Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
      });

      const inp = document.createElement('mth-input');
      inp.id = 'bf-input';
      inp.setAttribute('name', 'title');
      inp.setAttribute('value', 'Initial');

      const resetBtn = document.createElement('mth-button');
      resetBtn.id = 'bf-reset';
      resetBtn.setAttribute('type', 'reset');
      resetBtn.textContent = 'Reset';

      const submitBtn = document.createElement('mth-button');
      submitBtn.id = 'bf-submit';
      submitBtn.setAttribute('type', 'submit');
      submitBtn.setAttribute('name', 'intent');
      submitBtn.setAttribute('value', 'publish');
      submitBtn.textContent = 'Publish';

      form.append(inp, resetBtn, submitBtn);
      root.append(form);
    });

    const innerInput = page.locator('#bf-input').locator('input');
    await innerInput.fill('Edited');
    await page.locator('#bf-reset').click();
    await expect(innerInput).toHaveValue('Initial');

    await innerInput.fill('Published Title');
    await page.locator('#bf-submit').click();

    const submitted = await page.evaluate(
      () => (window as unknown as { __SUBMIT_DATA__?: Record<string, string> | null }).__SUBMIT_DATA__,
    );
    expect(submitted).toEqual({
      title: 'Published Title',
      intent: 'publish',
    });
    assertNoErrors(errors);
  });

  test('<mth-button> renders distinct variant styles and safe anchor hrefs', async ({ page }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '12px';

      for (const v of ['solid', 'soft', 'outline', 'ghost', 'danger']) {
        const b = document.createElement('mth-button');
        b.id = `v-${v}`;
        b.setAttribute('variant', v);
        b.textContent = v;
        row.append(b);
      }

      const linkBtn = document.createElement('mth-button');
      linkBtn.id = 'btn-link';
      linkBtn.setAttribute('href', 'https://mahdins.dev/methane/');
      linkBtn.setAttribute('target', '_blank');
      linkBtn.textContent = 'Docs';

      root.append(row, linkBtn);
    });

    const styles = await page.evaluate(() => {
      const out: Record<string, { bg: string; borderColor: string }> = {};
      for (const v of ['solid', 'soft', 'outline', 'ghost', 'danger']) {
        const ctrl = document.getElementById(`v-${v}`)!.shadowRoot!.querySelector('[part="control"]')!;
        const cs = getComputedStyle(ctrl);
        out[v] = { bg: cs.backgroundColor, borderColor: cs.borderTopColor };
      }
      const anchor = document
        .getElementById('btn-link')!
        .shadowRoot!.querySelector<HTMLAnchorElement>('a[part="control"]')!;
      return {
        styles: out,
        tagName: anchor.tagName,
        rel: anchor.getAttribute('rel'),
      };
    });

    expect(styles.styles['solid']!.bg).not.toBe(styles.styles['soft']!.bg);
    expect(styles.styles['solid']!.bg).not.toBe(styles.styles['outline']!.bg);
    expect(styles.styles['solid']!.bg).not.toBe(styles.styles['danger']!.bg);
    expect(styles.styles['ghost']!.bg).not.toBe(styles.styles['solid']!.bg);
    expect(styles.tagName).toBe('A');
    expect(styles.rel).toContain('noopener');
    expect(styles.rel).toContain('noreferrer');
    assertNoErrors(errors);
  });

  test('<mth-alert> exposes semantic live roles and dismisses on close button click', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const info = document.createElement('mth-alert');
      info.id = 'alert-info';
      info.setAttribute('variant', 'info');
      info.setAttribute('title', 'Saved');
      info.textContent = 'Preferences updated.';

      const danger = document.createElement('mth-alert');
      danger.id = 'alert-danger';
      danger.setAttribute('variant', 'danger');
      danger.setAttribute('closable', '');
      danger.setAttribute('title', 'Action failed');
      danger.textContent = 'Retry in a moment.';
      (window as unknown as { __ALERT_CLOSED__?: string }).__ALERT_CLOSED__ = '';
      danger.addEventListener('mth-close', (e) => {
        (window as unknown as { __ALERT_CLOSED__?: string }).__ALERT_CLOSED__ = (
          e as CustomEvent<{ reason: string }>
        ).detail.reason;
      });

      root.append(info, danger);
    });

    const roles = await page.evaluate(() => ({
      infoRole: document.getElementById('alert-info')!.shadowRoot!.querySelector('[part="base"]')!.getAttribute('role'),
      dangerRole: document.getElementById('alert-danger')!.shadowRoot!.querySelector('[part="base"]')!.getAttribute('role'),
    }));
    expect(roles.infoRole).toBe('status');
    expect(roles.dangerRole).toBe('alert');

    await page.locator('#alert-danger').locator('[part="close-button"]').click();
    await expect(page.locator('#alert-danger')).not.toHaveAttribute('open', '');
    const closedReason = await page.evaluate(
      () => (window as unknown as { __ALERT_CLOSED__?: string }).__ALERT_CLOSED__,
    );
    expect(closedReason.length).toBeGreaterThan(0);
    assertNoErrors(errors);
  });

  test('<mth-toast> opens, renders non-zero surface, and dismisses via close button & Escape', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const toast = document.createElement('mth-toast') as HTMLElement & { show(): Promise<boolean> };
      toast.id = 'test-toast';
      toast.setAttribute('variant', 'success');
      toast.setAttribute('duration', '0');
      toast.setAttribute('heading', 'Deployed');
      toast.setAttribute('message', 'Build v1.2 is live.');

      (window as unknown as { __TOAST_EVENTS__?: string[] }).__TOAST_EVENTS__ = [];
      for (const ev of ['mth-open', 'mth-close']) {
        toast.addEventListener(ev, () => {
          (window as unknown as { __TOAST_EVENTS__?: string[] }).__TOAST_EVENTS__?.push(ev);
        });
      }
      root.append(toast);
    });

    await page.evaluate(async () => {
      const t = document.getElementById('test-toast') as HTMLElement & { show(): Promise<boolean> };
      await t.show();
    });

    await expect(page.locator('#test-toast')).toHaveAttribute('open', '');
    const toastRect = await page.evaluate(() => {
      const base = document.getElementById('test-toast')!.shadowRoot!.querySelector('[part="base"]')!;
      const r = base.getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    expect(toastRect.width).toBeGreaterThan(50);
    expect(toastRect.height).toBeGreaterThan(20);

    await page.locator('#test-toast').locator('[part="close-button"]').click();
    await expect(page.locator('#test-toast')).not.toHaveAttribute('open', '');

    // Reopen and dismiss via Escape while focused
    await page.evaluate(async () => {
      const t = document.getElementById('test-toast') as HTMLElement & { show(): Promise<boolean> };
      await t.show();
      t.shadowRoot!.querySelector<HTMLElement>('[part="close-button"]')!.focus();
    });
    await expect(page.locator('#test-toast')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('#test-toast')).not.toHaveAttribute('open', '');

    const events = await page.evaluate(
      () => (window as unknown as { __TOAST_EVENTS__?: string[] }).__TOAST_EVENTS__,
    );
    expect(events).toEqual(['mth-open', 'mth-close', 'mth-open', 'mth-close']);
    assertNoErrors(errors);
  });

  test('<mth-progress-bar> updates fill geometry in determinate mode and switches to indeterminate', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const pb = document.createElement('mth-progress-bar');
      pb.id = 'test-progress';
      pb.setAttribute('label', 'Upload');
      pb.setAttribute('value', '60');
      pb.setAttribute('max', '100');
      pb.style.inlineSize = '300px';
      root.append(pb);
    });

    const det = await page.evaluate(() => {
      const pb = document.getElementById('test-progress')!;
      const track = pb.shadowRoot!.querySelector<HTMLElement>('[part="track"]')!;
      const fill = pb.shadowRoot!.querySelector<HTMLElement>('[part="fill"]')!;
      return {
        ariaValueNow: track.getAttribute('aria-valuenow'),
        trackWidth: track.getBoundingClientRect().width,
        fillWidth: fill.getBoundingClientRect().width,
      };
    });
    expect(det.ariaValueNow).toBe('60');
    expect(det.trackWidth).toBeGreaterThan(200);
    expect(det.fillWidth).toBeGreaterThan(det.trackWidth * 0.5);
    expect(det.fillWidth).toBeLessThan(det.trackWidth * 0.7);

    await page.evaluate(() => {
      document.getElementById('test-progress')!.setAttribute('indeterminate', '');
    });
    const indet = await page.evaluate(() => {
      const pb = document.getElementById('test-progress')!;
      const track = pb.shadowRoot!.querySelector<HTMLElement>('[part="track"]')!;
      return {
        hasValueNow: track.hasAttribute('aria-valuenow'),
        matchesState: pb.matches(':state(indeterminate)'),
      };
    });
    expect(indet.hasValueNow).toBe(false);
    expect(indet.matchesState).toBe(true);
    assertNoErrors(errors);
  });

  test('<mth-badge> renders distinct semantic variants with non-zero bounding boxes', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';

      for (const variant of ['neutral', 'accent', 'success', 'warning', 'danger']) {
        const badge = document.createElement('mth-badge');
        badge.id = `badge-${variant}`;
        badge.setAttribute('variant', variant);
        badge.textContent = variant;
        row.append(badge);
      }
      root.append(row);
    });

    const metrics = await page.evaluate(() => {
      const out: Record<string, { w: number; h: number; bg: string }> = {};
      for (const variant of ['neutral', 'accent', 'success', 'warning', 'danger']) {
        const base = document
          .getElementById(`badge-${variant}`)!
          .shadowRoot!.querySelector<HTMLElement>('[part="base"]')!;
        const rect = base.getBoundingClientRect();
        out[variant] = {
          w: rect.width,
          h: rect.height,
          bg: getComputedStyle(base).backgroundColor,
        };
      }
      return out;
    });

    for (const m of Object.values(metrics)) {
      expect(m.w).toBeGreaterThan(10);
      expect(m.h).toBeGreaterThan(10);
    }
    expect(metrics['accent']!.bg).not.toBe(metrics['danger']!.bg);
    expect(metrics['success']!.bg).not.toBe(metrics['warning']!.bg);
    assertNoErrors(errors);
  });
});
