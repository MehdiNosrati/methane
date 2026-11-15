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
import { richEditorSpec } from './rich-editor.spec.js';
import { MthRichEditor, registerMthRichEditor } from './index.js';

describe('<mth-rich-editor>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite (50x lifecycle + token sync), and FormControlSuite', async () => {
    const compiled = compileSpec(richEditorSpec);
    expect(compiled.docs).toContain('`<mth-rich-editor>`');

    let mountedSpecEl: MthRichEditor | null = null;
    const makeFcAdapter = (label: string) => ({
      mount: async () => {
        const el = document.createElement('mth-rich-editor') as MthRichEditor;
        el.label = label;
        mountedSpecEl = el;
        return el;
      },
      setValue: async (el: HTMLElement, val: string) => {
        (el as MthRichEditor).value = val;
        await (el as MthRichEditor).updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthRichEditor).value,
      getFormDataValue: (fd: FormData, name: string) => {
        const nativeVal = fd.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedSpecEl) return null;
        const blocked = Boolean(
          mountedSpecEl.shadowRoot?.querySelector<HTMLButtonElement>('[part="tool-button"]')?.disabled,
        );
        return blocked ? null : mountedSpecEl.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean(el.shadowRoot?.querySelector<HTMLButtonElement>('[part="tool-button"]')?.disabled),
    });

    const report = await runBehaviorSpecAssertions(richEditorSpec, {
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-rich-editor') as MthRichEditor;
          el.label = 'Notes';
          return el;
        },
        readAppliedToken: (el: HTMLElement, tokenName: string) =>
          (el as MthRichEditor).engine?.getThemeToken(tokenName) ?? '',
      },
      formControl: makeFcAdapter('Notes'),
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-rich-editor') as MthRichEditor,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthRichEditor).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const fcReport = await FormControlSuite.run(makeFcAdapter('Bio'));
    expect(fcReport.failures).toEqual([]);
    expect(fcReport.passed).toBe(true);
  });

  it('sanitizes unsafe HTML, syncs disabled/readonly/required on ProseMirror, and reconnects cleanly', async () => {
    const el = document.createElement('mth-rich-editor') as MthRichEditor;
    el.label = 'Article Body';
    el.value = '<p>Hello <script>alert(1)</script><strong>World</strong></p>';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.value).not.toContain('<script');
    expect(el.value).toContain('Hello');
    expect(el.engine?.state.doc.textContent).toContain('Hello');
    const pmEl = () => el.shadowRoot!.querySelector<HTMLElement>('.ProseMirror')!;
    const surfaceEl = el.shadowRoot!.querySelector<HTMLElement>('#mth-re-surface')!;
    expect(surfaceEl.hasAttribute('aria-readonly')).toBe(false);
    expect(surfaceEl.hasAttribute('aria-placeholder')).toBe(false);
    expect(pmEl().getAttribute('role')).toBe('textbox');
    expect(pmEl().getAttribute('aria-multiline')).toBe('true');
    expect(pmEl().getAttribute('contenteditable')).toBe('true');

    // Dynamic disabled & readonly props toggle ProseMirror editability and ARIA
    el.disabled = true;
    await el.updateComplete;
    expect(pmEl().getAttribute('contenteditable')).toBe('false');
    expect(pmEl().getAttribute('aria-disabled')).toBe('true');
    el.disabled = false;
    el.readonly = true;
    await el.updateComplete;
    expect(pmEl().getAttribute('contenteditable')).toBe('false');
    expect(pmEl().getAttribute('aria-readonly')).toBe('true');
    el.readonly = false;
    await el.updateComplete;
    expect(pmEl().getAttribute('contenteditable')).toBe('true');

    // Empty doc serialization + required validity check
    el.required = true;
    const view = el.engine!.view!;
    view.dispatch(view.state.tr.delete(0, view.state.doc.content.size));
    await el.updateComplete;
    expect(el.value).toBe('');
    expect(el.checkValidity()).toBe(false);
    await el.updateComplete;
    expect(pmEl().getAttribute('aria-invalid')).toBe('true');

    // Same-instance reconnect restores editor surface
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.ProseMirror')).not.toBeNull();
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-rich-editor label="Body"><p slot="fallback">Rich editor</p></mth-rich-editor>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-rich-editor>', 'hyd-rich-editor>')
      .replaceAll('<mth-rich-editor', '<hyd-rich-editor');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthRichEditor('hyd');
        customElements.upgrade(host);
        await (host as MthRichEditor).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
