import { runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { priceDisplaySpec } from './price-display.spec.js';
import { MthPriceDisplay, registerMthPriceDisplay } from './index.js';

describe('<mth-price-display>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('formats currency with Intl.NumberFormat and renders compare-at discount badge', async () => {
    const report = await runBehaviorSpecAssertions(priceDisplaySpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-price-display') as MthPriceDisplay;
    el.amount = 75;
    el.compareAtAmount = 100;
    el.currency = 'USD';
    el.locale = 'en-US';
    el.period = '/mo';
    document.body.append(el);
    await el.updateComplete;

    expect(el.hasCustomState('on-sale')).toBe(true);
    expect(el.shadowRoot!.querySelector('[part="current"]')?.textContent?.trim()).toBe('$75.00');
    expect(
      el.shadowRoot!.querySelector('[part="discount"]')?.textContent?.trim().replace(/[\u2066-\u2069]/g, ''),
    ).toBe('Save 25%');
    expect(el.shadowRoot!.querySelector('[part="period"]')?.textContent?.trim()).toBe('/mo');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite cleanly', async () => {
    registerMthPriceDisplay();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-price-display amount="49.99" currency="EUR" locale="en-US"></mth-price-display>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-price-display>', 'hyd-price-display>')
      .replaceAll('<mth-price-display', '<hyd-price-display');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPriceDisplay('hyd');
        customElements.upgrade(host);
        await (host as MthPriceDisplay).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
