import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, SatelliteEngineSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthPivotTable, pivotTableSpec, registerMthPivotTable } from './index.js';

describe('<mth-pivot-table>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, pivot aggregation, and group toggle', async () => {
    const compiled = compileSpec(pivotTableSpec);
    expect(compiled.tests).toContain('<mth-pivot-table>');

    const specReport = await runBehaviorSpecAssertions(pivotTableSpec, {
      satellite: {
        createElement: () => document.createElement('mth-pivot-table') as MthPivotTable,
        readAppliedToken: (el, tokenName) =>
          (el as MthPivotTable).engine?.getAppliedToken(tokenName) ?? '',
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-pivot-table') as MthPivotTable,
      readAppliedToken: (el, tokenName) =>
        (el as MthPivotTable).engine?.getAppliedToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const el = document.createElement('mth-pivot-table') as MthPivotTable;
    el.rowDimensions = ['region'];
    el.columnDimensions = ['quarter'];
    el.valueFields = ['revenue'];
    el.rows = [
      { region: 'EMEA', quarter: 'Q1', revenue: 100 },
      { region: 'EMEA', quarter: 'Q2', revenue: 150 },
      { region: 'APAC', quarter: 'Q1', revenue: 200 },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);

    const matrix = el.engine!.computePivotMatrix();
    expect(matrix.columnKeys).toEqual(['Q1', 'Q2']);
    expect(matrix.overallTotal).toBe(450);
    expect(matrix.grandTotals).toEqual({ Q1: 300, Q2: 150 });

    const toggles: unknown[] = [];
    el.addEventListener('mth-group-toggle', (ev) => toggles.push((ev as CustomEvent).detail));
    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.group-toggle')!;
    btn.click();
    await el.updateComplete;
    expect(toggles).toEqual([{ groupKey: 'EMEA', expanded: true }]);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-pivot-table label="Revenue"><span slot="fallback">Pivot fallback</span></mth-pivot-table>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-pivot-table>', 'hyd-pivot-table>')
      .replaceAll('<mth-pivot-table', '<hyd-pivot-table');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPivotTable('hyd');
        customElements.upgrade(host);
        await (host as MthPivotTable).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
