import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { eventCalendarSpec } from './event-calendar.spec.js';
import { MthEventCalendar, registerMthEventCalendar, type CalendarEvent } from './index.js';

describe('<mth-event-calendar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite (LTR + RTL)', async () => {
    registerMthEventCalendar();
    const compiled = compileSpec(eventCalendarSpec);
    expect(compiled.docs).toContain('`<mth-event-calendar>`');

    const rovingAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-event-calendar') as MthEventCalendar;
        el.dir = dir;
        el.view = 'week';
        el.activeDate = '2026-11-15';
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.day-trigger')),
      orientation: 'horizontal' as const,
      loop: true,
    };

    const report = await RovingFocusSuite.run(rovingAdapter);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(eventCalendarSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('renders localized month grid, selects events, and creates new slots', async () => {
    registerMthEventCalendar();
    const el = document.createElement('mth-event-calendar') as MthEventCalendar;
    el.activeDate = '2026-11-15';
    el.events = [
      { id: 'ev1', title: 'Design sync', date: '2026-11-15', startTime: '10:00' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    let selected: CalendarEvent | undefined;
    let created: { date: string; time?: string } | undefined;
    el.addEventListener('mth-event-select', ((e: CustomEvent) => {
      selected = e.detail.event;
    }) as EventListener);
    el.addEventListener('mth-event-create', ((e: CustomEvent) => {
      created = e.detail;
    }) as EventListener);

    const chip = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="event-chip"]');
    expect(chip).not.toBeNull();
    chip?.click();
    expect(selected?.id).toBe('ev1');

    const day15 = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '[data-date="2026-11-15"] .add-btn',
    );
    day15?.click();
    expect(created?.date).toBe('2026-11-15');

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-event-calendar active-date="2026-11-15" view="month"></mth-event-calendar>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-event-calendar>', 'hyd-event-calendar>')
      .replaceAll('<mth-event-calendar', '<hyd-event-calendar');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthEventCalendar('hyd');
        customElements.upgrade(host);
        await (host as MthEventCalendar).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
