import { runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthProductCard, productCardSpec, registerMthProductCard } from './index.js';

describe('<mth-product-card>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders product metadata, sanitizes unsafe image/link URLs, and emits add-to-cart', async () => {
    const report = await runBehaviorSpecAssertions(productCardSpec, {});
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-product-card') as MthProductCard;
    el.title = 'Mechanical Keyboard';
    el.price = 149;
    el.compareAtPrice = 199;
    el.locale = 'en-US';
    el.imageSrc = 'javascript:alert(1)';
    el.href = 'data:text/html,evil';
    el.rating = 4.8;
    el.reviewCount = 42;
    document.body.append(el);
    await el.updateComplete;

    expect(el.hasCustomState('on-sale')).toBe(true);
    expect(el.shadowRoot!.querySelector('img')).toBeNull();
    expect(el.shadowRoot!.querySelector('a')).toBeNull();
    expect(el.shadowRoot!.querySelector('.current-price')?.textContent?.trim()).toBe('$149.00');

    let detail: unknown = null;
    el.addEventListener('mth-add-to-cart', (e) => {
      detail = (e as CustomEvent).detail;
    });
    el.shadowRoot!.querySelector<HTMLElement>('[part="action"]')?.click();
    expect(detail).toEqual({ title: 'Mechanical Keyboard', price: 149, currency: 'USD' });
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite cleanly', async () => {
    registerMthProductCard();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-product-card title="Headphones" price="89" locale="en-US"></mth-product-card>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-product-card>', 'hyd-product-card>')
      .replaceAll('<mth-product-card', '<hyd-product-card');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthProductCard('hyd');
        customElements.upgrade(host);
        await (host as MthProductCard).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
