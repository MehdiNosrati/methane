import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { captchaSlotSpec } from './captcha-slot.spec.js';
import { MthCaptchaSlot, registerMthCaptchaSlot } from './index.js';

describe('<mth-captcha-slot>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(captchaSlotSpec);
    expect(compiled.tests).toContain('<mth-captcha-slot>');

    let mounted: MthCaptchaSlot | null = null;
    const adapter = {
      mount: () => {
        mounted = document.createElement('mth-captcha-slot') as MthCaptchaSlot;
        mounted.label = 'Bot verification';
        mounted.provider = 'turnstile';
        return mounted;
      },
      nextValue: 'token-abc-123',
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthCaptchaSlot;
        await host.updateComplete;
        host.setToken(value);
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthCaptchaSlot).value,
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
        (el as MthCaptchaSlot).shadowRoot!.querySelector('[part="container"]')?.getAttribute('aria-disabled') === 'true',
      isRequiredInvalid: (el: HTMLElement) => !(el as MthCaptchaSlot).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(captchaSlotSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run(adapter);
    expect(standalone.passed).toBe(true);
  });

  it('bridges Light-DOM widget mount slot with token verify/expire lifecycle', async () => {
    const el = document.createElement('mth-captcha-slot') as MthCaptchaSlot;
    el.label = 'Human check';
    el.provider = 'hcaptcha';
    el.sitekey = 'site-123';
    el.required = true;

    const widget = document.createElement('div');
    widget.className = 'h-captcha';
    el.appendChild(widget);

    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    expect(el.checkValidity()).toBe(false);
    expect(el.verified).toBe(false);

    const events: string[] = [];
    el.addEventListener('mth-verify', () => events.push('verify'));
    el.addEventListener('mth-expire', () => events.push('expire'));

    el.setToken('cf-turnstile-token');
    await el.updateComplete;
    expect(el.verified).toBe(true);
    expect(el.checkValidity()).toBe(true);
    expect(events).toEqual(['verify']);

    const resetBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="reset"]')!;
    resetBtn.click();
    await el.updateComplete;
    expect(el.verified).toBe(false);
    expect(el.value).toBe('');
    expect(el.checkValidity()).toBe(false);
    expect(events).toEqual(['verify', 'expire']);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-captcha-slot label="Verification" provider="turnstile"></mth-captcha-slot>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-captcha-slot>', 'hyd-captcha-slot>')
      .replaceAll('<mth-captcha-slot', '<hyd-captcha-slot');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCaptchaSlot('hyd');
        customElements.upgrade(host);
        await (host as MthCaptchaSlot).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
