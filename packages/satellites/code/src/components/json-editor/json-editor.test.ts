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
import { jsonEditorSpec } from './json-editor.spec.js';
import { MthJsonEditor, registerMthJsonEditor } from './index.js';

describe('<mth-json-editor>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, and FormControlSuite', async () => {
    const compiled = compileSpec(jsonEditorSpec);
    expect(compiled.docs).toContain('`<mth-json-editor>`');

    let mountedEl: MthJsonEditor | null = null;
    const makeFcAdapter = (label: string) => ({
      mount: async () => {
        const el = document.createElement('mth-json-editor') as MthJsonEditor;
        el.label = label;
        mountedEl = el;
        return el;
      },
      setValue: async (el: HTMLElement, val: string) => {
        (el as MthJsonEditor).value = val;
        await (el as MthJsonEditor).updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthJsonEditor).value,
      nextValue: '{"ok":true}',
      getFormDataValue: (fd: FormData, name: string) => {
        const nativeVal = fd.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedEl) return null;
        const blocked = Boolean(
          mountedEl.shadowRoot?.querySelector<HTMLButtonElement>('[part="tool-button"]')?.disabled,
        );
        return blocked ? null : mountedEl.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean(el.shadowRoot?.querySelector<HTMLButtonElement>('[part="tool-button"]')?.disabled),
    });

    const report = await runBehaviorSpecAssertions(jsonEditorSpec, {
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-json-editor') as MthJsonEditor;
          el.label = 'Settings';
          return el;
        },
        readAppliedToken: (el: HTMLElement, tokenName: string) =>
          (el as MthJsonEditor).engine?.getThemeToken(tokenName) ?? '',
      },
      formControl: makeFcAdapter('Settings'),
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-json-editor') as MthJsonEditor,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthJsonEditor).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const fcReport = await FormControlSuite.run(makeFcAdapter('Payload'));
    expect(fcReport.failures).toEqual([]);
    expect(fcReport.passed).toBe(true);
  });

  it('validates JSON syntax, renders interactive tree view, and formats JSON', async () => {
    const el = document.createElement('mth-json-editor') as MthJsonEditor;
    el.mode = 'split';
    el.value = '{"name":"Methane","tags":["ui","code"]}';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.checkValidity()).toBe(true);
    expect(el.engine?.isValid).toBe(true);
    expect(el.shadowRoot!.querySelector('[part="tree"]')?.textContent).toContain('Methane');
    expect(el.format()).toBe(true);
    expect(el.value).toContain('\n  "name": "Methane"');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);

    el.value = '{"broken": ';
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    expect(el.shadowRoot!.querySelector('[part="error"]')?.textContent).toBeTruthy();

    const surface = el.shadowRoot!.querySelector<HTMLElement>('#mth-je-surface')!;
    expect(surface.hasAttribute('role')).toBe(false);
    expect(surface.hasAttribute('aria-invalid')).toBe(false);
    expect(surface.hasAttribute('aria-errormessage')).toBe(false);
    const cmContent = el.shadowRoot!.querySelector<HTMLElement>('.cm-content')!;
    expect(cmContent.getAttribute('aria-invalid')).toBe('true');
    expect(cmContent.getAttribute('aria-errormessage')).toBe('mth-je-error');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);

    // Same-instance reconnect re-attaches CodeMirror surface
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.cm-content')).not.toBeNull();
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-json-editor label="Config" value='{"a":1}'></mth-json-editor>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-json-editor>', 'hyd-json-editor>')
      .replaceAll('<mth-json-editor', '<hyd-json-editor');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthJsonEditor('hyd');
        customElements.upgrade(host);
        await (host as MthJsonEditor).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
