import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthPromptInput, promptInputSpec, registerMthPromptInput } from './index.js';

describe('<mth-prompt-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and FormControlSuite conformance', async () => {
    const compiled = compileSpec(promptInputSpec);
    expect(compiled.docs).toContain('`<mth-prompt-input>`');

    let mountedEl: MthPromptInput | null = null;
    const adapter = {
      mount: async () => {
        mountedEl = document.createElement('mth-prompt-input') as MthPromptInput;
        mountedEl.required = true;
        return mountedEl;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const host = el as MthPromptInput;
        host.value = value;
        await host.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthPromptInput).value,
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
        Boolean(el.shadowRoot!.querySelector<HTMLTextAreaElement>('textarea')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthPromptInput).checkValidity(),
      nextValue: 'Summarize release notes',
    };

    const report = await runBehaviorSpecAssertions(promptInputSpec, { formControl: adapter });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const fc = await FormControlSuite.run(adapter);
    expect(fc.failures).toEqual([]);
    expect(fc.passed).toBe(true);
  });

  it('guards Enter during IME composition and supports Mod+Enter and streaming stop button', async () => {
    const el = document.createElement('mth-prompt-input') as MthPromptInput;
    document.body.appendChild(el);
    await el.updateComplete;

    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>('textarea')!;
    let submitted = '';
    el.addEventListener('mth-submit', (e: Event) => {
      submitted = (e as CustomEvent<{ value: string }>).detail.value;
    });

    textarea.value = 'Draft prompt';
    textarea.dispatchEvent(new Event('compositionstart', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(submitted).toBe('');

    textarea.dispatchEvent(new Event('compositionend', { bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('Draft prompt');

    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(submitted).toBe('Draft prompt');

    // Mod+Enter mode when submitOnEnter=false
    submitted = '';
    el.submitOnEnter = false;
    await el.updateComplete;
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(submitted).toBe('');
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true, bubbles: true }));
    expect(submitted).toBe('Draft prompt');

    // Streaming stop button
    el.streaming = true;
    await el.updateComplete;
    let stopped = false;
    el.addEventListener('mth-stop', () => {
      stopped = true;
    });
    el.shadowRoot!.querySelector<HTMLElement>('[part="stop-button"]')?.click();
    expect(stopped).toBe(true);
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-prompt-input label="Ask" value="Hello"></mth-prompt-input>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('<mth-prompt-input', '<hyd-prompt-input')
      .replaceAll('</mth-prompt-input>', '</hyd-prompt-input>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPromptInput('hyd');
        customElements.upgrade(host);
        await (host as MthPromptInput).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
