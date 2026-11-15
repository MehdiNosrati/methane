import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { newsletterFormSpec } from './newsletter-form.spec.js';
import { MthNewsletterForm, registerMthNewsletterForm } from './index.js';

describe('<mth-newsletter-form>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and FormControlSuite conformance', async () => {
    const compiled = compileSpec(newsletterFormSpec);
    expect(compiled.docs).toContain('`<mth-newsletter-form>`');

    let mounted: MthNewsletterForm | null = null;
    const formAdapter = {
      mount: () => {
        mounted = document.createElement('mth-newsletter-form') as MthNewsletterForm;
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const nf = el as MthNewsletterForm;
        await nf.updateComplete;
        const nativeInput = nf.shadowRoot!.querySelector<HTMLInputElement>('input')!;
        nativeInput.value = value;
        nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        nativeInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await nf.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthNewsletterForm).value,
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
        Boolean((el as MthNewsletterForm).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthNewsletterForm).checkValidity(),
      nextValue: 'reader@methane.dev',
    };

    const report = await runBehaviorSpecAssertions(newsletterFormSpec, {
      formControl: formAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const suiteReport = await FormControlSuite.run(formAdapter);
    expect(suiteReport.passed).toBe(true);
  });

  it('validates email addresses and emits mth-submit when valid', async () => {
    const nf = document.createElement('mth-newsletter-form') as MthNewsletterForm;
    document.body.appendChild(nf);
    await nf.updateComplete;

    expect(nf.submit()).toBe(false);
    expect(nf.invalid).toBe(true);

    nf.value = 'not-an-email';
    await nf.updateComplete;
    expect(nf.submit()).toBe(false);
    expect(nf.invalid).toBe(true);
    await nf.updateComplete;
    const input = nf.shadowRoot?.querySelector<HTMLInputElement>('input');
    expect(input?.getAttribute('aria-errormessage')).toBe('mth-nf-status');

    // Reconnect preserves InputController binding
    nf.remove();
    document.body.appendChild(nf);
    await nf.updateComplete;
    if (input) {
      input.value = 'reconnected@methane.dev';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await nf.updateComplete;
    expect(nf.value).toBe('reconnected@methane.dev');

    let submittedEmail = '';
    nf.addEventListener('mth-submit', (e: Event) => {
      submittedEmail = (e as CustomEvent<{ email: string }>).detail.email;
    });
    nf.value = 'user@methane.dev';
    await nf.updateComplete;
    expect(nf.submit()).toBe(true);
    expect(submittedEmail).toBe('user@methane.dev');
    expect(nf.submitted).toBe(true);
    expect(scanSameRootAria(nf).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-newsletter-form value="a@b.com"></mth-newsletter-form>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-newsletter-form', '<hyd-newsletter-form')
      .replaceAll('</mth-newsletter-form>', '</hyd-newsletter-form>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthNewsletterForm('hyd');
        customElements.upgrade(host);
        await (host as MthNewsletterForm).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
