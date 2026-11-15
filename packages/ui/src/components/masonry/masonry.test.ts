import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { masonrySpec } from './masonry.spec.js';
import { MthMasonry, registerMthMasonry } from './index.js';

describe('<mth-masonry>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('computes explicit column count and renders slotted items without ARIA issues', async () => {
    const compiled = compileSpec(masonrySpec);
    expect(compiled.docs).toContain('`<mth-masonry>`');
    const specReport = await runBehaviorSpecAssertions(masonrySpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-masonry') as MthMasonry;
    el.columns = 3;
    el.gap = '12px';
    for (const label of ['Card 1', 'Card 2', 'Card 3']) {
      const card = document.createElement('div');
      card.textContent = label;
      el.appendChild(card);
    }
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.computedColumns).toBe(3);
    expect(el.shadowRoot!.querySelector('[part="base"]')!.getAttribute('data-columns')).toBe('3');
    expect(scanSameRootAria(el).issues).toEqual([]);

    // Unsafe gap CSS injection is rejected cleanly
    el.gap = '1rem; } [part="base"] { color: red';
    await el.updateComplete;
    const sheets = el.shadowRoot!.adoptedStyleSheets;
    const dynamic = sheets[sheets.length - 1];
    if (dynamic) {
      expect(dynamic.cssRules.length).toBe(2);
      expect(dynamic.cssRules[0]?.cssText).not.toContain('red');
    }
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-masonry columns="2"><div>A</div><div>B</div></mth-masonry>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-masonry>', 'hyd-masonry>')
      .replaceAll('<mth-masonry', '<hyd-masonry');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMasonry('hyd');
        customElements.upgrade(host);
        await (host as MthMasonry).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
