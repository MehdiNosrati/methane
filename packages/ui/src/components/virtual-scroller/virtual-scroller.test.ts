import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { virtualScrollerSpec } from './virtual-scroller.spec.js';
import { MthVirtualScroller, registerMthVirtualScroller } from './index.js';

describe('<mth-virtual-scroller>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('windows large datasets and updates visible items on scrollToIndex', async () => {
    const compiled = compileSpec(virtualScrollerSpec);
    expect(compiled.docs).toContain('`<mth-virtual-scroller>`');
    const specReport = await runBehaviorSpecAssertions(virtualScrollerSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-virtual-scroller') as MthVirtualScroller<string>;
    el.estimateSize = 40;
    el.viewportHeight = 200;
    el.overscan = 1;
    el.items = Array.from({ length: 1000 }, (_, i) => `Row ${i}`);
    document.body.appendChild(el);
    await el.updateComplete;

    const initialRendered = el.shadowRoot!.querySelectorAll('[part="item"]');
    expect(initialRendered.length).toBeGreaterThan(0);
    expect(initialRendered.length).toBeLessThan(20);
    expect(initialRendered[0]?.textContent?.trim()).toBe('Row 0');

    el.setScrollTop(2000);
    await el.updateComplete;
    const scrolledRendered = Array.from(el.shadowRoot!.querySelectorAll('[part="item"]'));
    const firstVisibleIndex = Number(scrolledRendered[0]?.getAttribute('data-virtual-index'));
    expect(firstVisibleIndex).toBeGreaterThan(40);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-virtual-scroller viewport-height="240"></mth-virtual-scroller>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-virtual-scroller>', 'hyd-virtual-scroller>')
      .replaceAll('<mth-virtual-scroller', '<hyd-virtual-scroller');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthVirtualScroller('hyd');
        customElements.upgrade(host);
        await (host as MthVirtualScroller).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
