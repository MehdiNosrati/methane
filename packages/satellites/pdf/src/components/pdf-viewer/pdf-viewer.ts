import { UIElement, type PropertyValues } from '@methane/core';
import { MotionController, ObserverPoolController } from '@methane/primitives';
import { isSafeUrl, sanitizeUrl } from '@methane/sanitize';
import { html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from 'pdfjs-dist';
import { pdfViewerMessages } from './pdf-viewer.messages.js';
import { pdfViewerStyles } from './pdf-viewer.styles.js';

export type PdfZoomPreset = number | 'auto' | 'page-fit' | 'page-width';

export interface PdfOutlineNode {
  readonly title: string;
  readonly pageNumber: number | null;
}

export interface MthPdfEngineHandle {
  readonly kind: 'pdfjs' | 'headless';
  readonly document: PDFDocumentProxy | null;
  readonly page: number;
  readonly totalPages: number;
  readonly zoom: PdfZoomPreset;
  readonly outline: ReadonlyArray<PdfOutlineNode>;
  goToPage(page: number): void;
  nextPage(): void;
  prevPage(): void;
  setZoom(zoom: PdfZoomPreset): void;
  zoomIn(): void;
  zoomOut(): void;
  search(query: string): Promise<number>;
  getAppliedToken(tokenName: string): string;
  dispose(): void;
  readonly disposed: boolean;
}

const PDF_TOKEN_NAMES = [
  '--mth-color-accent',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-surface',
  '--mth-color-border',
] as const;

const ZOOM_STEPS: ReadonlyArray<number> = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * `<mth-pdf-viewer>`: Wrap-first Mozilla pdf.js accessible document viewer.
 */
export class MthPdfViewer extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = pdfViewerMessages;
  static override styles = pdfViewerStyles;

  // Kept so controller conformance checks reflect active subscription ownership.
  private readonly motionCtrl = new MotionController(this);
  private readonly observerPool = new ObserverPoolController(this);

  @property({ type: String, reflect: true })
  src = '';

  @property({ type: String, attribute: 'worker-src' })
  workerSrc = '';

  @property({ type: String, attribute: 'document-title' })
  documentTitle = '';

  @property({ type: Number, reflect: true })
  page = 1;

  @property({ type: Number, attribute: 'total-pages' })
  totalPages = 0;

  @property({ type: String, reflect: true })
  zoom: PdfZoomPreset = 1;

  @property({ type: Number })
  rotation: 0 | 90 | 180 | 270 = 0;

  @property({ type: String, attribute: 'search-query' })
  searchQuery = '';

  @property({ type: Boolean, reflect: true, attribute: 'show-outline' })
  showOutline = false;

  @property({ type: Boolean, attribute: 'show-toolbar' })
  showToolbar = true;

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: String })
  error = '';

  @property({ attribute: false })
  data: Uint8Array | ArrayBuffer | null = null;

  @query('[part="canvas"]')
  private canvasEl?: HTMLCanvasElement | null;

  @query('[part="viewport"]')
  private viewportEl?: HTMLDivElement | null;

  @state()
  private outlineItems: ReadonlyArray<PdfOutlineNode> = [];

  @state()
  private searchMatchCount = 0;

  private _engine: MthPdfEngineHandle | null = null;
  private _pdfDoc: PDFDocumentProxy | null = null;
  private _loadingTask: PDFDocumentLoadingTask | null = null;
  private _renderTask: RenderTask | null = null;
  private _tokenCache: Map<string, string> = new Map();
  private _loadTimer: ReturnType<typeof setTimeout> | undefined;
  private _disposed = false;

  get engine(): MthPdfEngineHandle | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._disposed = false;
    this._syncTokens();
    this._initEngineHandle();
  }

  override disconnectedCallback(): void {
    this._disposed = true;
    if (this._loadTimer !== undefined) {
      clearTimeout(this._loadTimer);
      this._loadTimer = undefined;
    }
    this._disposeEngine();
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    if (this.viewportEl) {
      this.observerPool.observeResize(this.viewportEl, () => {
        void this._renderActivePage();
      });
    }
    if (this.src || this.data) {
      this._scheduleDocumentLoad();
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.setCustomState('loading', this.loading);
    this.setCustomState('error', this.error.length > 0);
    this.setCustomState('has-document', this._pdfDoc !== null || this.totalPages > 0);
    this.setCustomState('outline-open', this.showOutline);
    this.setCustomState('reduced-motion', this.motionCtrl.isReducedMotion);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (
      (changed.has('src') && changed.get('src') !== undefined) ||
      (changed.has('data') && changed.get('data') !== undefined)
    ) {
      this._scheduleDocumentLoad();
    }
    if (
      (changed.has('page') && changed.get('page') !== undefined) ||
      (changed.has('zoom') && changed.get('zoom') !== undefined) ||
      (changed.has('rotation') && changed.get('rotation') !== undefined)
    ) {
      void this._renderActivePage();
    }
    if (changed.has('searchQuery') && changed.get('searchQuery') !== undefined) {
      void this.search(this.searchQuery);
    }
  }

  goToPage(nextPage: number): void {
    const maxPage = Math.max(1, this.totalPages || 1);
    const clamped = Math.min(maxPage, Math.max(1, Math.trunc(nextPage)));
    if (clamped === this.page) return;
    this.page = clamped;
    this.emitEvent('mth-page-change', {
      detail: { page: this.page, totalPages: this.totalPages },
    });
  }

  nextPage(): void {
    this.goToPage(this.page + 1);
  }

  prevPage(): void {
    this.goToPage(this.page - 1);
  }

  setZoom(nextZoom: PdfZoomPreset): void {
    this.zoom = nextZoom;
    this.emitEvent('mth-zoom-change', { detail: { zoom: this.zoom } });
  }

  zoomIn(): void {
    const numeric = typeof this.zoom === 'number' ? this.zoom : 1;
    const higher = ZOOM_STEPS.find((step) => step > numeric + 0.01);
    this.setZoom(higher ?? ZOOM_STEPS[ZOOM_STEPS.length - 1] ?? 2);
  }

  zoomOut(): void {
    const numeric = typeof this.zoom === 'number' ? this.zoom : 1;
    const lower = [...ZOOM_STEPS].reverse().find((step) => step < numeric - 0.01);
    this.setZoom(lower ?? ZOOM_STEPS[0] ?? 0.5);
  }

  async search(query: string): Promise<number> {
    this.searchQuery = query;
    const normalized = query.trim().toLowerCase();
    if (!normalized || !this._pdfDoc) {
      this.searchMatchCount = 0;
      this.emitEvent('mth-search-change', { detail: { query, matchCount: 0 } });
      return 0;
    }

    let count = 0;
    const pageLimit = this._pdfDoc.numPages;
    for (let i = 1; i <= pageLimit; i++) {
      const pageProxy = await this._pdfDoc.getPage(i);
      const textContent = await pageProxy.getTextContent();
      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string') {
          const textLower = item.str.toLowerCase();
          if (textLower.includes(normalized)) {
            count += 1;
          }
        }
      }
    }
    this.searchMatchCount = count;
    this.emitEvent('mth-search-change', { detail: { query, matchCount: count } });
    return count;
  }

  getAppliedToken(tokenName: string): string {
    this._syncTokens();
    return this._tokenCache.get(tokenName) ?? '';
  }

  async loadDocument(): Promise<void> {
    if (!this.isConnected || this._disposed) return;

    if (this.src && !isSafeUrl(this.src)) {
      this.error = this.t('invalidUrlError');
      this.loading = false;
      this.emitEvent('mth-pdf-error', { detail: { message: this.error } });
      return;
    }

    if (!this.src && !this.data) {
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const pdfjs = await import('pdfjs-dist');
      if (this._disposed || !this.isConnected) return;

      if (this.workerSrc && isSafeUrl(this.workerSrc)) {
        pdfjs.GlobalWorkerOptions.workerSrc = this.workerSrc.trim();
      }

      this._teardownActiveDocument();

      const sourceInput = this.data
        ? { data: this.data instanceof ArrayBuffer ? new Uint8Array(this.data) : this.data }
        : { url: this.src.trim() };

      const task = pdfjs.getDocument(sourceInput);
      this._loadingTask = task;
      const doc = await task.promise;
      if (this._disposed || !this.isConnected) {
        await doc.cleanup();
        await task.destroy();
        return;
      }

      this._pdfDoc = doc;
      this.totalPages = doc.numPages;
      if (this.page > doc.numPages) {
        this.page = 1;
      }

      await this._loadOutline(doc);
      this.loading = false;
      this.emitEvent('mth-pdf-load', {
        detail: {
          numPages: doc.numPages,
          title: this.documentTitle || this.src,
        },
      });
      await this._renderActivePage();
    } catch (err: unknown) {
      if (this._disposed) return;
      this.loading = false;
      const message = err instanceof Error ? err.message : String(err);
      this.error = message;
      this.emitEvent('mth-pdf-error', { detail: { message } });
    }
  }

  private async _loadOutline(doc: PDFDocumentProxy): Promise<void> {
    try {
      const rawOutline = await doc.getOutline();
      if (!Array.isArray(rawOutline)) {
        this.outlineItems = [];
        return;
      }
      const items: PdfOutlineNode[] = [];
      for (const entry of rawOutline) {
        let pageNumber: number | null = null;
        if (Array.isArray(entry.dest) && entry.dest[0]) {
          try {
            const idx = await doc.getPageIndex(entry.dest[0] as Parameters<PDFDocumentProxy['getPageIndex']>[0]);
            pageNumber = idx + 1;
          } catch {
            pageNumber = null;
          }
        }
        items.push({ title: entry.title, pageNumber });
      }
      this.outlineItems = items;
    } catch {
      this.outlineItems = [];
    }
  }

  private async _renderActivePage(): Promise<void> {
    if (!this._pdfDoc || !this.canvasEl || this._disposed || !this.isConnected) return;

    if (this._renderTask) {
      this._renderTask.cancel();
      this._renderTask = null;
    }

    try {
      const targetPage = Math.min(Math.max(1, this.page), this._pdfDoc.numPages);
      const pdfPage: PDFPageProxy = await this._pdfDoc.getPage(targetPage);
      const scale = this._resolveNumericZoom(pdfPage);
      const viewport = pdfPage.getViewport({ scale, rotation: this.rotation });

      this.canvasEl.width = Math.max(1, Math.floor(viewport.width));
      this.canvasEl.height = Math.max(1, Math.floor(viewport.height));

      const ctx = this.canvasEl.getContext('2d');
      if (!ctx) return;

      const task = pdfPage.render({
        canvas: this.canvasEl,
        canvasContext: ctx,
        viewport,
      });
      this._renderTask = task;
      await task.promise;
    } catch {
      // Graceful fallback when JSDOM lacks Canvas2D context or render is cancelled
    }
  }

  private _resolveNumericZoom(pdfPage: PDFPageProxy): number {
    if (typeof this.zoom === 'number' && Number.isFinite(this.zoom) && this.zoom > 0) {
      return this.zoom;
    }
    const numericFromString = Number(this.zoom);
    if (Number.isFinite(numericFromString) && numericFromString > 0) {
      return numericFromString;
    }
    const baseViewport = pdfPage.getViewport({ scale: 1, rotation: this.rotation });
    const hostWidth = this.viewportEl?.clientWidth ?? 640;
    const hostHeight = this.viewportEl?.clientHeight ?? 480;
    if (this.zoom === 'page-width') {
      return Math.max(0.25, (hostWidth - 32) / Math.max(1, baseViewport.width));
    }
    if (this.zoom === 'page-fit') {
      const scaleW = (hostWidth - 32) / Math.max(1, baseViewport.width);
      const scaleH = (hostHeight - 32) / Math.max(1, baseViewport.height);
      return Math.max(0.25, Math.min(scaleW, scaleH));
    }
    return 1;
  }

  private _scheduleDocumentLoad(): void {
    if (this._loadTimer !== undefined || !this.isConnected) return;
    this._loadTimer = setTimeout(() => {
      this._loadTimer = undefined;
      void this.loadDocument();
    }, 0);
  }

  private _syncTokens(): void {
    if (typeof window === 'undefined' || !this.isConnected) return;
    const computed = window.getComputedStyle(this);
    for (const tokenName of PDF_TOKEN_NAMES) {
      const value =
        computed.getPropertyValue(tokenName).trim() ||
        this.style.getPropertyValue(tokenName).trim();
      if (value) {
        this._tokenCache.set(tokenName, value);
      }
    }
  }

  private _initEngineHandle(): void {
    if (this._engine && !this._engine.disposed) return;

    let disposed = false;
    const getDoc = (): PDFDocumentProxy | null => this._pdfDoc;
    const getPage = (): number => this.page;
    const getTotalPages = (): number => this.totalPages;
    const getZoom = (): PdfZoomPreset => this.zoom;
    const getOutline = (): ReadonlyArray<PdfOutlineNode> => this.outlineItems;
    const teardown = (): void => this._teardownActiveDocument();

    this._engine = {
      get kind() {
        return getDoc() ? 'pdfjs' : 'headless';
      },
      get document() {
        return getDoc();
      },
      get page() {
        return getPage();
      },
      get totalPages() {
        return getTotalPages();
      },
      get zoom() {
        return getZoom();
      },
      get outline() {
        return getOutline();
      },
      goToPage: (page: number) => this.goToPage(page),
      nextPage: () => this.nextPage(),
      prevPage: () => this.prevPage(),
      setZoom: (zoom: PdfZoomPreset) => this.setZoom(zoom),
      zoomIn: () => this.zoomIn(),
      zoomOut: () => this.zoomOut(),
      search: (query: string) => this.search(query),
      getAppliedToken: (tokenName: string) => this.getAppliedToken(tokenName),
      dispose: () => {
        if (disposed) return;
        disposed = true;
        teardown();
      },
      get disposed() {
        return disposed;
      },
    };
  }

  private _teardownActiveDocument(): void {
    if (this._renderTask) {
      try {
        this._renderTask.cancel();
      } catch {
        // Ignore cancellation failure
      }
      this._renderTask = null;
    }
    if (this._loadingTask) {
      try {
        void this._loadingTask.destroy();
      } catch {
        // Ignore task teardown error
      }
      this._loadingTask = null;
    }
    if (this._pdfDoc) {
      try {
        void this._pdfDoc.cleanup();
      } catch {
        // Ignore doc cleanup error
      }
      this._pdfDoc = null;
    }
  }

  private _disposeEngine(): void {
    this._engine?.dispose();
    this._engine = null;
  }

  private _onViewportKeydown = (event: KeyboardEvent): void => {
    const isRtl = this.resolvedDir === 'rtl';
    switch (event.key) {
      case 'PageDown':
        event.preventDefault();
        this.nextPage();
        break;
      case 'PageUp':
        event.preventDefault();
        this.prevPage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (isRtl) this.prevPage();
        else this.nextPage();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (isRtl) this.nextPage();
        else this.prevPage();
        break;
      case 'Home':
        event.preventDefault();
        this.goToPage(1);
        break;
      case 'End':
        event.preventDefault();
        if (this.totalPages > 0) this.goToPage(this.totalPages);
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
        event.preventDefault();
        this.zoomOut();
        break;
      case '0':
        event.preventDefault();
        this.setZoom(1);
        break;
    }
  };

  private _onPageInputChange = (event: Event): void => {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    const parsed = Number(input.value);
    if (Number.isFinite(parsed)) {
      this.goToPage(parsed);
    }
  };

  private _onZoomChange = (event: Event): void => {
    const select = event.target as HTMLSelectElement | null;
    if (!select) return;
    const raw = select.value;
    if (raw === 'auto' || raw === 'page-fit' || raw === 'page-width') {
      this.setZoom(raw);
      return;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      this.setZoom(parsed);
    }
  };

  private _onSearchInput = (event: Event): void => {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    void this.search(input.value);
  };

  private _onToggleOutline = (): void => {
    this.showOutline = !this.showOutline;
  };

  override render() {
    const safeHref = this.src && isSafeUrl(this.src) ? sanitizeUrl(this.src) : '';
    const maxPage = Math.max(1, this.totalPages);
    const label = this.ariaLabel || this.documentTitle || this.t('viewerLabel');
    const zoomValue = String(this.zoom);

    return html`
      <div part="base" class="base" dir=${this.resolvedDir}>
        <div
          part="toolbar"
          class="toolbar"
          role="toolbar"
          aria-label=${this.t('toolbarLabel')}
          ?hidden=${!this.showToolbar}
        >
          <div class="group">
            <button
              type="button"
              part="outline-toggle"
              aria-expanded=${this.showOutline ? 'true' : 'false'}
              @click=${this._onToggleOutline}
            >
              ${this.t('outlineToggle')}
            </button>

            <button
              type="button"
              part="prev-btn"
              ?disabled=${this.page <= 1}
              aria-label=${this.t('prevPage')}
              @click=${() => this.prevPage()}
            >
              ‹
            </button>

            <input
              type="number"
              part="page-input"
              class="page-input"
              min="1"
              max=${String(maxPage)}
              .value=${String(this.page)}
              aria-label=${this.t('pageNumber')}
              @change=${this._onPageInputChange}
            />

            <span part="page-count">/ ${this.totalPages}</span>

            <button
              type="button"
              part="next-btn"
              ?disabled=${this.totalPages > 0 && this.page >= this.totalPages}
              aria-label=${this.t('nextPage')}
              @click=${() => this.nextPage()}
            >
              ›
            </button>
          </div>

          <div class="group">
            <button
              type="button"
              part="zoom-out"
              aria-label=${this.t('zoomOut')}
              @click=${() => this.zoomOut()}
            >
              −
            </button>

            <select
              part="zoom-select"
              aria-label=${this.t('zoomLabel')}
              .value=${zoomValue}
              @change=${this._onZoomChange}
            >
              <option value="auto">${this.t('zoomAuto')}</option>
              <option value="page-fit">${this.t('zoomPageFit')}</option>
              <option value="page-width">${this.t('zoomPageWidth')}</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2">200%</option>
            </select>

            <button
              type="button"
              part="zoom-in"
              aria-label=${this.t('zoomIn')}
              @click=${() => this.zoomIn()}
            >
              +
            </button>
          </div>

          <div class="group">
            <input
              type="search"
              part="search-input"
              class="search-input"
              .value=${this.searchQuery}
              placeholder=${this.t('searchPlaceholder')}
              aria-label=${this.t('searchLabel')}
              @input=${this._onSearchInput}
            />
            <span ?hidden=${this.searchMatchCount === 0}>${this.searchMatchCount}</span>

            <a
              part="download"
              class="download-link"
              href=${safeHref || '#'}
              download
              ?hidden=${safeHref.length === 0}
            >
              ${this.t('downloadLabel')}
            </a>
          </div>
        </div>

        <div class="body">
          <nav
            part="outline"
            class="outline"
            aria-label=${this.t('outlineLabel')}
            ?hidden=${!this.showOutline}
          >
            <ul class="outline-list">
              ${this.outlineItems.map(
                (item) => html`
                  <li>
                    <button
                      type="button"
                      class="outline-btn"
                      ?disabled=${item.pageNumber === null}
                      @click=${() => {
                        if (item.pageNumber !== null) this.goToPage(item.pageNumber);
                      }}
                    >
                      ${item.title}
                    </button>
                  </li>
                `,
              )}
            </ul>
          </nav>

          <div
            part="viewport"
            class="viewport"
            tabindex="0"
            role="region"
            aria-label=${label}
            @keydown=${this._onViewportKeydown}
          >
            <canvas part="canvas" class="canvas" aria-label=${label}></canvas>
            <div part="status" class="status" role="status" ?hidden=${!this.loading && !this.error}>
              ${this.error || this.t('loadingLabel')}
            </div>
          </div>
        </div>

        <div part="fallback" class="fallback">
          <slot name="fallback"></slot>
        </div>
      </div>
    `;
  }
}
