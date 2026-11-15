import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { tabSpec } from './tab.spec.js';
import { MthTab, registerMthTab } from './index.js';

describe('<mth-tab>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and tracks selected/disabled custom states', async () => {
    const compiled = compileSpec(tabSpec);
    expect(compiled.docs).toContain('`<mth-tab>`');

    const report = await runBehaviorSpecAssertions(tabSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-tab') as MthTab;
    el.value = 'overview';
    el.textContent = 'Overview';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.selected).toBe(false);
    el.selected = true;
    await el.updateComplete;
    expect(el.hasAttribute('selected')).toBe(true);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-tab value="a">Tab A</mth-tab>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-tab>', 'hyd-tab>').replaceAll('<mth-tab', '<hyd-tab');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTab('hyd');
        customElements.upgrade(host);
        await (host as MthTab).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
