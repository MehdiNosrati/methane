import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, SatelliteEngineSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthGantt, ganttSpec, registerMthGantt } from './index.js';

describe('<mth-gantt>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, task layout, milestones, and dependency SVG', async () => {
    const compiled = compileSpec(ganttSpec);
    expect(compiled.tests).toContain('<mth-gantt>');

    const specReport = await runBehaviorSpecAssertions(ganttSpec, {
      satellite: {
        createElement: () => document.createElement('mth-gantt') as MthGantt,
        readAppliedToken: (el, tokenName) =>
          (el as MthGantt).engine?.getAppliedToken(tokenName) ?? '',
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-gantt') as MthGantt,
      readAppliedToken: (el, tokenName) =>
        (el as MthGantt).engine?.getAppliedToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const el = document.createElement('mth-gantt') as MthGantt;
    el.startDate = '2026-01-01';
    el.days = 10;
    el.tasks = [
      { id: 't1', title: 'Spec', startDate: '2026-01-01', endDate: '2026-01-03', progress: 100 },
      {
        id: 't2" ] { color: red; }',
        title: 'Launch',
        startDate: '2026-01-04',
        endDate: '2026-01-04',
        milestone: true,
        dependencies: ['t1'],
      },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    expect(el.engine!.getLayouts().length).toBe(2);
    expect(el.engine!.getDependencyPaths().length).toBe(1);
    expect(el.shadowRoot!.querySelector('.dependencies-layer path')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('[part="milestone"]')).not.toBeNull();

    const selected: unknown[] = [];
    el.addEventListener('mth-task-select', (ev) => selected.push((ev as CustomEvent).detail));
    el.shadowRoot!.querySelector<HTMLButtonElement>('.task-bar')!.click();
    expect(selected.length).toBe(1);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-gantt label="Roadmap"><span slot="fallback">Gantt fallback</span></mth-gantt>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-gantt>', 'hyd-gantt>')
      .replaceAll('<mth-gantt', '<hyd-gantt');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthGantt('hyd');
        customElements.upgrade(host);
        await (host as MthGantt).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
