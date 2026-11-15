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
import { codeEditorSpec } from './code-editor.spec.js';
import { MthCodeEditor, registerMthCodeEditor } from './index.js';

describe('<mth-code-editor>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, and FormControlSuite', async () => {
    const compiled = compileSpec(codeEditorSpec);
    expect(compiled.docs).toContain('`<mth-code-editor>`');

    let mountedEl: MthCodeEditor | null = null;
    const makeFcAdapter = (label: string) => ({
      mount: async () => {
        const el = document.createElement('mth-code-editor') as MthCodeEditor;
        el.label = label;
        mountedEl = el;
        return el;
      },
      setValue: async (el: HTMLElement, val: string) => {
        (el as MthCodeEditor).value = val;
        await (el as MthCodeEditor).updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthCodeEditor).value,
      getFormDataValue: (fd: FormData, name: string) => {
        const nativeVal = fd.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedEl) return null;
        const blocked = Boolean(
          mountedEl.shadowRoot?.querySelector<HTMLButtonElement>('[part="tab-toggle"]')?.disabled,
        );
        return blocked ? null : mountedEl.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean(el.shadowRoot?.querySelector<HTMLButtonElement>('[part="tab-toggle"]')?.disabled),
    });

    const report = await runBehaviorSpecAssertions(codeEditorSpec, {
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-code-editor') as MthCodeEditor;
          el.label = 'Script';
          return el;
        },
        readAppliedToken: (el: HTMLElement, tokenName: string) =>
          (el as MthCodeEditor).engine?.getThemeToken(tokenName) ?? '',
      },
      formControl: makeFcAdapter('Script'),
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-code-editor') as MthCodeEditor,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthCodeEditor).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const fcReport = await FormControlSuite.run(makeFcAdapter('Config'));
    expect(fcReport.failures).toEqual([]);
    expect(fcReport.passed).toBe(true);
  });

  it('mounts CodeMirror 6 view, moves ARIA onto .cm-content, toggles Tab mode, and reconnects', async () => {
    const el = document.createElement('mth-code-editor') as MthCodeEditor;
    el.value = 'const x = 1;';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.engine?.view).not.toBeNull();
    expect(el.engine?.state.doc.toString()).toBe('const x = 1;');

    const surface = el.shadowRoot!.querySelector<HTMLElement>('#mth-ce-surface')!;
    expect(surface.hasAttribute('role')).toBe(false);
    expect(surface.hasAttribute('aria-readonly')).toBe(false);

    const cmContent = el.shadowRoot!.querySelector<HTMLElement>('.cm-content')!;
    expect(cmContent.getAttribute('role')).toBe('textbox');
    el.readonly = true;
    await el.updateComplete;
    expect(cmContent.getAttribute('aria-readonly')).toBe('true');
    el.readonly = false;
    await el.updateComplete;

    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="tab-toggle"]')!;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    toggle.click();
    await el.updateComplete;
    expect(el.tabTrapsFocus).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');

    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.cm-content')).not.toBeNull();
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-code-editor label="Snippet" value="let a = 1;"></mth-code-editor>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-code-editor>', 'hyd-code-editor>')
      .replaceAll('<mth-code-editor', '<hyd-code-editor');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCodeEditor('hyd');
        customElements.upgrade(host);
        await (host as MthCodeEditor).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
