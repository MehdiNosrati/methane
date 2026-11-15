import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { stepSpec } from './step.spec.js';
import { MthStep, registerMthStep } from './index.js';

describe('<mth-step>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, reflects status custom states, and passes same-root ARIA', async () => {
    const compiled = compileSpec(stepSpec);
    expect(compiled.docs).toContain('`<mth-step>`');

    const report = await runBehaviorSpecAssertions(stepSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const step = document.createElement('mth-step') as MthStep;
    step.label = 'Account';
    step.description = 'Enter email';
    step.stepNumber = 1;
    step.status = 'complete';
    document.body.appendChild(step);
    await step.updateComplete;

    expect(step.hasCustomState('complete')).toBe(true);
    expect(step.shadowRoot!.querySelector('[part="indicator"]')?.textContent?.trim()).toBe('✓');
    expect(scanSameRootAria(step.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-step label="Shipping" step-number="2" status="current"></mth-step>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-step>', 'hyd-step>').replaceAll('<mth-step', '<hyd-step');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthStep('hyd');
        customElements.upgrade(host);
        await (host as MthStep).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
