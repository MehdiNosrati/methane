import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, SatelliteEngineSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthScheduler, registerMthScheduler, schedulerSpec } from './index.js';

describe('<mth-scheduler>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, timeline events, and RTL navigation', async () => {
    const compiled = compileSpec(schedulerSpec);
    expect(compiled.tests).toContain('<mth-scheduler>');

    const specReport = await runBehaviorSpecAssertions(schedulerSpec, {
      satellite: {
        createElement: () => document.createElement('mth-scheduler') as MthScheduler,
        readAppliedToken: (el, tokenName) =>
          (el as MthScheduler).engine?.getAppliedToken(tokenName) ?? '',
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-scheduler') as MthScheduler,
      readAppliedToken: (el, tokenName) =>
        (el as MthScheduler).engine?.getAppliedToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const el = document.createElement('mth-scheduler') as MthScheduler;
    el.startDate = '2026-01-05';
    el.days = 5;
    el.resources = [{ id: 'room-a', label: 'Room A' }];
    el.events = [
      {
        id: 'ev" ] { color: red; }',
        resourceId: 'room-a',
        title: 'Design sync',
        startDate: '2026-01-06',
        endDate: '2026-01-07',
      },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    expect(el.engine!.getTimelineColumns().length).toBe(5);
    expect(el.shadowRoot!.querySelector('.header-row .track')?.getAttribute('role')).toBe('presentation');
    expect(el.shadowRoot!.querySelector('.body-row .track')?.getAttribute('role')).toBe('gridcell');
    expect(el.shadowRoot!.querySelector('.body-row .day-cell')?.getAttribute('aria-hidden')).toBe('true');

    const selected: unknown[] = [];
    el.addEventListener('mth-event-select', (ev) => selected.push((ev as CustomEvent).detail));
    el.shadowRoot!.querySelector<HTMLButtonElement>('.event-bar')!.click();
    expect(selected.length).toBe(1);

    el.setAttribute('dir', 'rtl');
    const navDates: string[] = [];
    el.addEventListener('mth-date-navigate', (ev) =>
      navDates.push(((ev as CustomEvent).detail as { date: string }).date),
    );
    const row = el.shadowRoot!.querySelector<HTMLElement>('.body-row')!;
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(navDates).toEqual(['2026-01-04']);

    const sheetCount = el.shadowRoot!.adoptedStyleSheets.length;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.adoptedStyleSheets.length).toBe(sheetCount);
    expect(el.engine!.getTimelineColumns().length).toBe(5);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-scheduler label="Team schedule"><span slot="fallback">Schedule fallback</span></mth-scheduler>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-scheduler>', 'hyd-scheduler>')
      .replaceAll('<mth-scheduler', '<hyd-scheduler');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthScheduler('hyd');
        customElements.upgrade(host);
        await (host as MthScheduler).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
