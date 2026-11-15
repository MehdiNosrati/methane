import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { MTH_CHART_TYPES } from '../shared/chart-types.js';
import {
  MthChartSeries,
  registerMthChartSeries,
} from '@methane/charts/chart-series';
import {
  MthChart,
  chartSpec,
  mapMthChartTypeToEChartsSeries,
  registerMthChart,
} from './index.js';

describe('<mth-chart>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes behavior spec assertions', async () => {
    const compiled = compileSpec(chartSpec);
    expect(compiled.docs).toContain('`<mth-chart>`');

    registerMthChart();
    const report = await runBehaviorSpecAssertions(chartSpec, {
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-chart') as MthChart;
          el.renderer = 'svg';
          el.type = 'line';
          el.data = [1, 2, 3];
          return el;
        },
        cycles: 5,
        tokenName: '--mth-color-accent',
        tokenValue: 'oklch(0.6 0.2 250)',
        readAppliedToken: (el, tokenName) => (el as MthChart).getAppliedToken(tokenName),
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('maps all 19 chart types into modular ECharts series options', () => {
    expect(MTH_CHART_TYPES).toHaveLength(19);
    for (const chartType of MTH_CHART_TYPES) {
      const series = mapMthChartTypeToEChartsSeries({
        name: `Series ${chartType}`,
        type: chartType,
        data: [10, 20, 30],
      });
      expect(typeof series.type).toBe('string');
      expect(series.name).toBe(`Series ${chartType}`);
    }
  });

  it('consumes declarative <mth-chart-series>, <table slot="fallback">, sanitizes tooltips, and respects RTL', async () => {
    registerMthChart();
    registerMthChartSeries();

    const chart = document.createElement('mth-chart') as MthChart;
    chart.chartTitle = 'Revenue <script>alert(1)</script>';
    chart.dir = 'rtl';
    chart.categories = ['Q1', 'Q2'];

    const series = document.createElement('mth-chart-series') as MthChartSeries;
    series.name = 'Sales';
    series.type = 'donut';
    series.data = [
      { name: 'North', value: 42 },
      { name: 'South', value: 58 },
    ];
    chart.appendChild(series);

    const table = document.createElement('table');
    table.setAttribute('slot', 'fallback');
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.textContent = '42';
    row.appendChild(cell);
    table.appendChild(row);
    chart.appendChild(table);

    document.body.appendChild(chart);
    await chart.updateComplete;

    expect(chart.engine).not.toBeNull();
    const builtOption = chart.buildEChartsOption();
    expect(Array.isArray(builtOption.series)).toBe(true);
    expect((builtOption.series as Array<Record<string, unknown>>)[0]?.type).toBe('pie');
    const tooltip = builtOption.tooltip as { formatter?: (p: unknown) => string };
    expect(tooltip.formatter?.({ seriesName: '<b>X</b>', name: 'A', value: 1 })).toContain('&lt;b&gt;X&lt;/b&gt;');

    const rootAria = scanSameRootAria(chart.shadowRoot!);
    expect(rootAria.valid).toBe(true);
    expect(rootAria.issues).toEqual([]);
  });

  it('passes SatelliteEngineSuite 50x mount/unmount disposal and token sync checks', async () => {
    registerMthChart();
    const result = await SatelliteEngineSuite.run({
      createElement: () => {
        const el = document.createElement('mth-chart') as MthChart;
        el.renderer = 'svg';
        el.type = 'bar';
        el.data = [5, 10, 15];
        return el;
      },
      cycles: 50,
      tokenName: '--mth-color-accent',
      tokenValue: 'oklch(0.6 0.2 250)',
      readAppliedToken: (el, tokenName) => {
        return (el as MthChart).getAppliedToken(tokenName);
      },
    });
    expect(result.failures).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('passes HydrationPuritySuite with declarative series and fallback table', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-chart chart-title="Sales" type="line" data-json="[1,2,3]"><table slot="fallback"><tbody><tr><td>1</td></tr></tbody></table></mth-chart>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-chart>', 'hyd-chart>')
      .replaceAll('<mth-chart', '<hyd-chart');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthChart('hyd');
        customElements.upgrade(host);
        await (host as MthChart).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
