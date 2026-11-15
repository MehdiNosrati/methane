import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { authFormSpec } from './auth-form.spec.js';
import { MthAuthForm, registerMthAuthForm } from './index.js';

describe('<mth-auth-form>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and FormControlSuite conformance', async () => {
    const compiled = compileSpec(authFormSpec);
    expect(compiled.docs).toContain('`<mth-auth-form>`');

    let mountedEl: MthAuthForm | null = null;
    const adapter = {
      mount: async () => {
        mountedEl = document.createElement('mth-auth-form') as MthAuthForm;
        mountedEl.mode = 'magic-link';
        mountedEl.required = true;
        return mountedEl;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthAuthForm;
        host.value = value;
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthAuthForm).value,
      getFormDataValue: (fd: FormData, name: string) => {
        const nativeVal = fd.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedEl) return null;
        return mountedEl.effectivelyDisabled ? null : mountedEl.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean(el.shadowRoot!.querySelector<HTMLInputElement>('#mth-af-email')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthAuthForm).checkValidity(),
      nextValue: 'user@methane.dev',
    };

    const report = await runBehaviorSpecAssertions(authFormSpec, { formControl: adapter });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const fc = await FormControlSuite.run(adapter);
    expect(fc.failures).toEqual([]);
    expect(fc.passed).toBe(true);
  });

  it('supports autofill attributes, password autocomplete switching, and error alerts', async () => {
    const form = document.createElement('mth-auth-form') as MthAuthForm;
    form.mode = 'signin';
    document.body.appendChild(form);
    await form.updateComplete;

    expect(form.shadowRoot!.querySelector('#mth-af-email')?.getAttribute('autocomplete')).toBe('email');
    expect(form.shadowRoot!.querySelector('#mth-af-password')?.getAttribute('autocomplete')).toBe(
      'current-password',
    );

    form.mode = 'signup';
    await form.updateComplete;
    expect(form.shadowRoot!.querySelector('#mth-af-password')?.getAttribute('autocomplete')).toBe(
      'new-password',
    );
    expect(form.shadowRoot!.querySelector('#mth-af-name')?.getAttribute('autocomplete')).toBe('name');

    form.email = 'ada@methane.dev';
    form.password = 'secret123';
    form.fullName = 'Ada Lovelace';
    await form.updateComplete;

    let submittedDetail: unknown = null;
    form.addEventListener('mth-submit', (e: Event) => {
      submittedDetail = (e as CustomEvent).detail;
    });
    expect(form.submit()).toBe(true);
    expect(submittedDetail).toEqual({
      mode: 'signup',
      email: 'ada@methane.dev',
      password: 'secret123',
      fullName: 'Ada Lovelace',
    });
    expect(scanSameRootAria(form).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-auth-form mode="signin" email="ada@methane.dev"></mth-auth-form>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-auth-form', '<hyd-auth-form')
      .replaceAll('</mth-auth-form>', '</hyd-auth-form>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAuthForm('hyd');
        customElements.upgrade(host);
        await (host as MthAuthForm).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('emits mth-submit exactly once when clicking submit button inside form', async () => {
    const form = document.createElement('mth-auth-form') as MthAuthForm;
    form.mode = 'magic-link';
    form.email = 'single@methane.dev';
    document.body.appendChild(form);
    await form.updateComplete;

    const onSubmit = vi.fn();
    form.addEventListener('mth-submit', onSubmit);

    const submitBtn = form.shadowRoot!.querySelector<HTMLElement>('[part="submit-button"]')!;
    const innerBtn = submitBtn.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
    innerBtn.click();
    await form.updateComplete;

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
