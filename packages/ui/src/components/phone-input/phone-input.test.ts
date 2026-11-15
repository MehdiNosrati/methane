import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { phoneInputSpec } from './phone-input.spec.js';
import { MthPhoneInput, registerMthPhoneInput } from './index.js';

describe('<mth-phone-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(phoneInputSpec);
    expect(compiled.tests).toContain('<mth-phone-input>');

    let mounted: MthPhoneInput | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-phone-input') as MthPhoneInput;
        mounted.label = 'Phone';
        return mounted;
      },
      nextValue: '(555) 123-4567',
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthPhoneInput;
        await host.updateComplete;
        const native = host.shadowRoot!.querySelector('input')!;
        native.value = value;
        native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        native.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthPhoneInput).value,
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
        Boolean((el as MthPhoneInput).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthPhoneInput).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(phoneInputSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('applies pattern mask, exposes e164, switches country dial prefix, and validates completeness', async () => {
    const el = document.createElement('mth-phone-input') as MthPhoneInput;
    el.label = 'Mobile';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);

    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    input.value = '4155550199';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(el.value).toBe('(415) 555-0199');
    expect(el.unmaskedValue).toBe('4155550199');
    expect(el.e164).toBe('+14155550199');
    expect(el.checkValidity()).toBe(true);

    input.value = '415';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    expect(el.validityFlags.patternMismatch).toBe(true);

    const select = el.shadowRoot!.querySelector<HTMLSelectElement>('select')!;
    select.value = 'GB';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;
    expect(el.country).toBe('GB');
    expect(el.dialCode).toBe('+44');
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-phone-input label="Telephone" country="US" dial-code="+1"></mth-phone-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-phone-input>', 'hyd-phone-input>')
      .replaceAll('<mth-phone-input', '<hyd-phone-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPhoneInput('hyd');
        customElements.upgrade(host);
        await (host as MthPhoneInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
