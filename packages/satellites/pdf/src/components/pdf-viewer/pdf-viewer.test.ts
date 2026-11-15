import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MthPdfViewer, pdfViewerSpec, registerMthPdfViewer } from './index.js';

async function mountPdfViewer(
  props: Partial<
    Pick<
      MthPdfViewer,
      'src' | 'page' | 'totalPages' | 'zoom' | 'showToolbar' | 'showOutline' | 'documentTitle' | 'rotation' | 'dir' | 'loading'
    >
  > = {},
): Promise<MthPdfViewer> {
  registerMthPdfViewer();
  const viewer = document.createElement('mth-pdf-viewer') as MthPdfViewer;
  Object.assign(viewer, props);
  document.body.appendChild(viewer);
  await viewer.updateComplete;
  return viewer;
}

describe('<mth-pdf-viewer>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it('reflects src, page, zoom, show-outline, and loading attributes to/from properties', async () => {
    const viewer = await mountPdfViewer({
      src: '/docs/handbook.pdf',
      page: 3,
      totalPages: 12,
      zoom: 'page-width',
      showOutline: true,
      loading: true,
    });

    expect(viewer.getAttribute('src')).toBe('/docs/handbook.pdf');
    expect(viewer.getAttribute('page')).toBe('3');
    expect(viewer.getAttribute('zoom')).toBe('page-width');
    expect(viewer.hasAttribute('show-outline')).toBe(true);
    expect(viewer.hasAttribute('loading')).toBe(true);

    viewer.setAttribute('page', '7');
    viewer.setAttribute('zoom', '1.5');
    viewer.removeAttribute('show-outline');
    await viewer.updateComplete;

    expect(viewer.page).toBe(7);
    expect(viewer.zoom).toBe('1.5');
    expect(viewer.showOutline).toBe(false);
  });

  it('toggles toolbar visibility via showToolbar property and show-toolbar attribute', async () => {
    const viewer = await mountPdfViewer({ totalPages: 4 });
    const toolbar = viewer.shadowRoot!.querySelector('[part="toolbar"]') as HTMLElement;
    expect(toolbar.hidden).toBe(false);

    viewer.showToolbar = false;
    await viewer.updateComplete;
    expect(toolbar.hidden).toBe(true);

    viewer.showToolbar = true;
    await viewer.updateComplete;
    expect(toolbar.hidden).toBe(false);
  });

  it('clamps page navigation via prev/next toolbar buttons within 1..totalPages', async () => {
    const viewer = await mountPdfViewer({ page: 2, totalPages: 3 });
    const prevBtn = viewer.shadowRoot!.querySelector<HTMLButtonElement>('[part="prev-btn"]')!;
    const nextBtn = viewer.shadowRoot!.querySelector<HTMLButtonElement>('[part="next-btn"]')!;
    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(false);

    nextBtn.click();
    await viewer.updateComplete;
    expect(viewer.page).toBe(3);
    expect(nextBtn.disabled).toBe(true);

    viewer.nextPage();
    expect(viewer.page).toBe(3);

    prevBtn.click();
    await viewer.updateComplete;
    expect(viewer.page).toBe(2);

    prevBtn.click();
    await viewer.updateComplete;
    expect(viewer.page).toBe(1);
    expect(prevBtn.disabled).toBe(true);

    viewer.prevPage();
    expect(viewer.page).toBe(1);
  });

  it('handles direct page-input jump, out-of-range clamping, and ignores NaN input', async () => {
    const viewer = await mountPdfViewer({ page: 1, totalPages: 5 });
    const pageInput = viewer.shadowRoot!.querySelector<HTMLInputElement>('[part="page-input"]')!;
    const pageCount = viewer.shadowRoot!.querySelector<HTMLElement>('[part="page-count"]')!;
    expect(pageCount.textContent?.trim()).toBe('/ 5');

    pageInput.value = '4';
    pageInput.dispatchEvent(new Event('change', { bubbles: true }));
    await viewer.updateComplete;
    expect(viewer.page).toBe(4);

    pageInput.value = '999';
    pageInput.dispatchEvent(new Event('change', { bubbles: true }));
    await viewer.updateComplete;
    expect(viewer.page).toBe(5);

    pageInput.value = '-4';
    pageInput.dispatchEvent(new Event('change', { bubbles: true }));
    await viewer.updateComplete;
    expect(viewer.page).toBe(1);

    viewer.goToPage(Number.NaN);
    expect(viewer.page).toBe(1);
  });

  it('emits mth-page-change only when page actually changes and includes page/totalPages detail', async () => {
    const viewer = await mountPdfViewer({ page: 2, totalPages: 6 });
    const events: Array<{ page: number; totalPages: number }> = [];
    viewer.addEventListener('mth-page-change', (ev) => {
      events.push((ev as CustomEvent<{ page: number; totalPages: number }>).detail);
    });

    viewer.goToPage(2);
    expect(events).toEqual([]);

    viewer.goToPage(5);
    expect(events).toEqual([{ page: 5, totalPages: 6 }]);

    viewer.goToPage(99);
    expect(events).toEqual([
      { page: 5, totalPages: 6 },
      { page: 6, totalPages: 6 },
    ]);
  });

  it('steps zoom-in and zoom-out across ZOOM_STEPS via toolbar buttons and clamps bounds', async () => {
    const viewer = await mountPdfViewer({ zoom: 1 });
    const zoomOutBtn = viewer.shadowRoot!.querySelector<HTMLButtonElement>('[part="zoom-out"]')!;
    const zoomInBtn = viewer.shadowRoot!.querySelector<HTMLButtonElement>('[part="zoom-in"]')!;

    zoomInBtn.click();
    expect(viewer.zoom).toBe(1.25);
    zoomInBtn.click();
    expect(viewer.zoom).toBe(1.5);
    zoomInBtn.click();
    expect(viewer.zoom).toBe(2);
    zoomInBtn.click();
    expect(viewer.zoom).toBe(2);

    zoomOutBtn.click();
    expect(viewer.zoom).toBe(1.5);
    zoomOutBtn.click();
    expect(viewer.zoom).toBe(1.25);
    zoomOutBtn.click();
    expect(viewer.zoom).toBe(1);
    zoomOutBtn.click();
    expect(viewer.zoom).toBe(0.75);
    zoomOutBtn.click();
    expect(viewer.zoom).toBe(0.5);
    zoomOutBtn.click();
    expect(viewer.zoom).toBe(0.5);
  });

  it('supports zoom-select presets (auto, page-fit, page-width, numeric) and emits mth-zoom-change', async () => {
    const viewer = await mountPdfViewer();
    const zoomSelect = viewer.shadowRoot!.querySelector<HTMLSelectElement>('[part="zoom-select"]')!;
    const zoomDetails: Array<unknown> = [];
    viewer.addEventListener('mth-zoom-change', (ev) => {
      zoomDetails.push((ev as CustomEvent).detail);
    });

    for (const val of ['auto', 'page-fit', 'page-width', '1.5']) {
      zoomSelect.value = val;
      zoomSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    expect(viewer.zoom).toBe(1.5);
    expect(zoomDetails).toEqual([
      { zoom: 'auto' },
      { zoom: 'page-fit' },
      { zoom: 'page-width' },
      { zoom: 1.5 },
    ]);
  });

  it('toggles outline drawer via toolbar button and updates aria-expanded + :state(outline-open)', async () => {
    const viewer = await mountPdfViewer();
    const toggleBtn = viewer.shadowRoot!.querySelector<HTMLButtonElement>('[part="outline-toggle"]')!;
    const outlineNav = viewer.shadowRoot!.querySelector<HTMLElement>('[part="outline"]')!;

    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    expect(outlineNav.hidden).toBe(true);
    expect(viewer.hasCustomState('outline-open')).toBe(false);

    toggleBtn.click();
    await viewer.updateComplete;

    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    expect(outlineNav.hidden).toBe(false);
    expect(viewer.hasCustomState('outline-open')).toBe(true);
  });

  it('supports LTR keyboard navigation (ArrowRight, ArrowLeft, PageDown, PageUp, Home, End)', async () => {
    const viewer = await mountPdfViewer({ page: 2, totalPages: 8, dir: 'ltr' });
    const viewport = viewer.shadowRoot!.querySelector<HTMLDivElement>('[part="viewport"]')!;

    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(viewer.page).toBe(3);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(viewer.page).toBe(2);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    expect(viewer.page).toBe(3);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
    expect(viewer.page).toBe(2);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(viewer.page).toBe(8);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(viewer.page).toBe(1);
  });

  it('supports keyboard zoom shortcuts (+, =, -, 0) and RTL ArrowLeft/ArrowRight flipping', async () => {
    const viewer = await mountPdfViewer({ page: 2, totalPages: 10, dir: 'rtl' });
    const viewport = viewer.shadowRoot!.querySelector<HTMLDivElement>('[part="viewport"]')!;

    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(viewer.page).toBe(3);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(viewer.page).toBe(2);

    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }));
    expect(viewer.zoom).toBe(1.25);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: '=', bubbles: true }));
    expect(viewer.zoom).toBe(1.5);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: '-', bubbles: true }));
    expect(viewer.zoom).toBe(1.25);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }));
    expect(viewer.zoom).toBe(1);
  });

  it('blocks unsafe javascript: and data: URLs, hides download link, and emits mth-pdf-error', async () => {
    const viewer = await mountPdfViewer();
    const errors: Array<{ message: string }> = [];
    viewer.addEventListener('mth-pdf-error', (ev) => {
      errors.push((ev as CustomEvent<{ message: string }>).detail);
    });

    for (const unsafeUrl of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>']) {
      viewer.src = unsafeUrl;
      await viewer.updateComplete;
      await viewer.loadDocument();
      expect(viewer.error).toContain('Blocked');
      expect(viewer.hasCustomState('error')).toBe(true);
      const downloadLink = viewer.shadowRoot!.querySelector<HTMLAnchorElement>('[part="download"]')!;
      expect(downloadLink.hidden).toBe(true);
      expect(downloadLink.getAttribute('href')).toBe('#');
    }
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('exposes sanitized download anchor href when src is a safe relative or https URL', async () => {
    const viewer = await mountPdfViewer({ src: 'https://example.com/report.pdf' });
    const downloadLink = viewer.shadowRoot!.querySelector<HTMLAnchorElement>('[part="download"]')!;
    expect(downloadLink.hidden).toBe(false);
    expect(downloadLink.getAttribute('href')).toBe('https://example.com/report.pdf');
    expect(downloadLink.hasAttribute('download')).toBe(true);
  });

  it('emits mth-search-change with 0 matches when no document is loaded and updates searchQuery', async () => {
    const viewer = await mountPdfViewer();
    const searchEvents: Array<{ query: string; matchCount: number }> = [];
    viewer.addEventListener('mth-search-change', (ev) => {
      searchEvents.push((ev as CustomEvent<{ query: string; matchCount: number }>).detail);
    });

    const searchInput = viewer.shadowRoot!.querySelector<HTMLInputElement>('[part="search-input"]')!;
    searchInput.value = 'invoice';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await viewer.updateComplete;
    await Promise.resolve();

    expect(viewer.searchQuery).toBe('invoice');
    expect(searchEvents).toEqual([{ query: 'invoice', matchCount: 0 }]);
  });

  it('emits mth-pdf-error when real pdfjs-dist fails to parse invalid binary data', async () => {
    const viewer = await mountPdfViewer();
    const errorEvents: Array<{ message: string }> = [];
    viewer.addEventListener('mth-pdf-error', (ev) => {
      errorEvents.push((ev as CustomEvent<{ message: string }>).detail);
    });

    viewer.data = new Uint8Array([0, 1, 2, 3, 4]);
    await viewer.loadDocument();
    await viewer.updateComplete;

    expect(viewer.loading).toBe(false);
    expect(viewer.error.length).toBeGreaterThan(0);
    expect(viewer.hasCustomState('error')).toBe(true);
    expect(errorEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('computes zoomIn/zoomOut from non-numeric presets like page-width by defaulting base to 1', async () => {
    const viewer = await mountPdfViewer({ zoom: 'page-width' });
    viewer.zoomIn();
    expect(viewer.zoom).toBe(1.25);

    viewer.setZoom('page-fit');
    viewer.zoomOut();
    expect(viewer.zoom).toBe(0.75);
  });

  it('cleans up engine, cancels pending load timer, and allows same-instance reconnect', async () => {
    const viewer = await mountPdfViewer({ totalPages: 5 });
    const engineBefore = viewer.engine;
    expect(engineBefore).not.toBeNull();
    expect(engineBefore?.disposed).toBe(false);

    const aria = scanSameRootAria(viewer.shadowRoot!);
    expect(aria.valid).toBe(true);

    viewer.remove();
    expect(viewer.engine).toBeNull();
    expect(engineBefore?.disposed).toBe(true);

    document.body.appendChild(viewer);
    await viewer.updateComplete;
    expect(viewer.engine).not.toBeNull();
    expect(viewer.engine?.disposed).toBe(false);
  });

  it('sets ARIA labels from documentTitle and delegates engine control methods', async () => {
    const viewer = await mountPdfViewer({ documentTitle: 'Design Spec', totalPages: 6 });
    const viewport = viewer.shadowRoot!.querySelector<HTMLElement>('[part="viewport"]')!;
    expect(viewport.getAttribute('aria-label')).toBe('Design Spec');

    viewer.engine!.goToPage(4);
    expect(viewer.page).toBe(4);
    viewer.engine!.nextPage();
    expect(viewer.page).toBe(5);
    viewer.engine!.prevPage();
    expect(viewer.page).toBe(4);
    viewer.engine!.zoomIn();
    expect(viewer.zoom).toBe(1.25);
    viewer.engine!.zoomOut();
    expect(viewer.zoom).toBe(1);
    viewer.engine!.setZoom('page-fit');
    expect(viewer.zoom).toBe('page-fit');
  });

  it('renders fallback slot content and supports rotation updates', async () => {
    registerMthPdfViewer();
    const viewer = document.createElement('mth-pdf-viewer') as MthPdfViewer;
    viewer.rotation = 90;
    const fallback = document.createElement('a');
    fallback.slot = 'fallback';
    fallback.href = '/docs/guide.pdf';
    fallback.textContent = 'Open PDF';
    viewer.appendChild(fallback);
    document.body.appendChild(viewer);
    await viewer.updateComplete;

    const slot = viewer.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="fallback"]')!;
    expect(slot.assignedElements()).toEqual([fallback]);
    expect(viewer.rotation).toBe(90);
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
