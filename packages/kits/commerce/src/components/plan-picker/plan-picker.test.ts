import { runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { planPickerSpec } from './plan-picker.spec.js';
import { MthPlanPicker, registerMthPlanPicker } from './index.js';

const DEMO_PLANS = [
  { id: 'starter', name: 'Starter', monthlyPrice: 12, annualPrice: 120, features: ['1 user'] },
  { id: 'pro', name: 'Pro', monthlyPrice: 29, annualPrice: 290, badge: 'Popular', features: ['10 users'] },
  { id: 'team', name: 'Team', monthlyPrice: 79, annualPrice: 790, features: ['Unlimited'] },
];

describe('<mth-plan-picker>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, switches billing cycle, and selects plan tier', async () => {
    const report = await runBehaviorSpecAssertions(planPickerSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-plan-picker') as MthPlanPicker;
    el.locale = 'en-US';
    el.currency = 'USD';
    el.plans = DEMO_PLANS;
    el.value = 'starter';
    document.body.append(el);
    await el.updateComplete;

    const cycleButtons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.cycle-btn');
    cycleButtons[1]!.click();
    await el.updateComplete;
    expect(el.billingCycle).toBe('annual');
    expect(el.hasCustomState('annual')).toBe(true);
    expect(el.shadowRoot!.querySelectorAll('.amount')[1]!.textContent).toContain('$290.00');

    const cards = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.plan-card');
    cards[1]!.click();
    await el.updateComplete;
    expect(el.value).toBe('pro');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes FormControlSuite', async () => {
    let mounted: MthPlanPicker | null = null;
    const fc = await FormControlSuite.run({
      mount: async () => {
        mounted = document.createElement('mth-plan-picker') as MthPlanPicker;
        mounted.plans = DEMO_PLANS;
        mounted.value = 'starter';
        return mounted;
      },
      defaultValue: 'starter',
      nextValue: 'pro',
      setValue: async (el, val) => {
        (el as MthPlanPicker).value = val;
        await (el as MthPlanPicker).updateComplete;
      },
      getValue: (el) => (el as MthPlanPicker).value,
      getFormDataValue: (fd, name) => {
        const nativeVal = fd.get(name);
        if (nativeVal !== null) return String(nativeVal);
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.effectivelyDisabled ? null : mounted.value;
      },
      getInternalDisabled: (el) =>
        el.shadowRoot!.querySelector<HTMLButtonElement>('.plan-card')!.disabled,
    });
    expect(fc.failures).toEqual([]);
    expect(fc.passed).toBe(true);
  });

  it('passes RovingFocusSuite across LTR and RTL', async () => {
    const roving = await RovingFocusSuite.run({
      mount: async (dir) => {
        const el = document.createElement('mth-plan-picker') as MthPlanPicker;
        if (dir) el.dir = dir;
        el.plans = DEMO_PLANS;
        el.value = 'starter';
        document.body.append(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.plan-card')),
      orientation: 'horizontal',
      loop: true,
    });
    expect(roving.failures).toEqual([]);
    expect(roving.passed).toBe(true);
  });

  it('passes HydrationPuritySuite cleanly', async () => {
    registerMthPlanPicker();
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-plan-picker></mth-plan-picker>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-plan-picker>', 'hyd-plan-picker>')
      .replaceAll('<mth-plan-picker', '<hyd-plan-picker');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPlanPicker('hyd');
        customElements.upgrade(host);
        await (host as MthPlanPicker).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
