import { runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { paymentFormSpec } from './payment-form.spec.js';
import { MthPaymentForm, registerMthPaymentForm } from './index.js';

describe('<mth-payment-form>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, validates Luhn card numbers, and emits tokenized mth-submit', async () => {
    const report = await runBehaviorSpecAssertions(paymentFormSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-payment-form') as MthPaymentForm;
    el.amount = 49;
    el.currency = 'USD';
    el.locale = 'en-US';
    document.body.append(el);
    await el.updateComplete;

    const nameInput = el.shadowRoot!.querySelector<HTMLInputElement>('[part="name-input"]')!;
    const numberInput = el.shadowRoot!.querySelector<HTMLInputElement>('[part="number-input"]')!;
    const expInput = el.shadowRoot!.querySelector<HTMLInputElement>('[part="expiry-input"]')!;
    const cvcInput = el.shadowRoot!.querySelector<HTMLInputElement>('[part="cvc-input"]')!;

    nameInput.value = 'Ada Lovelace';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    numberInput.value = '4111111111111112';
    numberInput.dispatchEvent(new Event('input', { bubbles: true }));
    expInput.value = '1229';
    expInput.dispatchEvent(new Event('input', { bubbles: true }));
    cvcInput.value = '123';
    cvcInput.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    expect(el.submitPayment()).toBe(false);
    await el.updateComplete;
    expect(el.hasCustomState('invalid')).toBe(true);

    let submittedDetail: { last4: string; valid: boolean } | null = null;
    el.addEventListener('mth-submit', (e) => {
      submittedDetail = (e as CustomEvent<{ last4: string; valid: boolean }>).detail;
    });

    numberInput.value = '4242424242424242';
    numberInput.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    expect(el.submitPayment()).toBe(true);
    expect(submittedDetail).toEqual({
      cardholderName: 'Ada Lovelace',
      last4: '4242',
      expiry: '12/29',
      valid: true,
    });
    expect(el.getAttribute('cardNumber')).toBeNull();
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes FormControlSuite', async () => {
    let mounted: MthPaymentForm | null = null;
    const fc = await FormControlSuite.run({
      mount: async () => {
        mounted = document.createElement('mth-payment-form') as MthPaymentForm;
        return mounted;
      },
      defaultValue: '',
      nextValue: 'Grace Hopper',
      setValue: async (el, val) => {
        (el as MthPaymentForm).value = val;
        await (el as MthPaymentForm).updateComplete;
      },
      getValue: (el) => (el as MthPaymentForm).value,
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
        el.shadowRoot!.querySelector<HTMLInputElement>('[part="name-input"]')!.disabled,
    });
    expect(fc.failures).toEqual([]);
    expect(fc.passed).toBe(true);
  });

  it('passes HydrationPuritySuite cleanly', async () => {
    registerMthPaymentForm();
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-payment-form></mth-payment-form>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-payment-form>', 'hyd-payment-form>')
      .replaceAll('<mth-payment-form', '<hyd-payment-form');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPaymentForm('hyd');
        customElements.upgrade(host);
        await (host as MthPaymentForm).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });

  it('wires aria-invalid and aria-describedby to error element for invalid expiry and CVC', async () => {
    const el = document.createElement('mth-payment-form') as MthPaymentForm;
    document.body.append(el);
    await el.updateComplete;

    const nameInput = el.shadowRoot!.querySelector<HTMLInputElement>('#cc-name')!;
    const numInput = el.shadowRoot!.querySelector<HTMLInputElement>('#cc-number')!;
    const expInput = el.shadowRoot!.querySelector<HTMLInputElement>('#cc-exp')!;
    const cscInput = el.shadowRoot!.querySelector<HTMLInputElement>('#cc-csc')!;

    nameInput.value = 'Ada Lovelace';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    numInput.value = '4242424242424242';
    numInput.dispatchEvent(new Event('input', { bubbles: true }));
    expInput.value = '13/99';
    expInput.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    expect(el.submitPayment()).toBe(false);
    await el.updateComplete;

    const errEl = el.shadowRoot!.querySelector('#mth-pf-error');
    expect(errEl?.textContent?.trim().length).toBeGreaterThan(0);
    expect(expInput.getAttribute('aria-invalid')).toBe('true');
    expect(expInput.getAttribute('aria-describedby')).toBe('mth-pf-error');
    expect(cscInput.getAttribute('aria-invalid')).toBe('true');
    expect(cscInput.getAttribute('aria-describedby')).toBe('mth-pf-error');
  });
});
