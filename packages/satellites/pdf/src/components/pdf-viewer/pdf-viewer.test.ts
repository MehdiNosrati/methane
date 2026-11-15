import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { MthPdfViewer, pdfViewerSpec, registerMthPdfViewer } from './index.js';

describe('<mth-pdf-viewer>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes behavior spec assertions', async () => {
    registerMthPdfViewer();
    const compiled = compileSpec(pdfViewerSpec);
    expect(compiled.docs).toContain('`<mth-pdf-viewer>`');

    const report = await runBehaviorSpecAssertions(pdfViewerSpec, {
      satellite: {
        createElement: () => document.createElement('mth-pdf-viewer') as MthPdfViewer,
        cycles: 5,
        tokenName: '--mth-color-accent',
        tokenValue: 'oklch(0.6 0.2 250)',
        readAppliedToken: (el, tokenName) => (el as MthPdfViewer).getAppliedToken(tokenName),
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('navigates pages, updates zoom presets, blocks unsafe URLs, and supports RTL keyboard navigation', async () => {
    registerMthPdfViewer();
    const viewer = document.createElement('mth-pdf-viewer') as MthPdfViewer;
    viewer.totalPages = 10;
    viewer.page = 2;
    viewer.dir = 'rtl';
    viewer.src = 'javascript:alert(1)';

    const fallbackLink = document.createElement('a');
    fallbackLink.setAttribute('slot', 'fallback');
    fallbackLink.href = '/docs/guide.pdf';
    fallbackLink.textContent = 'Download PDF';
    viewer.appendChild(fallbackLink);

    document.body.appendChild(viewer);
    await viewer.updateComplete;

    await viewer.loadDocument();
    expect(viewer.error).toContain('Blocked');

    const viewport = viewer.shadowRoot!.querySelector('[part="viewport"]') as HTMLDivElement;
    // In RTL, ArrowLeft advances page
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(viewer.page).toBe(3);

    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(viewer.page).toBe(2);

    viewer.zoomIn();
    expect(viewer.zoom).toBe(1.25);

    viewer.setZoom('page-width');
    expect(viewer.zoom).toBe('page-width');

    const aria = scanSameRootAria(viewer.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes SatelliteEngineSuite 50x mount/unmount disposal and token sync checks', async () => {
    registerMthPdfViewer();
    const result = await SatelliteEngineSuite.run({
      createElement: () => {
        const el = document.createElement('mth-pdf-viewer') as MthPdfViewer;
        el.totalPages = 5;
        return el;
      },
      cycles: 50,
      tokenName: '--mth-color-accent',
      tokenValue: 'oklch(0.6 0.2 250)',
      readAppliedToken: (el, tokenName) => (el as MthPdfViewer).getAppliedToken(tokenName),
    });
    expect(result.failures).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('passes HydrationPuritySuite with zero shadow child mutations', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-pdf-viewer document-title="Manual" page="1" total-pages="3"><a slot="fallback" href="/manual.pdf">Download</a></mth-pdf-viewer>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-pdf-viewer>', 'hyd-pdf-viewer>')
      .replaceAll('<mth-pdf-viewer', '<hyd-pdf-viewer');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPdfViewer('hyd');
        customElements.upgrade(host);
        await (host as MthPdfViewer).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
