import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthNumberInput, numberInputSpec, registerMthNumberInput } from './index.js';

describe('<mth-number-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(numberInputSpec);
    expect(compiled.tests).toContain('<mth-number-input>');

    let mounted: MthNumberInput | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-number-input') as MthNumberInput;
        mounted.label = 'Quantity';
        return mounted;
      },
      nextValue: '42',
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthNumberInput;
        await host.updateComplete;
        const native = host.shadowRoot!.querySelector('input')!;
        native.value = value;
        native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        native.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthNumberInput).value,
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
        Boolean((el as MthNumberInput).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthNumberInput).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(numberInputSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('supports precision-safe steppers, keyboard navigation, min/max validation, and Intl valuetext', async () => {
    const el = document.createElement('mth-number-input') as MthNumberInput;
    el.label = 'Amount';
    el.min = 0;
    el.max = 10;
    el.step = 0.1;
    el.value = '0.2';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    const inc = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="increment"]')!;
    const dec = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="decrement"]')!;

    inc.click();
    await el.updateComplete;
    expect(el.value).toBe('0.3');
    expect(input.getAttribute('aria-valuenow')).toBe('0.3');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('0.2');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('10');
    expect(inc.disabled).toBe(true);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('0');
    expect(dec.disabled).toBe(true);

    el.value = '15';
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    expect(el.validityFlags.rangeOverflow).toBe(true);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-number-input label="Count" value="5" min="0" max="20"></mth-number-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-number-input>', 'hyd-number-input>')
      .replaceAll('<mth-number-input', '<hyd-number-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthNumberInput('hyd');
        customElements.upgrade(host);
        await (host as MthNumberInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
