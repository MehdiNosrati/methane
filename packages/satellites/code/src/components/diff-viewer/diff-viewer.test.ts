import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { diffViewerSpec } from './diff-viewer.spec.js';
import { MthDiffViewer, registerMthDiffViewer } from './index.js';

describe('<mth-diff-viewer>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec and SatelliteEngineSuite (50x lifecycle + token sync)', async () => {
    const compiled = compileSpec(diffViewerSpec);
    expect(compiled.docs).toContain('`<mth-diff-viewer>`');

    const report = await runBehaviorSpecAssertions(diffViewerSpec, {
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-diff-viewer') as MthDiffViewer;
          el.original = 'a\nb';
          el.modified = 'a\nc';
          return el;
        },
        readAppliedToken: (el: HTMLElement, tokenName: string) =>
          (el as MthDiffViewer).engine?.getThemeToken(tokenName) ?? '',
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-diff-viewer') as MthDiffViewer,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthDiffViewer).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);
  });

  it('computes additions/deletions, switches split/unified views, and cycles hunks', async () => {
    const el = document.createElement('mth-diff-viewer') as MthDiffViewer;
    el.filename = 'config.ts';
    el.original = 'const a = 1;\nconst b = 2;';
    el.modified = 'const a = 1;\nconst b = 3;\nconst c = 4;';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.engine?.additions).toBe(2);
    expect(el.engine?.deletions).toBe(1);
    expect(el.engine?.hunkCount).toBe(1);

    el.engine?.setView('split');
    await el.updateComplete;
    expect(el.view).toBe('split');
    expect(el.nextHunk()).toBe(0);
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-diff-viewer original="x" modified="y"></mth-diff-viewer>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-diff-viewer>', 'hyd-diff-viewer>')
      .replaceAll('<mth-diff-viewer', '<hyd-diff-viewer');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDiffViewer('hyd');
        customElements.upgrade(host);
        await (host as MthDiffViewer).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
