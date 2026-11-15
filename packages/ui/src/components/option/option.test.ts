import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { optionSpec } from './option.spec.js';
import { MthOption, registerMthOption } from './index.js';

describe('<mth-option>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and resolves labels and selected state', async () => {
    const compiled = compileSpec(optionSpec);
    expect(compiled.docs).toContain('`<mth-option>`');

    const report = await runBehaviorSpecAssertions(optionSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-option') as MthOption;
    el.value = 'mango';
    el.textContent = 'Mango';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.getResolvedLabel()).toBe('Mango');
    el.selected = true;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('[part="check"]')?.textContent).toBe('✓');

    el.label = 'Alphonso Mango';
    await el.updateComplete;
    expect(el.getResolvedLabel()).toBe('Alphonso Mango');
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-option value="a">Alpha</mth-option>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-option>', 'hyd-option>').replaceAll('<mth-option', '<hyd-option');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthOption('hyd');
        customElements.upgrade(host);
        await (host as MthOption).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
