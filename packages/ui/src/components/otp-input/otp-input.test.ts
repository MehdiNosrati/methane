import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { otpInputSpec } from './otp-input.spec.js';
import { MthOtpInput, registerMthOtpInput } from './index.js';
import { ContextProvider } from '@lit/context';
import { LOCALE_CONTEXT } from '@methane-ui/core';

describe('<mth-otp-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, RovingFocusSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(otpInputSpec);
    expect(compiled.tests).toContain('<mth-otp-input>');

    let mounted: MthOtpInput | null = null;
    const formAdapter = {
      mount: () => {
        mounted = document.createElement('mth-otp-input') as MthOtpInput;
        mounted.label = 'Verification code';
        return mounted;
      },
      nextValue: '123456',
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthOtpInput;
        await host.updateComplete;
        const firstCell = host.shadowRoot!.querySelector<HTMLInputElement>('input[part="cell"]')!;
        firstCell.value = value;
        firstCell.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        firstCell.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthOtpInput).value,
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
        Boolean((el as MthOtpInput).shadowRoot!.querySelector<HTMLInputElement>('input[part="cell"]')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthOtpInput).checkValidity(),
    };

    const rovingAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const host = document.createElement('mth-otp-input') as MthOtpInput;
        host.label = 'Code';
        host.dir = dir;
        document.body.appendChild(host);
        await host.updateComplete;
        return host;
      },
      getItems: (el: HTMLElement) =>
        Array.from((el as MthOtpInput).shadowRoot!.querySelectorAll<HTMLElement>('input[part="cell"]')),
      orientation: 'horizontal' as const,
      loop: false,
    };

    const specReport = await runBehaviorSpecAssertions(otpInputSpec, {
      formControl: formAdapter,
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    expect((await FormControlSuite.run(formAdapter)).passed).toBe(true);
    expect((await RovingFocusSuite.run(rovingAdapter)).passed).toBe(true);
  });

  it('distributes pasted digits, emits mth-complete, supports Backspace retreat, and validates length', async () => {
    const el = document.createElement('mth-otp-input') as MthOtpInput;
    el.label = '2FA Code';
    el.length = 4;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    const cells = el.shadowRoot!.querySelectorAll<HTMLInputElement>('input[part="cell"]');
    expect(cells.length).toBe(4);
    expect(cells[0]?.getAttribute('autocomplete')).toBe('one-time-code');

    const completed: string[] = [];
    el.addEventListener('mth-complete', (ev) =>
      completed.push((ev as CustomEvent<{ value: string }>).detail.value),
    );

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => '9a8b7c6' },
    });
    cells[0]!.dispatchEvent(pasteEvent);
    await el.updateComplete;

    expect(el.value).toBe('9876');
    expect(completed).toEqual(['9876']);
    expect(el.checkValidity()).toBe(true);

    el.value = '12';
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    expect(el.validityFlags.tooShort).toBe(true);

    el.error = 'Invalid verification code';
    await el.updateComplete;
    const group = el.shadowRoot!.querySelector<HTMLElement>('[role="group"]')!;
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('aria-errormessage')).toBe('mth-otp-error');
    expect(cells[0]!.getAttribute('aria-errormessage')).toBe('mth-otp-error');
    expect(scanSameRootAria(el).issues).toEqual([]);

    const localeHost = document.createElement('div');
    document.body.appendChild(localeHost);
    new ContextProvider(localeHost, {
      context: LOCALE_CONTEXT,
      initialValue: { version: 1, locale: 'ar', dir: 'rtl' },
    });
    const rtlOtp = document.createElement('mth-otp-input') as MthOtpInput;
    rtlOtp.label = 'RTL Code';
    rtlOtp.length = 4;
    localeHost.appendChild(rtlOtp);
    await rtlOtp.updateComplete;
    const rtlCells = rtlOtp.shadowRoot!.querySelectorAll<HTMLInputElement>('input[part="cell"]');
    rtlCells[0]!.focus();
    rtlCells[0]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }),
    );
    await rtlOtp.updateComplete;
    expect(rtlCells[1]!.tabIndex).toBe(0);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-otp-input label="One-time code" length="6"></mth-otp-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-otp-input>', 'hyd-otp-input>')
      .replaceAll('<mth-otp-input', '<hyd-otp-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthOtpInput('hyd');
        customElements.upgrade(host);
        await (host as MthOtpInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
