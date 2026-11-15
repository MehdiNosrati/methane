import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthPasswordInput, passwordInputSpec, registerMthPasswordInput } from './index.js';

describe('<mth-password-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(passwordInputSpec);
    expect(compiled.tests).toContain('<mth-password-input>');

    let mounted: MthPasswordInput | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-password-input') as MthPasswordInput;
        mounted.label = 'Password';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthPasswordInput;
        await host.updateComplete;
        const native = host.shadowRoot!.querySelector('input')!;
        native.value = value;
        native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        native.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthPasswordInput).value,
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
        Boolean((el as MthPasswordInput).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthPasswordInput).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(passwordInputSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('toggles visibility, evaluates strength meter, and enforces minlength', async () => {
    const el = document.createElement('mth-password-input') as MthPasswordInput;
    el.label = 'New password';
    el.showStrength = true;
    el.minlength = 8;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="toggle"]')!;
    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    const reveals: boolean[] = [];
    el.addEventListener('mth-reveal-change', (ev) =>
      reveals.push((ev as CustomEvent<{ revealed: boolean }>).detail.revealed),
    );
    toggle.click();
    await el.updateComplete;
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(reveals).toEqual([true]);

    input.value = 'abc';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.strength).toBe(1);
    expect(el.checkValidity()).toBe(false);
    expect(el.validityFlags.tooShort).toBe(true);

    input.value = 'Correct-Horse-99!';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.strength).toBe(4);
    expect(el.checkValidity()).toBe(true);
    expect(el.shadowRoot!.querySelector('[part="strength-bar"]')?.getAttribute('data-strength')).toBe('4');
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-password-input label="Passphrase" show-strength></mth-password-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-password-input>', 'hyd-password-input>')
      .replaceAll('<mth-password-input', '<hyd-password-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPasswordInput('hyd');
        customElements.upgrade(host);
        await (host as MthPasswordInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
