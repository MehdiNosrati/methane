import { runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { invoiceSpec } from './invoice.spec.js';
import { MthInvoice, registerMthInvoice } from './index.js';

describe('<mth-invoice>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, calculates localized totals, and rejects unsafe logo URLs', async () => {
    const report = await runBehaviorSpecAssertions(invoiceSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-invoice') as MthInvoice;
    el.invoiceNumber = 'INV-1042';
    el.status = 'paid';
    el.currency = 'USD';
    el.locale = 'en-US';
    el.taxRate = 0.1;
    el.logoUrl = 'javascript:alert(1)';
    el.seller = { name: 'Methane Labs', lines: ['100 Main St'] };
    el.buyer = { name: 'Ada Lovelace', email: 'ada@example.com' };
    el.items = [{ description: 'Pro Plan', quantity: 2, unitPrice: 50 }];
    document.body.append(el);
    await el.updateComplete;

    expect(el.hasCustomState('paid')).toBe(true);
    expect(el.shadowRoot!.querySelector('img.logo')).toBeNull();
    expect(el.shadowRoot!.querySelector('.grand-total')?.textContent).toContain('$110.00');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite cleanly', async () => {
    registerMthInvoice();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-invoice invoice-number="1001" status="pending"></mth-invoice>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-invoice>', 'hyd-invoice>')
      .replaceAll('<mth-invoice', '<hyd-invoice');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthInvoice('hyd');
        customElements.upgrade(host);
        await (host as MthInvoice).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
