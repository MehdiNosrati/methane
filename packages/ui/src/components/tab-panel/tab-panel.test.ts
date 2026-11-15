import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { tabPanelSpec } from './tab-panel.spec.js';
import { MthTabPanel, registerMthTabPanel } from './index.js';

describe('<mth-tab-panel>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and tracks active visibility state', async () => {
    const compiled = compileSpec(tabPanelSpec);
    expect(compiled.docs).toContain('`<mth-tab-panel>`');

    const report = await runBehaviorSpecAssertions(tabPanelSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-tab-panel') as MthTabPanel;
    el.value = 'overview';
    el.textContent = 'Panel body';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.active).toBe(false);
    el.active = true;
    await el.updateComplete;
    expect(el.hasAttribute('active')).toBe(true);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-tab-panel value="a" active>Panel A</mth-tab-panel>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-tab-panel>', 'hyd-tab-panel>')
      .replaceAll('<mth-tab-panel', '<hyd-tab-panel');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTabPanel('hyd');
        customElements.upgrade(host);
        await (host as MthTabPanel).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
