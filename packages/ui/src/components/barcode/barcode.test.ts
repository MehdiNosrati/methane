import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { barcodeSpec, encodeCode128B, MthBarcode, registerMthBarcode } from './index.js';

describe('<mth-barcode>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and same-root ARIA', async () => {
    const compiled = compileSpec(barcodeSpec);
    expect(compiled.tests).toContain('<mth-barcode>');

    const specReport = await runBehaviorSpecAssertions(barcodeSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-barcode') as MthBarcode;
    el.value = 'MTH-2026';
    el.label = 'Product SKU barcode';
    document.body.append(el);
    await el.updateComplete;

    const svgEl = el.shadowRoot!.querySelector('svg')!;
    expect(svgEl.getAttribute('role')).toBe('img');
    expect(svgEl.getAttribute('aria-label')).toBe('Product SKU barcode');
    expect(el.shadowRoot!.querySelector('[part="caption"]')?.textContent).toBe('MTH-2026');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('produces deterministic Code 128B bars with exact quiet zones and stop pattern', () => {
    const a = encodeCode128B('ABC-123');
    const b = encodeCode128B('ABC-123');
    expect(a).toEqual(b);
    expect(a.bars[0]!.x).toBe(10);
    // Stop Code 106 (13 modules) + 10 quiet modules = last bar ends at totalWidth - 10
    const lastBar = a.bars[a.bars.length - 1]!;
    expect(lastBar.x + lastBar.width).toBe(a.totalWidth - 10);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthBarcode();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-barcode value="SKU-42" label="SKU"></mth-barcode>`,
    );
    const ssrHtml = rawSsr.replaceAll('mth-barcode>', 'hyd-barcode>').replaceAll('<mth-barcode', '<hyd-barcode');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBarcode('hyd');
        customElements.upgrade(host);
        await (host as MthBarcode).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
