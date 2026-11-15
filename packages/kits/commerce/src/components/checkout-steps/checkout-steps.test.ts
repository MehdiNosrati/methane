import { runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { checkoutStepsSpec } from './checkout-steps.spec.js';
import { MthCheckoutSteps, registerMthCheckoutSteps } from './index.js';

const DEMO_STEPS = [
  { id: 'shipping', label: 'Shipping', completed: true },
  { id: 'delivery', label: 'Delivery' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
];

describe('<mth-checkout-steps>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec and enforces linear step locking', async () => {
    const report = await runBehaviorSpecAssertions(checkoutStepsSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-checkout-steps') as MthCheckoutSteps;
    el.steps = DEMO_STEPS;
    el.activeStep = 'delivery';
    document.body.append(el);
    await el.updateComplete;

    expect(el.selectStep('payment')).toBe(false);
    const changes: string[] = [];
    el.addEventListener('mth-step-change', (e) => {
      changes.push((e as CustomEvent<{ stepId: string }>).detail.stepId);
    });

    el.completeStep('delivery');
    await el.updateComplete;
    expect(el.selectStep('payment')).toBe(true);
    expect(changes).toEqual(['payment']);
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes RovingFocusSuite across LTR and RTL', async () => {
    const roving = await RovingFocusSuite.run({
      mount: async (dir) => {
        const el = document.createElement('mth-checkout-steps') as MthCheckoutSteps;
        if (dir) el.dir = dir;
        el.linear = false;
        el.steps = DEMO_STEPS;
        el.activeStep = 'shipping';
        document.body.append(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.step-btn')),
      orientation: 'horizontal',
      loop: false,
    });
    expect(roving.failures).toEqual([]);
    expect(roving.passed).toBe(true);
  });

  it('passes HydrationPuritySuite cleanly', async () => {
    registerMthCheckoutSteps();
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-checkout-steps></mth-checkout-steps>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-checkout-steps>', 'hyd-checkout-steps>')
      .replaceAll('<mth-checkout-steps', '<hyd-checkout-steps');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCheckoutSteps('hyd');
        customElements.upgrade(host);
        await (host as MthCheckoutSteps).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
