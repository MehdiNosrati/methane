import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { ibanInputSpec } from './iban-input.spec.js';
import { MthIbanInput, registerMthIbanInput } from './index.js';

describe('<mth-iban-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(ibanInputSpec);
    expect(compiled.tests).toContain('<mth-iban-input>');

    let mounted: MthIbanInput | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-iban-input') as MthIbanInput;
        mounted.label = 'Bank IBAN';
        return mounted;
      },
      nextValue: 'DE89 3704 0044 0532 0130 00',
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthIbanInput;
        await host.updateComplete;
        const native = host.shadowRoot!.querySelector('input')!;
        native.value = value;
        native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        native.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthIbanInput).value,
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
        Boolean((el as MthIbanInput).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthIbanInput).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(ibanInputSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('groups IBAN into 4-character blocks and validates ISO 13616 MOD-97-10 checksum', async () => {
    const el = document.createElement('mth-iban-input') as MthIbanInput;
    el.label = 'IBAN';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;

    input.value = 'de89370400440532013000';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(el.value).toBe('DE89 3704 0044 0532 0130 00');
    expect(el.unmaskedValue).toBe('DE89370400440532013000');
    expect(el.countryCode).toBe('DE');
    expect(el.checkValidity()).toBe(true);

    input.value = 'DE00370400440532013000';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    expect(el.validityFlags.patternMismatch).toBe(true);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-iban-input label="IBAN"></mth-iban-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-iban-input>', 'hyd-iban-input>')
      .replaceAll('<mth-iban-input', '<hyd-iban-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthIbanInput('hyd');
        customElements.upgrade(host);
        await (host as MthIbanInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
