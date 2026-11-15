import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthFormWizard, formWizardSpec, registerMthFormWizard } from './index.js';

describe('<mth-form-wizard>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles BehaviorSpec and passes same-root ARIA', async () => {
    const compiled = compileSpec(formWizardSpec);
    expect(compiled.tests).toContain('<mth-form-wizard>');

    const wizard = document.createElement('mth-form-wizard') as MthFormWizard;
    wizard.label = 'Account setup';
    document.body.appendChild(wizard);
    await wizard.updateComplete;

    const specReport = await runBehaviorSpecAssertions(formWizardSpec);
    expect(specReport.passed).toBe(true);
    expect(scanSameRootAria(wizard).issues).toEqual([]);
  });

  it('gates step progression on control validity and emits mth-step-change and mth-complete', async () => {
    const wizard = document.createElement('mth-form-wizard') as MthFormWizard;
    wizard.label = 'Checkout';

    const step1 = document.createElement('section');
    step1.setAttribute('data-step', 'shipping');
    step1.setAttribute('data-title', 'Shipping');
    const nameInput = document.createElement('input');
    nameInput.required = true;
    step1.appendChild(nameInput);

    const step2 = document.createElement('section');
    step2.setAttribute('data-step', 'review');
    step2.setAttribute('data-title', 'Review');

    wizard.append(step1, step2);
    document.body.appendChild(wizard);
    await wizard.updateComplete;
    await Promise.resolve();
    await wizard.updateComplete;

    expect(wizard.stepCount).toBe(2);
    expect(step1.hidden).toBe(false);
    expect(step2.hidden).toBe(true);

    // Blocked when required input in step 1 is empty.
    expect(await wizard.next()).toBe(false);
    expect(wizard.activeStep).toBe(0);
    expect(wizard.shadowRoot!.querySelector('[part="error"]')?.hasAttribute('hidden')).toBe(false);

    nameInput.value = 'Ada Lovelace';
    const stepChanges: number[] = [];
    let completed = 0;
    wizard.addEventListener('mth-step-change', (ev) =>
      stepChanges.push((ev as CustomEvent<{ index: number }>).detail.index),
    );
    wizard.addEventListener('mth-complete', () => {
      completed += 1;
    });

    expect(await wizard.next()).toBe(true);
    await wizard.updateComplete;
    expect(wizard.activeStep).toBe(1);
    expect(wizard.step).toBe('review');
    expect(stepChanges).toEqual([1]);
    expect(step1.hidden).toBe(true);
    expect(step2.hidden).toBe(false);

    expect(await wizard.next()).toBe(true);
    expect(completed).toBe(1);

    expect(wizard.previous()).toBe(true);
    await wizard.updateComplete;
    expect(wizard.activeStep).toBe(0);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-form-wizard label="Onboarding"></mth-form-wizard>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-form-wizard>', 'hyd-form-wizard>')
      .replaceAll('<mth-form-wizard', '<hyd-form-wizard');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFormWizard('hyd');
        customElements.upgrade(host);
        await (host as MthFormWizard).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
