import { runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { cartSpec, MthCart, registerMthCart } from './index.js';

describe('<mth-cart>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, computes totals, sanitizes URLs, and emits quantity/remove/checkout events', async () => {
    const report = await runBehaviorSpecAssertions(cartSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-cart') as MthCart;
    el.currency = 'USD';
    el.locale = 'en-US';
    el.taxRate = 0.1;
    el.shippingAmount = 5;
    el.discountAmount = 10;
    el.items = [
      {
        id: 'sku-1',
        title: 'Keyboard',
        variant: 'Tactile',
        price: 50,
        quantity: 2,
        image: 'javascript:alert(1)',
        href: 'javascript:alert(2)',
      },
    ];
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('img.thumb')).toBeNull();
    expect(el.shadowRoot!.querySelector('a.title')).toBeNull();
    expect(el.shadowRoot!.querySelector('[part="summary"]')?.textContent).toContain('$100.00');
    expect(el.shadowRoot!.querySelector('.total-row')?.textContent).toContain('$104.00');

    let removedId = '';
    el.addEventListener('mth-remove-item', (e) => {
      removedId = (e as CustomEvent<{ id: string }>).detail.id;
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('.remove-btn')!.click();
    expect(removedId).toBe('sku-1');

    let checkoutTotal = 0;
    el.addEventListener('mth-checkout', (e) => {
      checkoutTotal = (e as CustomEvent<{ total: number }>).detail.total;
    });
    el.shadowRoot!.querySelector<HTMLElement>('[part="checkout-button"]')!.click();
    expect(checkoutTotal).toBe(104);
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite cleanly', async () => {
    registerMthCart();
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-cart></mth-cart>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-cart>', 'hyd-cart>')
      .replaceAll('<mth-cart', '<hyd-cart');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCart('hyd');
        customElements.upgrade(host);
        await (host as MthCart).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
