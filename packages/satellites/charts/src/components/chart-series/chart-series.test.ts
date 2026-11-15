import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MTH_CHART_TYPES,
  MthChartSeries,
  chartSeriesSpec,
  registerMthChartSeries,
} from './index.js';

describe('<mth-chart-series>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, parses data-json, exposes all 19 chart types, and passes HydrationPuritySuite', async () => {
    expect(MTH_CHART_TYPES).toHaveLength(19);
    const compiled = compileSpec(chartSeriesSpec);
    expect(compiled.docs).toContain('`<mth-chart-series>`');

    const report = await runBehaviorSpecAssertions(chartSeriesSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const series = document.createElement('mth-chart-series') as MthChartSeries;
    series.type = 'donut';
    series.name = 'Revenue';
    series.dataJson = '[10, 20, 30]';
    document.body.appendChild(series);
    await series.updateComplete;

    expect(series.getResolvedData()).toEqual([10, 20, 30]);

    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-chart-series type="bar" name="Sales" data-json="[1,2,3]"></mth-chart-series>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-chart-series>', 'hyd-chart-series>')
      .replaceAll('<mth-chart-series', '<hyd-chart-series');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthChartSeries('hyd');
        customElements.upgrade(host);
        await (host as MthChartSeries).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
