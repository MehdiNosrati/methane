import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/field';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { textareaSpec } from './textarea.spec.js';
import { MthTextarea, registerMthTextarea } from './index.js';

describe('<mth-textarea>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite conformance, and same-root ARIA', async () => {
    const compiled = compileSpec(textareaSpec);
    expect(compiled.tests).toContain('<mth-textarea>');
    expect(compiled.docs).toContain('`<mth-textarea>`');

    let mountedTextarea: MthTextarea | null = null;
    const adapter = {
      mount: () => {
        mountedTextarea = document.createElement('mth-textarea') as MthTextarea;
        mountedTextarea.label = 'Notes';
        return mountedTextarea;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const ta = el as MthTextarea;
        await ta.updateComplete;
        const nativeTa = ta.shadowRoot!.querySelector('textarea')!;
        nativeTa.value = value;
        nativeTa.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        nativeTa.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await ta.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthTextarea).value,
      getFormDataValue: (formData: FormData, name: string) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedTextarea) return null;
        return mountedTextarea.effectivelyDisabled ? null : mountedTextarea.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean((el as MthTextarea).shadowRoot!.querySelector('textarea')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthTextarea).checkValidity(),
    };

    const specReport = await runBehaviorSpecAssertions(textareaSpec, { formControl: adapter });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standaloneReport = await FormControlSuite.run(adapter);
    expect(standaloneReport.failures).toEqual([]);
    expect(standaloneReport.passed).toBe(true);
  });

  it('tracks character count, validates minlength/maxlength, and links aria-describedby', async () => {
    const ta = document.createElement('mth-textarea') as MthTextarea;
    ta.label = 'Bio';
    ta.hint = 'Brief summary';
    ta.minlength = 5;
    ta.maxlength = 120;
    ta.rows = 4;
    document.body.appendChild(ta);
    await ta.updateComplete;

    const nativeTa = ta.shadowRoot!.querySelector('textarea')!;
    expect(nativeTa.rows).toBe(4);
    expect(nativeTa.getAttribute('aria-describedby')).toBe('mth-textarea-hint mth-textarea-count');
    expect(
      ta.shadowRoot!.querySelector('#mth-textarea-count')?.textContent?.replace(/[\u2068\u2069]/g, '').trim(),
    ).toBe('0 / 120');

    nativeTa.value = 'hi';
    nativeTa.dispatchEvent(new Event('input', { bubbles: true }));
    nativeTa.dispatchEvent(new Event('blur', { bubbles: true }));
    await ta.updateComplete;

    expect(ta.checkValidity()).toBe(false);
    expect(ta.hasCustomState('user-invalid')).toBe(true);
    expect(
      ta.shadowRoot!.querySelector('#mth-textarea-count')?.textContent?.replace(/[\u2068\u2069]/g, '').trim(),
    ).toBe('2 / 120');
    expect(scanSameRootAria(ta).valid).toBe(true);
  });

  it('supports autoResize via adopted CSSStyleSheet without inline style attributes', async () => {
    const ta = document.createElement('mth-textarea') as MthTextarea;
    ta.label = 'Comments';
    ta.autoResize = true;
    document.body.appendChild(ta);
    await ta.updateComplete;

    const nativeTa = ta.shadowRoot!.querySelector('textarea')!;
    Object.defineProperty(nativeTa, 'scrollHeight', { configurable: true, value: 144 });

    nativeTa.value = 'Line 1\nLine 2\nLine 3\nLine 4';
    nativeTa.dispatchEvent(new Event('input', { bubbles: true }));
    await ta.updateComplete;

    expect(ta.shadowRoot!.querySelectorAll('[style]')).toHaveLength(0);
    const sheets = ta.shadowRoot!.adoptedStyleSheets;
    expect(sheets.length).toBeGreaterThanOrEqual(1);
    const hasAutoHeightRule = sheets.some((s) =>
      Array.from(s.cssRules ?? []).some((r) => r.cssText.includes('144px')),
    );
    expect(hasAutoHeightRule).toBe(true);
  });

  it('consumes FieldContext from <mth-field> and supports external <label for>', async () => {
    const extLabel = document.createElement('label');
    extLabel.htmlFor = 'ext-ta';
    extLabel.textContent = 'External Bio';

    const field = document.createElement('mth-field') as HTMLElement & {
      label: string;
      hint: string;
      required: boolean;
      updateComplete: Promise<boolean>;
    };
    field.label = 'Field Label';
    field.hint = 'Field Hint';
    field.required = true;

    const ta = document.createElement('mth-textarea') as MthTextarea;
    ta.id = 'ext-ta';
    field.appendChild(ta);
    document.body.append(extLabel, field);

    await field.updateComplete;
    await ta.updateComplete;

    expect(ta.labels?.length).toBe(1);
    expect(ta.shadowRoot!.querySelector('textarea')?.required).toBe(true);
    expect(scanSameRootAria(field).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-textarea label="Summary" hint="Optional" maxlength="100"></mth-textarea>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');
    expect(rawSsr).toContain('shadowrootdelegatesfocus');

    const ssrHtml = rawSsr
      .replaceAll('mth-textarea>', 'hyd-textarea>')
      .replaceAll('<mth-textarea', '<hyd-textarea');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTextarea('hyd');
        customElements.upgrade(host);
        await (host as MthTextarea).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
