import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetDocument = vi.fn();

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
}));

import { MthPdfViewer, registerMthPdfViewer } from './index.js';

describe('<mth-pdf-viewer> document loading, outline & search', () => {
  afterEach(() => {
    vi.clearAllMocks();
    document.body.replaceChildren();
  });

  it('loads document via pdfjs-dist, builds outline, searches text, and emits mth-pdf-load', async () => {
    const getOutline = vi.fn().mockResolvedValue([
      { title: 'Chapter 1', dest: [{ num: 1, gen: 0 }] },
      { title: 'Appendix', dest: null },
    ]);
    const getPageIndex = vi.fn().mockResolvedValue(1);
    const getPage = vi.fn().mockImplementation(async () => ({
      getViewport: ({ scale }: { scale: number }) => ({ width: 200 * scale, height: 300 * scale }),
      getTextContent: async () => ({
        items: [{ str: 'Quarterly Revenue' }, { str: 'Total revenue growth' }],
      }),
      render: () => ({ promise: Promise.resolve(), cancel: vi.fn() }),
    }));
    const cleanup = vi.fn().mockResolvedValue(undefined);

    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({ numPages: 4, getOutline, getPageIndex, getPage, cleanup }),
      destroy: vi.fn().mockResolvedValue(undefined),
    });

    registerMthPdfViewer();
    const viewer = document.createElement('mth-pdf-viewer') as MthPdfViewer;
    viewer.documentTitle = 'Annual Report';
    viewer.workerSrc = '/workers/pdf.worker.mjs';
    viewer.showOutline = true;
    viewer.data = new Uint8Array([37, 80, 68, 70]);

    const loadEvents: Array<{ numPages: number; title: string }> = [];
    viewer.addEventListener('mth-pdf-load', (ev) => {
      loadEvents.push((ev as CustomEvent<{ numPages: number; title: string }>).detail);
    });

    document.body.appendChild(viewer);
    await viewer.updateComplete;
    await viewer.loadDocument();
    await viewer.updateComplete;

    expect(mockGetDocument).toHaveBeenCalled();
    expect(viewer.totalPages).toBe(4);
    expect(viewer.loading).toBe(false);
    expect(viewer.hasCustomState('has-document')).toBe(true);
    expect(viewer.engine?.kind).toBe('pdfjs');
    expect(loadEvents).toEqual([{ numPages: 4, title: 'Annual Report' }]);

    const outlineBtns = viewer.shadowRoot!.querySelectorAll<HTMLButtonElement>('.outline-btn');
    expect(outlineBtns.length).toBe(2);
    expect(outlineBtns[0]!.textContent?.trim()).toBe('Chapter 1');
    expect(outlineBtns[0]!.disabled).toBe(false);
    expect(outlineBtns[1]!.disabled).toBe(true);

    outlineBtns[0]!.click();
    expect(viewer.page).toBe(2);

    const matches = await viewer.search('revenue');
    expect(matches).toBe(8);
  });

  it('emits mth-pdf-error and sets error state when pdfjs getDocument rejects', async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.reject(new Error('Corrupt PDF stream')),
      destroy: vi.fn().mockResolvedValue(undefined),
    });

    registerMthPdfViewer();
    const viewer = document.createElement('mth-pdf-viewer') as MthPdfViewer;
    viewer.src = '/broken.pdf';
    const errorEvents: Array<{ message: string }> = [];
    viewer.addEventListener('mth-pdf-error', (ev) => {
      errorEvents.push((ev as CustomEvent<{ message: string }>).detail);
    });

    document.body.appendChild(viewer);
    await viewer.updateComplete;
    await viewer.loadDocument();
    await viewer.updateComplete;

    expect(viewer.loading).toBe(false);
    expect(viewer.error).toBe('Corrupt PDF stream');
    expect(viewer.hasCustomState('error')).toBe(true);
    expect(errorEvents).toEqual([{ message: 'Corrupt PDF stream' }]);
  });

  it('clamps initial page to 1 when loaded document has fewer pages than requested', async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getOutline: vi.fn().mockResolvedValue([]),
        getPage: vi.fn().mockResolvedValue({
          getViewport: () => ({ width: 100, height: 100 }),
          getTextContent: async () => ({ items: [] }),
          render: () => ({ promise: Promise.resolve(), cancel: vi.fn() }),
        }),
        cleanup: vi.fn().mockResolvedValue(undefined),
      }),
      destroy: vi.fn().mockResolvedValue(undefined),
    });

    registerMthPdfViewer();
    const viewer = document.createElement('mth-pdf-viewer') as MthPdfViewer;
    viewer.src = '/short.pdf';
    viewer.page = 9;
    document.body.appendChild(viewer);
    await viewer.updateComplete;
    await viewer.loadDocument();

    expect(viewer.totalPages).toBe(2);
    expect(viewer.page).toBe(1);
  });

  it('cleans up active PDF document on disconnectedCallback', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const destroy = vi.fn().mockResolvedValue(undefined);
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getOutline: vi.fn().mockResolvedValue([]),
        getPage: vi.fn().mockResolvedValue({
          getViewport: () => ({ width: 100, height: 100 }),
          getTextContent: async () => ({ items: [] }),
          render: () => ({ promise: Promise.resolve(), cancel: vi.fn() }),
        }),
        cleanup,
      }),
      destroy,
    });

    registerMthPdfViewer();
    const viewer = document.createElement('mth-pdf-viewer') as MthPdfViewer;
    viewer.src = '/cleanup.pdf';
    document.body.appendChild(viewer);
    await viewer.updateComplete;
    await viewer.loadDocument();

    viewer.remove();
    expect(cleanup).toHaveBeenCalled();
    expect(destroy).toHaveBeenCalled();
    expect(viewer.engine).toBeNull();
  });
});
