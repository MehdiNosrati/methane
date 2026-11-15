import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane/ui/field';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthInput, inputSpec, registerMthInput } from './index.js';

describe('<mth-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite conformance, and same-root ARIA', async () => {
    const compiled = compileSpec(inputSpec);
    expect(compiled.tests).toContain('<mth-input>');
    expect(compiled.docs).toContain('`mth-input`');

    let mountedInput: MthInput | null = null;
    const specReport = await runBehaviorSpecAssertions(inputSpec, {
      formControl: {
        mount: () => {
          mountedInput = document.createElement('mth-input') as MthInput;
          mountedInput.label = 'Full name';
          return mountedInput;
        },
        setValue: async (el, value) => {
          const input = el as MthInput;
          await input.updateComplete;
          const nativeInput = input.shadowRoot!.querySelector('input')!;
          nativeInput.value = value;
          nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          nativeInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          await input.updateComplete;
        },
        getValue: (el) => (el as MthInput).value,
        getFormDataValue: (formData, name) => {
          const nativeVal = formData.get(name);
          if (nativeVal !== null) return nativeVal;
          const hasNativeFace =
            typeof ElementInternals !== 'undefined' &&
            typeof ElementInternals.prototype.setFormValue === 'function';
          if (hasNativeFace || !mountedInput) return null;
          return mountedInput.effectivelyDisabled ? null : mountedInput.value;
        },
        getInternalDisabled: (el) => Boolean((el as MthInput).shadowRoot!.querySelector('input')?.disabled),
        isRequiredInvalid: (el) => !(el as MthInput).checkValidity(),
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standaloneReport = await FormControlSuite.run({
      mount: () => {
        mountedInput = document.createElement('mth-input') as MthInput;
        mountedInput.label = 'Email';
        mountedInput.type = 'email';
        return mountedInput;
      },
      setValue: async (el, value) => {
        const input = el as MthInput;
        await input.updateComplete;
        const nativeInput = input.shadowRoot!.querySelector('input')!;
        nativeInput.value = value;
        nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await input.updateComplete;
      },
      getValue: (el) => (el as MthInput).value,
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedInput) return null;
        return mountedInput.effectivelyDisabled ? null : mountedInput.value;
      },
      getInternalDisabled: (el) => Boolean((el as MthInput).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el) => !(el as MthInput).checkValidity(),
    });
    expect(standaloneReport.passed).toBe(true);
  });

  it('renders same-root shadow label/hint/error, mirrors slots, tracks dirty/touched/user-invalid, and supports external <label for>', async () => {
    const extLabel = document.createElement('label');
    extLabel.htmlFor = 'ext-email';
    extLabel.textContent = 'External Label';

    const input = document.createElement('mth-input') as MthInput;
    input.id = 'ext-email';
    input.type = 'email';
    input.required = true;
    input.hint = 'Use company address';

    const slottedHint = document.createElement('span');
    slottedHint.slot = 'hint';
    slottedHint.textContent = 'Mirrored slot hint';
    input.appendChild(slottedHint);

    document.body.append(extLabel, input);
    await input.updateComplete;

    expect(input.labels?.length).toBe(1);
    expect(input.hasCustomState('dirty')).toBe(false);
    expect(input.hasCustomState('touched')).toBe(false);
    expect(input.hasCustomState('user-invalid')).toBe(false);

    const native = input.shadowRoot!.querySelector('#mth-input-control') as HTMLInputElement;
    expect(native.getAttribute('aria-describedby')).toBe('mth-input-hint');
    expect(scanSameRootAria(input).valid).toBe(true);

    native.value = 'not-an-email';
    native.dispatchEvent(new Event('input', { bubbles: true }));
    native.dispatchEvent(new Event('blur', { bubbles: true }));
    await input.updateComplete;

    expect(input.hasCustomState('dirty')).toBe(true);
    expect(input.hasCustomState('touched')).toBe(true);
    expect(input.hasCustomState('user-invalid')).toBe(true);
    expect(native.getAttribute('aria-invalid')).toBe('true');
    expect(native.getAttribute('aria-errormessage')).toBe('mth-input-error');
    expect(scanSameRootAria(input).valid).toBe(true);
  });

  it('consumes FieldContext from <mth-field> and supports progressive Light-DOM <input slot="input"> autofill', async () => {
    const field = document.createElement('mth-field') as HTMLElement & {
      label: string;
      hint: string;
      required: boolean;
      updateComplete: Promise<boolean>;
    };
    field.label = 'Autofill Password';
    field.hint = 'Minimum 8 chars';
    field.required = true;

    const input = document.createElement('mth-input') as MthInput;
    const lightInput = document.createElement('input');
    lightInput.slot = 'input';
    lightInput.name = 'secret';
    lightInput.autocomplete = 'current-password';
    input.appendChild(lightInput);
    field.appendChild(input);
    document.body.appendChild(field);

    await field.updateComplete;
    await input.updateComplete;

    expect(lightInput.required).toBe(true);
    const events: string[] = [];
    input.addEventListener('mth-input', (ev) => {
      events.push((ev as CustomEvent<{ value: string }>).detail.value);
    });

    lightInput.value = 'hunter22';
    lightInput.dispatchEvent(new Event('input', { bubbles: true }));
    await input.updateComplete;

    expect(input.value).toBe('hunter22');
    expect(events).toEqual(['hunter22']);
    expect(scanSameRootAria(field).valid).toBe(true);
  });

  it('submits owning form on Enter when not composing IME', async () => {
    const form = document.createElement('form');
    let submitted = 0;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted += 1;
    });

    const input = document.createElement('mth-input') as MthInput;
    form.appendChild(input);
    document.body.appendChild(form);
    await input.updateComplete;

    const native = input.shadowRoot!.querySelector('input')!;
    native.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(submitted).toBe(1);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-input label="Email" hint="Work email" placeholder="you@co.com"></mth-input>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');
    expect(rawSsr).toContain('shadowrootdelegatesfocus');

    // Use a fresh prefix tag so JSDOM inserts un-upgraded DSD first, then upgrades during HydrationPuritySuite.
    const ssrHtml = rawSsr.replaceAll('mth-input>', 'hyd-input>').replaceAll('<mth-input', '<hyd-input');

    const hydrationReport = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthInput('hyd');
        customElements.upgrade(host);
        await (host as MthInput).updateComplete;
      },
    });
    expect(hydrationReport.failures).toEqual([]);
    expect(hydrationReport.passed).toBe(true);
  });

  it('supports type="password" and forwards aria-label onto slotted Light-DOM input', async () => {
    const input = document.createElement('mth-input') as MthInput;
    input.type = 'password';
    input.label = 'Passphrase';

    const lightInput = document.createElement('input');
    lightInput.setAttribute('slot', 'input');
    lightInput.type = 'password';
    input.appendChild(lightInput);

    document.body.appendChild(input);
    await input.updateComplete;
    await Promise.resolve();

    expect(input.type).toBe('password');
    expect(lightInput.getAttribute('aria-label')).toBe('Passphrase');
  });
});
