import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { fileExplorerSpec } from './file-explorer.spec.js';
import { MthFileExplorer, registerMthFileExplorer } from './index.js';

describe('<mth-file-explorer>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite (LTR + RTL)', async () => {
    registerMthFileExplorer();
    const compiled = compileSpec(fileExplorerSpec);
    expect(compiled.docs).toContain('`<mth-file-explorer>`');

    const rovingAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-file-explorer') as MthFileExplorer;
        el.dir = dir;
        el.viewMode = 'grid';
        el.columns = 4;
        el.items = [
          { id: 'f1', name: 'Docs', kind: 'folder', parentId: null },
          { id: 'f2', name: 'Media', kind: 'folder', parentId: null },
          { id: 'a1', name: 'README.md', kind: 'file', parentId: null, size: 1200 },
          { id: 'a2', name: 'logo.svg', kind: 'file', parentId: null, size: 640 },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.entry')),
      orientation: 'horizontal' as const,
      loop: true,
    };

    const report = await RovingFocusSuite.run(rovingAdapter);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(fileExplorerSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('navigates folders via breadcrumbs and supports multi-selection', async () => {
    registerMthFileExplorer();
    const el = document.createElement('mth-file-explorer') as MthFileExplorer;
    el.items = [
      { id: 'docs', name: 'Docs', kind: 'folder', parentId: null },
      { id: 'guide', name: 'Guide.md', kind: 'file', parentId: 'docs', size: 2048 },
      { id: 'spec', name: 'Spec.md', kind: 'file', parentId: 'docs', size: 1024 },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    el.navigateTo('docs');
    await el.updateComplete;

    const entries = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.entry');
    expect(entries).toHaveLength(2);

    entries[0]?.click();
    entries[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }));
    await el.updateComplete;

    expect(el.selectedIds).toEqual(['guide', 'spec']);

    const sheetsBefore = el.shadowRoot!.adoptedStyleSheets.length;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.adoptedStyleSheets.length).toBe(sheetsBefore);

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-file-explorer view-mode="list"></mth-file-explorer>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-file-explorer>', 'hyd-file-explorer>')
      .replaceAll('<mth-file-explorer', '<hyd-file-explorer');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFileExplorer('hyd');
        customElements.upgrade(host);
        await (host as MthFileExplorer).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
