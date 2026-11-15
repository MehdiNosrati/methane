import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { calendarHeatmapSpec } from './calendar-heatmap.spec.js';
import { MthCalendarHeatmap, registerMthCalendarHeatmap } from './index.js';

describe('<mth-calendar-heatmap>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite (LTR & RTL) + same-root ARIA', async () => {
    const compiled = compileSpec(calendarHeatmapSpec);
    expect(compiled.docs).toContain('`<mth-calendar-heatmap>`');

    const rovingAdapter = {
      orientation: 'horizontal' as const,
      loop: false,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const hm = document.createElement('mth-calendar-heatmap') as MthCalendarHeatmap;
        hm.setAttribute('dir', dir);
        hm.endDate = '2026-03-31';
        hm.weeks = 4;
        hm.values = [{ date: '2026-03-30', count: 5 }];
        document.body.appendChild(hm);
        await hm.updateComplete;
        return hm;
      },
      getItems: (container: HTMLElement) => (container as MthCalendarHeatmap).getCells(),
    };

    const specReport = await runBehaviorSpecAssertions(calendarHeatmapSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovingReport.failures).toEqual([]);
    expect(rovingReport.passed).toBe(true);
  });

  it('quantizes levels, supports 2D ArrowDown/ArrowUp, and emits mth-select', async () => {
    const hm = document.createElement('mth-calendar-heatmap') as MthCalendarHeatmap;
    hm.endDate = '2026-03-28';
    hm.weeks = 2;
    hm.values = [
      { date: '2026-03-27', count: 4 },
      { date: '2026-03-28', count: 10 },
    ];
    document.body.appendChild(hm);
    await hm.updateComplete;

    const cells = hm.getCells();
    expect(cells.length).toBe(14);

    const maxCell = cells.find((c) => c.dataset.date === '2026-03-28');
    expect(maxCell?.dataset.level).toBe('4');

    const selectedEvents: Array<{ date: string; count: number }> = [];
    hm.addEventListener('mth-select', (e) => {
      selectedEvents.push((e as CustomEvent<{ date: string; count: number }>).detail);
    });

    cells[0]!.focus();
    cells[0]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
    );
    await hm.updateComplete;
    expect(cells[2]!.tabIndex).toBe(0);

    maxCell!.click();
    await hm.updateComplete;
    expect(hm.selectedDate).toBe('2026-03-28');
    expect(selectedEvents).toEqual([{ date: '2026-03-28', count: 10 }]);
    expect(scanSameRootAria(hm.shadowRoot!).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-calendar-heatmap end-date="2026-03-28" weeks="4" data="2026-03-27:3,2026-03-28:8"></mth-calendar-heatmap>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-calendar-heatmap>', 'hyd-calendar-heatmap>')
      .replaceAll('<mth-calendar-heatmap', '<hyd-calendar-heatmap');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCalendarHeatmap('hyd');
        customElements.upgrade(host);
        await (host as MthCalendarHeatmap).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
