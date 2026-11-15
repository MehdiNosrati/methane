import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { mathEditorSpec } from './math-editor.spec.js';
import { MthMathEditor, registerMthMathEditor } from './index.js';

describe('<mth-math-editor>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, and FormControlSuite', async () => {
    const compiled = compileSpec(mathEditorSpec);
    expect(compiled.docs).toContain('`<mth-math-editor>`');

    let mountedEl: MthMathEditor | null = null;
    const makeFcAdapter = (label: string) => ({
      mount: async () => {
        const el = document.createElement('mth-math-editor') as MthMathEditor;
        el.label = label;
        mountedEl = el;
        return el;
      },
      setValue: async (el: HTMLElement, val: string) => {
        (el as MthMathEditor).value = val;
        await (el as MthMathEditor).updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthMathEditor).value,
      getFormDataValue: (fd: FormData, name: string) => {
        const nativeVal = fd.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedEl) return null;
        const blocked = Boolean(
          mountedEl.shadowRoot?.querySelector<HTMLTextAreaElement>('[part="textarea"]')?.disabled,
        );
        return blocked ? null : mountedEl.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean(el.shadowRoot?.querySelector<HTMLTextAreaElement>('[part="textarea"]')?.disabled),
    });

    const report = await runBehaviorSpecAssertions(mathEditorSpec, {
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-math-editor') as MthMathEditor;
          el.label = 'Equation';
          return el;
        },
        readAppliedToken: (el: HTMLElement, tokenName: string) =>
          (el as MthMathEditor).engine?.getThemeToken(tokenName) ?? '',
      },
      formControl: makeFcAdapter('Equation'),
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-math-editor') as MthMathEditor,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthMathEditor).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const fcReport = await FormControlSuite.run(makeFcAdapter('Formula'));
    expect(fcReport.failures).toEqual([]);
    expect(fcReport.passed).toBe(true);
  });

  it('renders KaTeX formula safely and surfaces parse errors without unsafe HTML', async () => {
    const el = document.createElement('mth-math-editor') as MthMathEditor;
    el.value = '\\frac{a}{b}';
    document.body.appendChild(el);
    await el.updateComplete;

    const preview = el.shadowRoot!.querySelector<HTMLElement>('[part="preview"]')!;
    expect(preview.querySelector('.katex')).not.toBeNull();
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);

    const errorSpy = vi.fn();
    el.addEventListener('mth-error', errorSpy);
    el.value = '\\frac{1';
    await el.updateComplete;

    expect(errorSpy).toHaveBeenCalled();
    expect(el.checkValidity()).toBe(false);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="error"]')?.textContent).toBeTruthy();
    expect(
      el.shadowRoot!.querySelector('#mth-math-textarea')?.getAttribute('aria-invalid'),
    ).toBe('true');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);

    // Required empty aria-invalid + same-instance reconnect
    el.value = '';
    el.required = true;
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector('#mth-math-textarea')?.getAttribute('aria-invalid'),
    ).toBe('true');

    el.value = 'E=mc^2';
    el.required = false;
    await el.updateComplete;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(preview.querySelector('.katex')).not.toBeNull();
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-math-editor label="Equation" value="E=mc^2"></mth-math-editor>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-math-editor>', 'hyd-math-editor>')
      .replaceAll('<mth-math-editor', '<hyd-math-editor');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMathEditor('hyd');
        customElements.upgrade(host);
        await (host as MthMathEditor).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
