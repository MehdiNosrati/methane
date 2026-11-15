import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { maskedInputSpec } from './masked-input.spec.js';
import { MthMaskedInput, registerMthMaskedInput } from './index.js';

describe('<mth-masked-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(maskedInputSpec);
    expect(compiled.tests).toContain('<mth-masked-input>');

    let mounted: MthMaskedInput | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-masked-input') as MthMaskedInput;
        mounted.label = 'License';
        mounted.mask = 'AA-0000';
        return mounted;
      },
      nextValue: 'AB-1234',
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthMaskedInput;
        await host.updateComplete;
        const native = host.shadowRoot!.querySelector('input')!;
        native.value = value;
        native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        native.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthMaskedInput).value,
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
        Boolean((el as MthMaskedInput).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthMaskedInput).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(maskedInputSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('applies custom pattern mask, extracts unmasked value, and validates completeness', async () => {
    const el = document.createElement('mth-masked-input') as MthMaskedInput;
    el.label = 'Serial';
    el.mask = 'AA-0000';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    input.value = 'xy9876';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(el.value).toBe('xy-9876');
    expect(el.unmaskedValue).toBe('xy9876');
    expect(el.complete).toBe(true);
    expect(el.checkValidity()).toBe(true);

    input.value = 'xy9';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.complete).toBe(false);
    expect(el.checkValidity()).toBe(false);
    expect(el.validityFlags.patternMismatch).toBe(true);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-masked-input label="Code" mask="000-000" placeholder="123-456"></mth-masked-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-masked-input>', 'hyd-masked-input>')
      .replaceAll('<mth-masked-input', '<hyd-masked-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMaskedInput('hyd');
        customElements.upgrade(host);
        await (host as MthMaskedInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
