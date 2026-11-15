import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MthCalendar, calendarSpec, registerMthCalendar } from './index.js';

describe('<mth-calendar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('compiles spec, passes assertions, selects dates, and enforces min/max + disabled predicates', async () => {
    const compiled = compileSpec(calendarSpec);
    expect(compiled.docs).toContain('`<mth-calendar>`');

    const report = await runBehaviorSpecAssertions(calendarSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-calendar') as MthCalendar;
    el.value = '2026-06-15';
    el.min = '2026-06-10';
    el.max = '2026-06-20';
    el.isDateDisabled = (iso) => iso === '2026-06-17';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).valid).toBe(true);
    expect(el.shadowRoot!.querySelector('button[data-iso="2026-06-15"]')?.getAttribute('data-selected')).toBe('true');
    expect(el.shadowRoot!.querySelector('button[data-iso="2026-06-05"]')?.getAttribute('aria-disabled')).toBe('true');
    expect(el.shadowRoot!.querySelector('button[data-iso="2026-06-17"]')?.getAttribute('aria-disabled')).toBe('true');

    const changeSpy = vi.fn();
    el.addEventListener('mth-change', changeSpy);

    // Disabled day cannot be selected
    el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-06-17"]')!.click();
    await el.updateComplete;
    expect(el.value).toBe('2026-06-15');
    expect(changeSpy).not.toHaveBeenCalled();

    // Enabled day selects and emits mth-change
    el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-06-18"]')!.click();
    await el.updateComplete;
    expect(el.value).toBe('2026-06-18');
    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect((changeSpy.mock.calls[0]![0] as CustomEvent<{ value: string }>).detail).toEqual({
      value: '2026-06-18',
    });
  });

  it('supports LTR/RTL 2D grid keyboard navigation and passes HydrationPuritySuite', async () => {
    const el = document.createElement('mth-calendar') as MthCalendar;
    el.value = '2026-06-15';
    document.body.appendChild(el);
    await el.updateComplete;

    const startBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-06-15"]')!;
    startBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-06-16"]')?.tabIndex).toBe(0);

    // Down arrow moves +7 days
    const btn16 = el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-06-16"]')!;
    btn16.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-06-23"]')?.tabIndex).toBe(0);

    // RTL reverses ArrowRight/ArrowLeft
    el.dir = 'rtl';
    await el.updateComplete;
    const btn23 = el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-06-23"]')!;
    btn23.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-06-22"]')?.tabIndex).toBe(0);

    const rawSsr = await renderLitDsdHtml(litHtml`<mth-calendar value="2026-06-15"></mth-calendar>`);
    expect(rawSsr).toContain('shadowrootmode="open"');
    const ssrHtml = rawSsr
      .replaceAll('mth-calendar>', 'hyd-calendar>')
      .replaceAll('<mth-calendar', '<hyd-calendar');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCalendar('hyd');
        customElements.upgrade(host);
        await (host as MthCalendar).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
