import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthTourStep, registerMthTourStep, tourStepSpec } from './index.js';

describe('<mth-tour-step>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and emits mth-step-enter when activated', async () => {
    const compiled = compileSpec(tourStepSpec);
    expect(compiled.docs).toContain('`<mth-tour-step>`');

    const report = await runBehaviorSpecAssertions(tourStepSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const step = document.createElement('mth-tour-step') as MthTourStep;
    step.stepId = 'intro';
    step.heading = 'Welcome';
    step.textContent = 'Start here';
    document.body.appendChild(step);
    await step.updateComplete;

    let enteredId = '';
    step.addEventListener('mth-step-enter', (e: Event) => {
      enteredId = (e as CustomEvent<{ stepId: string }>).detail.stepId;
    });
    step.active = true;
    await step.updateComplete;

    expect(enteredId).toBe('intro');
    expect(step.hasCustomState('active')).toBe(true);
    expect(scanSameRootAria(step).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-tour-step step-id="s1" heading="Step 1" active>Hello</mth-tour-step>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-tour-step', '<hyd-tour-step')
      .replaceAll('</mth-tour-step>', '</hyd-tour-step>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTourStep('hyd');
        customElements.upgrade(host);
        await (host as MthTourStep).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
