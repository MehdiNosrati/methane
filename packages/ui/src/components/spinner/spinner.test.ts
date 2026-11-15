import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { spinnerSpec } from './spinner.spec.js';
import { MthSpinner, registerMthSpinner, spinnerStyles } from './index.js';

describe('<mth-spinner>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, uses localized role="status", and respects prefers-reduced-motion', async () => {
    const compiled = compileSpec(spinnerSpec);
    expect(compiled.docs).toContain('`<mth-spinner>`');

    const report = await runBehaviorSpecAssertions(spinnerSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const spinner = document.createElement('mth-spinner') as MthSpinner;
    spinner.size = 'lg';
    document.body.appendChild(spinner);
    await spinner.updateComplete;

    const base = spinner.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute('role')).toBe('status');
    expect(base.getAttribute('aria-label')).toBe('Loading');
    expect(base.getAttribute('data-size')).toBe('lg');

    spinner.label = 'Saving workspace';
    await spinner.updateComplete;
    expect(base.getAttribute('aria-label')).toBe('Saving workspace');

    expect(spinnerStyles.cssText).toContain('prefers-reduced-motion: reduce');
    expect(scanSameRootAria(spinner).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-spinner size="sm"></mth-spinner>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-spinner>', 'hyd-spinner>')
      .replaceAll('<mth-spinner', '<hyd-spinner');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSpinner('hyd');
        customElements.upgrade(host);
        await (host as MthSpinner).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
