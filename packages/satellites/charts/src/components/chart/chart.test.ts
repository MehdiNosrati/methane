import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MTH_CHART_TYPES } from '../shared/chart-types.js';
import {
  MthChartSeries,
  registerMthChartSeries,
} from '@methane-ui/charts/chart-series';
import { chartSpec } from './chart.spec.js';
import { MthChart, mapMthChartTypeToEChartsSeries, registerMthChart } from './index.js';

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

    // Live <mth-chart-series> updates trigger mth-series-change -> option refresh
    series.data = [99, 101];
    await series.updateComplete;
    const updatedSeries = (chart.engine?.getOption()?.series ?? []) as Array<{ data?: unknown }>;
    expect(updatedSeries[0]?.data).toEqual([99, 101]);

    // Same-instance remove() -> appendChild() reconnect lifecycle
    chart.remove();
    expect(chart.engine).toBeNull();
    document.body.appendChild(chart);
    await chart.updateComplete;
    expect(chart.engine).not.toBeNull();
    expect(chart.engine?.disposed).toBe(false);
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

  it('parses categories-json and data-json attributes into cartesian ECharts option', async () => {
    registerMthChart();
    const chart = document.createElement('mth-chart') as MthChart;
    chart.type = 'bar';
    chart.chartTitle = 'Units';
    chart.setAttribute('categories-json', '["Jan","Feb","Mar"]');
    chart.setAttribute('data-json', '[12, 18, 24]');
    document.body.appendChild(chart);
    await chart.updateComplete;

    const opt = chart.buildEChartsOption() as {
      xAxis?: { data?: string[] };
      series?: Array<{ type: string; data: unknown[] }>;
    };
    expect(opt.xAxis?.data).toEqual(['Jan', 'Feb', 'Mar']);
    expect(opt.series?.[0]?.type).toBe('bar');
    expect(opt.series?.[0]?.data).toEqual([12, 18, 24]);
  });

  it('filters hidden series and applies showLegend/showTooltip flags', async () => {
    registerMthChart();
    const chart = document.createElement('mth-chart') as MthChart;
    chart.showLegend = false;
    chart.showTooltip = false;
    chart.series = [
      { name: 'Visible', type: 'line', data: [1, 2] },
      { name: 'Hidden', type: 'line', data: [3, 4], hidden: true },
    ];
    document.body.appendChild(chart);
    await chart.updateComplete;

    const opt = chart.buildEChartsOption() as {
      legend?: { show: boolean };
      tooltip?: { show: boolean };
      series?: Array<{ name: string }>;
    };
    expect(opt.legend?.show).toBe(false);
    expect(opt.tooltip?.show).toBe(false);
    expect(opt.series?.map((s) => s.name)).toEqual(['Visible']);
  });

  it('reflects loading and empty custom states and supports custom option overrides', async () => {
    registerMthChart();
    const chart = document.createElement('mth-chart') as MthChart;
    chart.loading = true;
    chart.empty = true;
    chart.option = { backgroundColor: 'transparent' };
    document.body.appendChild(chart);
    await chart.updateComplete;

    expect(chart.hasCustomState('loading')).toBe(true);
    expect(chart.hasCustomState('empty')).toBe(true);
    expect((chart.buildEChartsOption() as { backgroundColor?: string }).backgroundColor).toBe(
      'transparent',
    );
  });

  it('disables chart animation under prefers-reduced-motion: reduce', async () => {
    registerMthChart();
    const origMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    try {
      const chart = document.createElement('mth-chart') as MthChart;
      chart.data = [1, 2, 3];
      document.body.appendChild(chart);
      await chart.updateComplete;

      expect(chart.hasCustomState('reduced-motion')).toBe(true);
      expect(chart.buildEChartsOption().animation).toBe(false);
    } finally {
      window.matchMedia = origMatchMedia;
    }
  });

  it('emits mth-chart-ready after lazy mount and re-renders when renderer changes', async () => {
    registerMthChart();
    const chart = document.createElement('mth-chart') as MthChart;
    chart.renderer = 'svg';
    chart.data = [10, 20];
    const readyEvents: Array<{ renderer: string; mode: string }> = [];
    const renderEvents: Array<{ seriesCount: number }> = [];
    chart.addEventListener('mth-chart-ready', (ev) => {
      readyEvents.push((ev as CustomEvent<{ renderer: string; mode: string }>).detail);
    });
    chart.addEventListener('mth-chart-render', (ev) => {
      renderEvents.push((ev as CustomEvent<{ seriesCount: number }>).detail);
    });

    document.body.appendChild(chart);
    await chart.updateComplete;
    await vi.waitFor(() => {
      expect(readyEvents.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 2000 });
    expect(readyEvents[0]?.renderer).toBe('svg');
    const rendersBefore = renderEvents.length;

    chart.renderer = 'canvas';
    await chart.updateComplete;
    expect(chart.getAttribute('renderer')).toBe('canvas');
    expect(renderEvents.length).toBeGreaterThan(rendersBefore);
  });

  it('omits cartesian grid/axes for non-cartesian chart types like pie and gauge', async () => {
    registerMthChart();
    const chart = document.createElement('mth-chart') as MthChart;
    chart.type = 'pie';
    chart.data = [{ name: 'A', value: 100 }];
    document.body.appendChild(chart);
    await chart.updateComplete;

    const opt = chart.buildEChartsOption() as { xAxis?: unknown; yAxis?: unknown };
    expect(opt.xAxis).toBeUndefined();
    expect(opt.yAxis).toBeUndefined();
  });

  it('merges custom setChartOption updates onto the headless engine handle', async () => {
    registerMthChart();
    const chart = document.createElement('mth-chart') as MthChart;
    chart.data = [1, 2];
    document.body.appendChild(chart);
    await chart.updateComplete;

    chart.setChartOption({ title: { text: 'Updated' } });
    expect((chart.engine?.getOption() as { title?: { text?: string } })?.title?.text).toBe(
      'Updated',
    );
  });

  it('escapes HTML in aria description and tooltip formatter for XSS safety', async () => {
    registerMthChart();
    const chart = document.createElement('mth-chart') as MthChart;
    chart.chartTitle = '<img onerror=alert(1)>';
    chart.data = [5];
    document.body.appendChild(chart);
    await chart.updateComplete;

    const opt = chart.buildEChartsOption() as {
      aria?: { label?: { description?: string } };
      tooltip?: { formatter?: (p: unknown) => string };
    };
    expect(opt.aria?.label?.description).toContain('&lt;img');
    expect(opt.tooltip?.formatter?.([{ seriesName: 'S', name: '<em>N</em>', value: 5 }])).toContain(
      '&lt;em&gt;N&lt;/em&gt;',
    );
  });
});
