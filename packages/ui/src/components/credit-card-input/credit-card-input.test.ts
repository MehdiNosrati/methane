import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import {
  MthCreditCardInput,
  creditCardInputSpec,
  registerMthCreditCardInput,
} from './index.js';

describe('<mth-credit-card-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(creditCardInputSpec);
    expect(compiled.tests).toContain('<mth-credit-card-input>');

    let mounted: MthCreditCardInput | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-credit-card-input') as MthCreditCardInput;
        mounted.label = 'Payment card';
        return mounted;
      },
      nextValue: '4242 4242 4242 4242',
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthCreditCardInput;
        await host.updateComplete;
        const native = host.shadowRoot!.querySelector('input')!;
        native.value = value;
        native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        native.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthCreditCardInput).value,
      getFormDataValue: (formData: FormData, name: string) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.effectivelyDisabled ? null : mounted.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean((el as MthCreditCardInput).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthCreditCardInput).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(creditCardInputSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('detects card brand, groups digits, and enforces Luhn checksum without echoing PAN', async () => {
    const el = document.createElement('mth-credit-card-input') as MthCreditCardInput;
    el.label = 'Card';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    expect(input.getAttribute('autocomplete')).toBe('cc-number');

    const events: Array<{ brand: string; valid: boolean }> = [];
    el.addEventListener('mth-input', (ev) =>
      events.push((ev as CustomEvent<{ brand: string; valid: boolean }>).detail),
    );

    input.value = '4242424242424242';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(el.brand).toBe('visa');
    expect(el.value).toBe('4242 4242 4242 4242');
    expect(el.unmaskedValue).toBe('4242424242424242');
    expect(el.checkValidity()).toBe(true);
    expect(events[0]?.brand).toBe('visa');
    expect(events[0]?.valid).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(events[0], 'value')).toBe(false);

    input.value = '4242424242424241';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    expect(el.validityFlags.patternMismatch).toBe(true);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-credit-card-input label="Card number"></mth-credit-card-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-credit-card-input>', 'hyd-credit-card-input>')
      .replaceAll('<mth-credit-card-input', '<hyd-credit-card-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCreditCardInput('hyd');
        customElements.upgrade(host);
        await (host as MthCreditCardInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
