import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthMfaChallenge, mfaChallengeSpec, registerMthMfaChallenge } from './index.js';

describe('<mth-mfa-challenge>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, and RovingFocusSuite', async () => {
    const compiled = compileSpec(mfaChallengeSpec);
    expect(compiled.docs).toContain('`<mth-mfa-challenge>`');

    let mountedEl: MthMfaChallenge | null = null;
    const formAdapter = {
      mount: async () => {
        mountedEl = document.createElement('mth-mfa-challenge') as MthMfaChallenge;
        mountedEl.required = true;
        return mountedEl;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthMfaChallenge;
        host.value = value;
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthMfaChallenge).value,
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
        Boolean(el.shadowRoot!.querySelector<HTMLInputElement>('[part="digit"]')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthMfaChallenge).checkValidity(),
      nextValue: '123456',
    };

    const rfAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-mfa-challenge') as MthMfaChallenge;
        el.dir = dir;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el: HTMLElement) => (el as MthMfaChallenge).getDigitElements(),
      orientation: 'horizontal' as const,
      loop: false,
    };

    const report = await runBehaviorSpecAssertions(mfaChallengeSpec, {
      formControl: formAdapter,
      rovingFocus: rfAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const fc = await FormControlSuite.run(formAdapter);
    expect(fc.failures).toEqual([]);
    expect(fc.passed).toBe(true);

    const rf = await RovingFocusSuite.run(rfAdapter);
    expect(rf.failures).toEqual([]);
    expect(rf.passed).toBe(true);
  });

  it('supports multi-cell TOTP paste, completion event, backup mode toggle, and SSR hydration', async () => {
    const el = document.createElement('mth-mfa-challenge') as MthMfaChallenge;
    document.body.appendChild(el);
    await el.updateComplete;

    let completedValue = '';
    el.addEventListener('mth-complete', ((ev: CustomEvent<{ value: string }>) => {
      completedValue = ev.detail.value;
    }) as EventListener);

    const digits = el.getDigitElements();
    expect(digits).toHaveLength(6);

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => '48-19-26' },
    });
    digits[0]!.dispatchEvent(pasteEvent);
    await el.updateComplete;

    expect(el.value).toBe('481926');
    expect(completedValue).toBe('481926');

    const toggleBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('.link-btn')!;
    toggleBtn.click();
    await el.updateComplete;
    expect(el.mode).toBe('backup');
    expect(el.shadowRoot!.querySelector('[part="backup-input"]')).toBeTruthy();

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);

    const rawSsr = await renderLitDsdHtml(litHtml`<mth-mfa-challenge></mth-mfa-challenge>`);
    const ssrHtml = rawSsr
      .replaceAll('<mth-mfa-challenge', '<hyd-mfa-challenge')
      .replaceAll('</mth-mfa-challenge>', '</hyd-mfa-challenge>');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMfaChallenge('hyd');
        customElements.upgrade(host);
        await (host as MthMfaChallenge).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });

  it('displays FACE validation error on failed submit, guards NaN length, and respects ancestor dir="rtl"', async () => {
    const rtlWrap = document.createElement('div');
    rtlWrap.setAttribute('dir', 'rtl');
    const el = document.createElement('mth-mfa-challenge') as MthMfaChallenge;
    el.length = Number.NaN;
    rtlWrap.appendChild(el);
    document.body.appendChild(rtlWrap);
    await el.updateComplete;

    const digits = el.getDigitElements();
    expect(digits).toHaveLength(6);

    digits[0]!.focus();
    digits[0]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }),
    );
    expect(el.getDigitElements()[1]!.tabIndex).toBe(0);

    const submitBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="submit"]')!;
    submitBtn.click();
    await el.updateComplete;

    const errEl = el.shadowRoot!.querySelector<HTMLElement>('#mth-mfa-err')!;
    expect(errEl.hidden).toBe(false);
    expect(errEl.textContent?.trim()).toBeTruthy();
    expect(el.getDigitElements()[0]!.getAttribute('aria-invalid')).toBe('true');
    const digitsGroup = el.shadowRoot!.querySelector<HTMLElement>('[part="digits"]')!;
    expect(digitsGroup.getAttribute('aria-describedby')).toContain('mth-mfa-err');
  });
});
