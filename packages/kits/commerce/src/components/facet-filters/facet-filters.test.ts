import { runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { facetFiltersSpec, MthFacetFilters, registerMthFacetFilters } from './index.js';

describe('<mth-facet-filters>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, toggles checkbox/swatch/range filters, and avoids inline styles', async () => {
    const report = await runBehaviorSpecAssertions(facetFiltersSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-facet-filters') as MthFacetFilters;
    el.facets = [
      {
        id: 'brand',
        label: 'Brand',
        type: 'checkbox',
        options: [{ value: 'acme', label: 'Acme', count: 4 }],
      },
      {
        id: 'color',
        label: 'Color',
        type: 'swatch',
        options: [{ value: 'blue', label: 'Blue', color: '--mth-color-accent' }],
      },
      {
        id: 'price',
        label: 'Price',
        type: 'range',
        min: 0,
        max: 500,
      },
    ];
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelectorAll('[style]').length).toBe(0);

    const swatchBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="swatch"]')!;
    swatchBtn.click();
    await el.updateComplete;
    expect(el.selected['color']).toEqual(['blue']);
    expect(el.hasCustomState('has-active-filters')).toBe(true);

    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="clear-button"]')!.click();
    await el.updateComplete;
    expect(el.selected).toEqual({});
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite cleanly', async () => {
    registerMthFacetFilters();
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-facet-filters></mth-facet-filters>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-facet-filters>', 'hyd-facet-filters>')
      .replaceAll('<mth-facet-filters', '<hyd-facet-filters');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFacetFilters('hyd');
        customElements.upgrade(host);
        await (host as MthFacetFilters).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
