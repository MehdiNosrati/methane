import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthCurrencyInput, currencyInputSpec, registerMthCurrencyInput } from './index.js';

describe('<mth-currency-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(currencyInputSpec);
    expect(compiled.tests).toContain('<mth-currency-input>');

    let mounted: MthCurrencyInput | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-currency-input') as MthCurrencyInput;
        mounted.label = 'Price';
        return mounted;
      },
      nextValue: '1234.56',
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthCurrencyInput;
        await host.updateComplete;
        const native = host.shadowRoot!.querySelector('input')!;
        native.value = value;
        native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        native.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthCurrencyInput).value,
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
        Boolean((el as MthCurrencyInput).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthCurrencyInput).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(currencyInputSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('formats grouped monetary input, stores unmasked numeric value, and validates min/max', async () => {
    const el = document.createElement('mth-currency-input') as MthCurrencyInput;
    el.label = 'Invoice total';
    el.currency = 'EUR';
    el.locale = 'de-DE';
    el.min = 10;
    el.max = 5000;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    expect(el.shadowRoot!.querySelector('[part="currency"]')?.textContent).toBe('€');

    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    input.value = '1234,56';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.value).toBe('1234.56');
    expect(el.valueAsNumber).toBe(1234.56);
    expect(input.value).toBe('1.234,56');
    expect(el.formattedValue).toContain('1.234,56');

    el.value = '5';
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    expect(el.validityFlags.rangeUnderflow).toBe(true);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-currency-input label="Total" currency="USD" value="99.5"></mth-currency-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-currency-input>', 'hyd-currency-input>')
      .replaceAll('<mth-currency-input', '<hyd-currency-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCurrencyInput('hyd');
        customElements.upgrade(host);
        await (host as MthCurrencyInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
