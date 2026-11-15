import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { markdownEditorSpec } from './markdown-editor.spec.js';
import { MthMarkdownEditor, registerMthMarkdownEditor } from './index.js';

describe('<mth-markdown-editor>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, and FormControlSuite', async () => {
    const compiled = compileSpec(markdownEditorSpec);
    expect(compiled.docs).toContain('`<mth-markdown-editor>`');

    let mountedEl: MthMarkdownEditor | null = null;
    const makeFcAdapter = (label: string) => ({
      mount: async () => {
        const el = document.createElement('mth-markdown-editor') as MthMarkdownEditor;
        el.label = label;
        mountedEl = el;
        return el;
      },
      setValue: async (el: HTMLElement, val: string) => {
        (el as MthMarkdownEditor).value = val;
        await (el as MthMarkdownEditor).updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthMarkdownEditor).value,
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

    const report = await runBehaviorSpecAssertions(markdownEditorSpec, {
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-markdown-editor') as MthMarkdownEditor;
          el.label = 'Post';
          return el;
        },
        readAppliedToken: (el: HTMLElement, tokenName: string) =>
          (el as MthMarkdownEditor).engine?.getThemeToken(tokenName) ?? '',
      },
      formControl: makeFcAdapter('Post'),
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-markdown-editor') as MthMarkdownEditor,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthMarkdownEditor).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const fcReport = await FormControlSuite.run(makeFcAdapter('Body'));
    expect(fcReport.failures).toEqual([]);
    expect(fcReport.passed).toBe(true);
  });

  it('sanitizes XSS and unsafe schemes in preview mode, preserves valid label ARIA, and reconnects', async () => {
    const el = document.createElement('mth-markdown-editor') as MthMarkdownEditor;
    el.label = 'Release Notes';
    el.mode = 'preview';
    el.value = '# Title\n\n[Click](javascript:alert(1)) <script>alert(2)</script>';
    document.body.appendChild(el);
    await el.updateComplete;

    const preview = el.shadowRoot!.querySelector<HTMLElement>('[part="preview"]')!;
    expect(preview.querySelector('script')).toBeNull();
    const link = preview.querySelector('a');
    if (link) {
      expect(link.getAttribute('href') ?? '').not.toContain('javascript:');
    }
    const labelEl = el.shadowRoot!.querySelector('label')!;
    expect(labelEl.hasAttribute('for')).toBe(false);
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);

    // Switch to write mode, check required aria-invalid, and reconnect
    el.mode = 'write';
    el.required = true;
    el.value = '';
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    await el.updateComplete;
    const ta = el.shadowRoot!.querySelector<HTMLTextAreaElement>('[part="textarea"]')!;
    expect(ta.getAttribute('aria-invalid')).toBe('true');

    el.mode = 'preview';
    el.value = '# Reconnected Preview';
    await el.updateComplete;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="preview"] h1')?.textContent).toBe(
      'Reconnected Preview',
    );
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-markdown-editor label="Article" value="# Hello"></mth-markdown-editor>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-markdown-editor>', 'hyd-markdown-editor>')
      .replaceAll('<mth-markdown-editor', '<hyd-markdown-editor');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMarkdownEditor('hyd');
        customElements.upgrade(host);
        await (host as MthMarkdownEditor).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
