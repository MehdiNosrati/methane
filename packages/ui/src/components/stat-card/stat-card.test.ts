import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthStatCard, registerMthStatCard, statCardSpec } from './index.js';

describe('<mth-stat-card>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, formats numeric KPI values, and passes same-root ARIA', async () => {
    const compiled = compileSpec(statCardSpec);
    expect(compiled.docs).toContain('`<mth-stat-card>`');

    const report = await runBehaviorSpecAssertions(statCardSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const card = document.createElement('mth-stat-card') as MthStatCard;
    card.label = 'Monthly Revenue';
    card.value = '12840';
    card.format = 'currency';
    card.currency = 'USD';
    card.delta = '+14.2%';
    card.trend = 'up';
    card.hint = 'vs previous 30 days';
    document.body.appendChild(card);
    await card.updateComplete;

    expect(card.shadowRoot!.querySelector('[part="value"]')?.textContent).toContain('$12,840');
    expect(card.shadowRoot!.querySelector('[part="trend"]')?.textContent).toContain('Increase:');
    expect(card.shadowRoot!.querySelector('[part="trend"]')?.textContent).toContain('+14.2%');
    expect(scanSameRootAria(card.shadowRoot!).valid).toBe(true);
  });

  it('supports compact and percent formats and passes HydrationPuritySuite', async () => {
    const card = document.createElement('mth-stat-card') as MthStatCard;
    card.label = 'Conversion';
    card.value = '0.245';
    card.format = 'percent';
    card.trend = 'down';
    card.delta = '-1.1%';
    document.body.appendChild(card);
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector('[part="value"]')?.textContent).toContain('25%');

    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-stat-card label="Active Users" value="15400" format="compact" delta="+8%" trend="up"></mth-stat-card>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-stat-card>', 'hyd-stat-card>')
      .replaceAll('<mth-stat-card', '<hyd-stat-card');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthStatCard('hyd');
        customElements.upgrade(host);
        await (host as MthStatCard).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
