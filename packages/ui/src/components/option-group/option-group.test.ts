import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { optionGroupSpec } from './option-group.spec.js';
import { MthOptionGroup, registerMthOptionGroup } from './index.js';

describe('<mth-option-group>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and renders label + slot', async () => {
    const compiled = compileSpec(optionGroupSpec);
    expect(compiled.docs).toContain('`<mth-option-group>`');

    const report = await runBehaviorSpecAssertions(optionGroupSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-option-group') as MthOptionGroup;
    el.label = 'Fruits';
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('[part="label"]')?.textContent?.trim()).toBe('Fruits');
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-option-group label="Citrus"></mth-option-group>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-option-group>', 'hyd-option-group>')
      .replaceAll('<mth-option-group', '<hyd-option-group');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthOptionGroup('hyd');
        customElements.upgrade(host);
        await (host as MthOptionGroup).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
