import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { splitPaneSpec } from './split-pane.spec.js';
import { MthSplitPane, registerMthSplitPane } from './index.js';

describe('<mth-split-pane>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('resizes via keyboard separator controls and emits mth-resize', async () => {
    const compiled = compileSpec(splitPaneSpec);
    expect(compiled.docs).toContain('`<mth-split-pane>`');
    const specReport = await runBehaviorSpecAssertions(splitPaneSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-split-pane') as MthSplitPane;
    el.ratio = 50;
    el.minRatio = 20;
    el.maxRatio = 80;
    document.body.appendChild(el);
    await el.updateComplete;

    const divider = el.shadowRoot!.querySelector('[part="divider"]') as HTMLElement;
    expect(divider.getAttribute('role')).toBe('separator');
    expect(divider.getAttribute('aria-orientation')).toBe('vertical');
    expect(divider.getAttribute('aria-valuenow')).toBe('50');

    const ratios: number[] = [];
    el.addEventListener('mth-resize', (ev) => {
      ratios.push((ev as CustomEvent<{ ratio: number }>).detail.ratio);
    });

    divider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.ratio).toBe(55);

    divider.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await el.updateComplete;
    expect(el.ratio).toBe(20);

    divider.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await el.updateComplete;
    expect(el.ratio).toBe(80);
    expect(ratios).toEqual([55, 20, 80]);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-split-pane ratio="40"><div slot="start">A</div><div slot="end">B</div></mth-split-pane>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-split-pane>', 'hyd-split-pane>')
      .replaceAll('<mth-split-pane', '<hyd-split-pane');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSplitPane('hyd');
        customElements.upgrade(host);
        await (host as MthSplitPane).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
