import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthSparkline, registerMthSparkline, sparklineSpec } from './index.js';

describe('<mth-sparkline>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, renders accessible SVG with title/desc/summary, and passes same-root ARIA', async () => {
    const compiled = compileSpec(sparklineSpec);
    expect(compiled.docs).toContain('`<mth-sparkline>`');

    const report = await runBehaviorSpecAssertions(sparklineSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const spark = document.createElement('mth-sparkline') as MthSparkline;
    spark.label = 'Weekly Latency';
    spark.values = [12, 18, 10, 24];
    spark.type = 'area';
    spark.showPoints = true;
    document.body.appendChild(spark);
    await spark.updateComplete;

    const svgEl = spark.shadowRoot!.querySelector('svg');
    expect(svgEl?.getAttribute('role')).toBe('img');
    expect(svgEl?.getAttribute('aria-label')).toBe('Weekly Latency');
    expect(spark.shadowRoot!.querySelector('#mth-spark-title')?.textContent).toBe('Weekly Latency');
    const descText = (svgEl?.querySelector('desc')?.textContent ?? '').replace(/[\u2068\u2069]/g, '');
    expect(descText).toContain('4 points, minimum 10, maximum 24, latest 24');
    expect(svgEl?.querySelector('polygon')).not.toBeNull();
    expect(svgEl?.querySelector('polyline')).not.toBeNull();
    expect(svgEl?.querySelectorAll('circle').length).toBe(4);
    expect(scanSameRootAria(spark.shadowRoot!).valid).toBe(true);
  });

  it('supports bar mode, empty fallback, and passes HydrationPuritySuite', async () => {
    const spark = document.createElement('mth-sparkline') as MthSparkline;
    spark.type = 'bar';
    spark.data = '5, 10, 15';
    document.body.appendChild(spark);
    await spark.updateComplete;
    expect(spark.shadowRoot!.querySelectorAll('rect').length).toBe(3);

    spark.data = '';
    await spark.updateComplete;
    expect(spark.shadowRoot!.querySelector('[part="summary"]')?.textContent).toContain('No data points available');

    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-sparkline label="Traffic" data="10,20,15,30" type="line"></mth-sparkline>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-sparkline>', 'hyd-sparkline>')
      .replaceAll('<mth-sparkline', '<hyd-sparkline');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSparkline('hyd');
        customElements.upgrade(host);
        await (host as MthSparkline).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
