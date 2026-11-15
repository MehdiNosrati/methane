import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dateRangeCalendarSpec } from './date-range-calendar.spec.js';
import { MthDateRangeCalendar, registerMthDateRangeCalendar } from './index.js';

describe('<mth-date-range-calendar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('compiles spec, passes assertions, selects chronological date ranges across two months, and swaps reversed clicks', async () => {
    const compiled = compileSpec(dateRangeCalendarSpec);
    expect(compiled.docs).toContain('`<mth-date-range-calendar>`');

    const report = await runBehaviorSpecAssertions(dateRangeCalendarSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-date-range-calendar') as MthDateRangeCalendar;
    el.start = '2026-07-10';
    el.months = 2;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).valid).toBe(true);
    expect(el.shadowRoot!.querySelectorAll('[part="month"]')).toHaveLength(2);

    const changeSpy = vi.fn();
    el.addEventListener('mth-change', changeSpy);

    // Click end date in second visible month (August 2026)
    const augDay = el.shadowRoot!.querySelector<HTMLButtonElement>(
      'button[data-iso="2026-08-05"][data-outside="false"]',
    )!;
    augDay.click();
    await el.updateComplete;

    expect(el.start).toBe('2026-07-10');
    expect(el.end).toBe('2026-08-05');
    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect((changeSpy.mock.calls[0]![0] as CustomEvent<{ start: string; end: string }>).detail).toEqual({
      start: '2026-07-10',
      end: '2026-08-05',
    });

    // Mid-range day is highlighted
    const midDay = el.shadowRoot!.querySelector<HTMLButtonElement>(
      'button[data-iso="2026-07-20"][data-outside="false"]',
    )!;
    expect(midDay.getAttribute('data-in-range')).toBe('true');

    // Start a fresh range with reversed second click -> swaps into chronological order
    el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-07-25"][data-outside="false"]')!.click();
    await el.updateComplete;
    expect(el.start).toBe('2026-07-25');
    expect(el.end).toBe('');

    el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-07-12"][data-outside="false"]')!.click();
    await el.updateComplete;
    expect(el.start).toBe('2026-07-12');
    expect(el.end).toBe('2026-07-25');
  });

  it('supports keyboard navigation, RTL direction, and passes HydrationPuritySuite', async () => {
    const el = document.createElement('mth-date-range-calendar') as MthDateRangeCalendar;
    el.start = '2026-07-15';
    el.dir = 'rtl';
    document.body.appendChild(el);
    await el.updateComplete;

    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-07-15"][data-outside="false"]')!;
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector<HTMLButtonElement>('button[data-iso="2026-07-14"][data-outside="false"]')?.tabIndex,
    ).toBe(0);

    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-date-range-calendar start="2026-07-10" end="2026-07-15" months="1"></mth-date-range-calendar>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');
    const ssrHtml = rawSsr
      .replaceAll('mth-date-range-calendar>', 'hyd-date-range-calendar>')
      .replaceAll('<mth-date-range-calendar', '<hyd-date-range-calendar');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDateRangeCalendar('hyd');
        customElements.upgrade(host);
        await (host as MthDateRangeCalendar).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
