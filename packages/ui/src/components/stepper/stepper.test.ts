import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import '@methane-ui/ui/step';
import { stepperSpec } from './stepper.spec.js';
import { MthStepper, registerMthStepper } from './index.js';

function appendSlottedSteps(stepper: MthStepper): void {
  for (const [val, label] of [
    ['account', 'Account'],
    ['profile', 'Profile'],
    ['confirm', 'Confirm'],
  ] as const) {
    const step = document.createElement('mth-step');
    step.setAttribute('value', val);
    step.setAttribute('label', label);
    stepper.appendChild(step);
  }
}

describe('<mth-stepper>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, RovingFocusSuite (LTR + RTL), and same-root ARIA', async () => {
    const compiled = compileSpec(stepperSpec);
    expect(compiled.docs).toContain('`<mth-stepper>`');

    const report = await runBehaviorSpecAssertions(stepperSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const roving = await RovingFocusSuite.run({
      orientation: 'horizontal',
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const stepper = document.createElement('mth-stepper') as MthStepper;
        stepper.setAttribute('dir', dir);
        stepper.steps = [
          { value: 's1', label: 'Account' },
          { value: 's2', label: 'Profile' },
          { value: 's3', label: 'Review' },
        ];
        document.body.appendChild(stepper);
        await stepper.updateComplete;
        return stepper;
      },
      getItems: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="trigger"]')),
    });
    expect(roving.failures).toEqual([]);
    expect(roving.passed).toBe(true);
  });

  it('consumes slotted <mth-step> children, enforces linear mode, and emits mth-change', async () => {
    const stepper = document.createElement('mth-stepper') as MthStepper;
    stepper.linear = true;
    appendSlottedSteps(stepper);
    document.body.appendChild(stepper);
    await stepper.updateComplete;

    expect(stepper.hasCustomState('linear')).toBe(true);
    const triggers = stepper.shadowRoot!.querySelectorAll<HTMLElement>('[part="trigger"]');
    expect(triggers).toHaveLength(3);
    expect(triggers[0]?.getAttribute('aria-current')).toBe('step');
    expect(triggers[2]?.getAttribute('aria-disabled')).toBe('true');

    const changes = vi.fn();
    stepper.addEventListener('mth-change', changes);

    // Blocked jump in linear mode
    expect(stepper.selectStep(2)).toBe(false);
    expect(changes).not.toHaveBeenCalled();

    // Permitted next step
    expect(stepper.selectStep(1)).toBe(true);
    await stepper.updateComplete;
    expect(changes).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { index: 1, value: 'profile' } }),
    );
    expect(scanSameRootAria(stepper.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-stepper label="Checkout"></mth-stepper>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-stepper>', 'hyd-stepper>')
      .replaceAll('<mth-stepper', '<hyd-stepper');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthStepper('hyd');
        customElements.upgrade(host);
        await (host as MthStepper).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
