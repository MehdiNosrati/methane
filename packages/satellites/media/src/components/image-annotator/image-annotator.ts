import {
  html,
  nothing,
  property,
  registerLocaleMessages,
  state,
  svg,
  UIElement,
  type PropertyValues,
} from '@methane-ui/core';
import { RovingFocusController } from '@methane-ui/primitives';
import { parseSafeFragment } from '@methane-ui/sanitize';
import {
  collectHostThemeTokens,
  isSafeMediaUrl,
  readHostToken,
  type ThemeTokenEngine,
} from '../../shared/satellite-helpers.js';
import { ImageAnnotatorMessages } from './image-annotator.messages.js';
import { imageAnnotatorStyles } from './image-annotator.styles.js';

registerLocaleMessages('en', 'mth-image-annotator', ImageAnnotatorMessages);

export type AnnotationTool = 'rect' | 'arrow' | 'text' | 'freehand';

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface ImageAnnotation {
  id: string;
  type: AnnotationTool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  points?: readonly AnnotationPoint[];
  text?: string;
}

function sanitizeAnnotationText(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const doc = typeof document !== 'undefined' ? document : undefined;
  if (!doc) {
    return raw.replace(/[<>]/g, '').trim();
  }
  const frag = parseSafeFragment(raw, { ownerDocument: doc });
  return (frag.textContent ?? '').trim();
}

export class ImageAnnotatorEngine implements ThemeTokenEngine {
  private readonly tokens = new Map<string, string>();
  private history: ImageAnnotation[][] = [[]];
  private historyIndex = 0;
  private _disposed = false;
  private tokenLookup: ((name: string) => string) | null;

  constructor(tokenLookup?: (name: string) => string) {
    this.tokenLookup = tokenLookup ?? null;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  get canUndo(): boolean {
    return this.historyIndex > 0;
  }

  get canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  getAnnotations(): ImageAnnotation[] {
    return [...(this.history[this.historyIndex] ?? [])];
  }

  setAnnotations(items: readonly ImageAnnotation[]): void {
    const sanitized = items.map((item) => ({
      ...item,
      ...(item.text !== undefined ? { text: sanitizeAnnotationText(item.text) ?? '' } : {}),
    }));
    this.commitSnapshot(sanitized);
  }

  addAnnotation(item: ImageAnnotation): ImageAnnotation {
    const cleanItem: ImageAnnotation = {
      ...item,
      ...(item.text !== undefined ? { text: sanitizeAnnotationText(item.text) ?? '' } : {}),
    };
    const next = [...this.getAnnotations(), cleanItem];
    this.commitSnapshot(next);
    return cleanItem;
  }

  removeAnnotation(id: string): boolean {
    const current = this.getAnnotations();
    const filtered = current.filter((item) => item.id !== id);
    if (filtered.length === current.length) return false;
    this.commitSnapshot(filtered);
    return true;
  }

  clear(): void {
    if (this.getAnnotations().length === 0) return;
    this.commitSnapshot([]);
  }

  undo(): boolean {
    if (!this.canUndo) return false;
    this.historyIndex -= 1;
    return true;
  }

  redo(): boolean {
    if (!this.canRedo) return false;
    this.historyIndex += 1;
    return true;
  }

  getThemeToken(name: string): string {
    const live = this.tokenLookup?.(name);
    if (live) {
      this.tokens.set(name, live);
      return live;
    }
    return this.tokens.get(name) ?? '';
  }

  syncThemeTokens(tokens: Record<string, string>): void {
    this.tokens.clear();
    for (const [key, value] of Object.entries(tokens)) {
      this.tokens.set(key, value);
    }
  }

  dispose(): void {
    this._disposed = true;
    this.tokenLookup = null;
    this.history = [[]];
    this.historyIndex = 0;
    this.tokens.clear();
  }

  private commitSnapshot(items: ImageAnnotation[]): void {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(items);
    this.historyIndex = this.history.length - 1;
  }
}

const VALID_TOOLS: readonly AnnotationTool[] = ['rect', 'arrow', 'text', 'freehand'];

export class MthImageAnnotator extends UIElement {
  static override styles = imageAnnotatorStyles;
  static override messages = ImageAnnotatorMessages;
  static override shadowRootOptions: ShadowRootInit = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ type: String })
  src = '';

  @property({ type: String })
  alt = '';

  @property({ type: String, reflect: true })
  tool: AnnotationTool = 'rect';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: String })
  label = '';

  @property({ attribute: false })
  annotations: readonly ImageAnnotation[] = [];

  @state()
  private selectedId: string | null = null;

  @state()
  private errorMessage = '';

  @state()
  private revision = 0;

  private _engine: ImageAnnotatorEngine | null = null;
  private syncingFromEngine = false;
  private readonly rovingFocus = new RovingFocusController(this, {
    getItems: () =>
      Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="annotation-item"]') ?? []),
    orientation: 'horizontal',
    loop: true,
    dir: 'auto',
    onActiveChange: (item) => {
      const id = item?.getAttribute('data-id') ?? null;
      this.selectAnnotation(id);
    },
  });

  get engine(): ImageAnnotatorEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._engine = new ImageAnnotatorEngine((name) => readHostToken(this, name));
    this._engine.syncThemeTokens(collectHostThemeTokens(this));
    if (this.annotations.length > 0) {
      this._engine.setAnnotations(this.annotations);
    }
  }

  override disconnectedCallback(): void {
    this._engine?.dispose();
    this._engine = null;
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('src')) {
      if (this.src && !isSafeMediaUrl(this.src)) {
        this.errorMessage = this.t('unsafeSourceError');
      } else {
        this.errorMessage = '';
      }
    }
    if (!VALID_TOOLS.includes(this.tool)) {
      this.tool = 'rect';
    }
    if (changed.has('annotations') && this._engine && !this.syncingFromEngine) {
      this._engine.setAnnotations(this.annotations);
    }
    this.syncingFromEngine = false;
    this.rovingFocus.updateOptions({
      dir: this.closest('[dir]') ? 'auto' : this.resolvedDir,
    });
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('readonly', this.readonly);
  }

  getFocusableAnnotations(): HTMLElement[] {
    return Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>('[part="annotation-item"]') ?? [],
    );
  }

  setTool(tool: AnnotationTool): void {
    if (this.disabled || !VALID_TOOLS.includes(tool)) return;
    this.tool = tool;
    this.emitEvent('mth-tool-change', { detail: { tool } });
  }

  addAnnotation(annotation: ImageAnnotation): ImageAnnotation | null {
    if (this.disabled || this.readonly || !this._engine) return null;
    const clean = this._engine.addAnnotation(annotation);
    this.syncFromEngine();
    this.emitEvent('mth-annotation-add', { detail: { annotation: clean } });
    return clean;
  }

  removeAnnotation(id: string): boolean {
    if (this.disabled || this.readonly || !this._engine) return false;
    const removed = this._engine.removeAnnotation(id);
    if (removed) {
      if (this.selectedId === id) {
        this.selectedId = null;
      }
      this.syncFromEngine();
    }
    return removed;
  }

  undo(): boolean {
    if (this.disabled || this.readonly || !this._engine) return false;
    const ok = this._engine.undo();
    if (ok) this.syncFromEngine();
    return ok;
  }

  redo(): boolean {
    if (this.disabled || this.readonly || !this._engine) return false;
    const ok = this._engine.redo();
    if (ok) this.syncFromEngine();
    return ok;
  }

  clearAnnotations(): void {
    if (this.disabled || this.readonly || !this._engine) return;
    this._engine.clear();
    this.selectedId = null;
    this.syncFromEngine();
  }

  selectAnnotation(id: string | null): void {
    this.selectedId = id;
    this.emitEvent('mth-annotation-select', { detail: { id } });
  }

  private syncFromEngine(): void {
    if (!this._engine) return;
    const list = this._engine.getAnnotations();
    this.syncingFromEngine = true;
    this.annotations = list;
    this.revision += 1;
    this.emitEvent('mth-annotation-change', { detail: { annotations: list } });
  }

  private handleStageClick = (event: MouseEvent): void => {
    if (this.disabled || this.readonly) return;
    const stage = event.currentTarget as HTMLElement | null;
    if (!stage || typeof stage.getBoundingClientRect !== 'function') return;
    const rect = stage.getBoundingClientRect();
    const x = rect.width > 0 ? Math.round(((event.clientX - rect.left) / rect.width) * 400) : 120;
    const y = rect.height > 0 ? Math.round(((event.clientY - rect.top) / rect.height) * 240) : 80;
    const id = `ann-${this._engine?.getAnnotations().length ?? 0}-${Date.now()}`;
    if (this.tool === 'rect') {
      this.addAnnotation({ id, type: 'rect', x, y, width: 64, height: 44 });
    } else if (this.tool === 'arrow') {
      this.addAnnotation({ id, type: 'arrow', x, y, x2: x + 64, y2: y + 32 });
    } else if (this.tool === 'freehand') {
      this.addAnnotation({
        id,
        type: 'freehand',
        x,
        y,
        points: [
          { x, y },
          { x: x + 28, y: y + 14 },
          { x: x + 56, y: y + 4 },
        ],
      });
    } else {
      this.addAnnotation({ id, type: 'text', x, y, text: this.t('textTool') });
    }
  };

  private handleItemKeydown = (event: KeyboardEvent, id: string): void => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.removeAnnotation(id);
    }
  };

  private renderShape(item: ImageAnnotation) {
    if (item.type === 'rect') {
      return svg`<rect
        class="shape"
        x=${String(item.x)}
        y=${String(item.y)}
        width=${String(item.width ?? 60)}
        height=${String(item.height ?? 40)}
        rx="2"
      />`;
    }
    if (item.type === 'arrow') {
      const x2 = item.x2 ?? item.x + 56;
      const y2 = item.y2 ?? item.y + 24;
      return svg`<line
        class="shape"
        x1=${String(item.x)}
        y1=${String(item.y)}
        x2=${String(x2)}
        y2=${String(y2)}
      />`;
    }
    if (item.type === 'freehand') {
      const pts = (item.points && item.points.length > 0 ? item.points : [{ x: item.x, y: item.y }])
        .map((p) => `${p.x},${p.y}`)
        .join(' ');
      return svg`<polyline class="shape" points=${pts} />`;
    }
    return svg`<text class="shape-label" x=${String(item.x)} y=${String(item.y)}>${item.text ?? ''}</text>`;
  }

  private handleToolbarKeyDown = (event: KeyboardEvent): void => {
    if (
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      event.stopPropagation();
    }
  };

  override render() {
    const items = this._engine?.getAnnotations() ?? this.annotations;
    const regionLabel = this.label.trim() || this.t('regionLabel');
    const safeSrc = this.src && isSafeMediaUrl(this.src) ? this.src : '';
    const tools: Array<{ id: AnnotationTool; label: string }> = [
      { id: 'rect', label: this.t('rectTool') },
      { id: 'arrow', label: this.t('arrowTool') },
      { id: 'text', label: this.t('textTool') },
      { id: 'freehand', label: this.t('freehandTool') },
    ];

    return html`
      <div
        part="base"
        role="region"
        aria-label=${regionLabel}
        dir=${this.resolvedDir}
        data-revision=${String(this.revision)}
      >
        <div
          part="toolbar"
          role="toolbar"
          aria-label=${this.t('toolbarLabel')}
          @keydown=${this.handleToolbarKeyDown}
        >
          ${tools.map(
            (t) => html`
              <button
                type="button"
                class="tool-btn"
                ?disabled=${this.disabled || this.readonly}
                aria-pressed=${this.tool === t.id ? 'true' : 'false'}
                @click=${() => this.setTool(t.id)}
              >
                ${t.label}
              </button>
            `,
          )}
          <button
            type="button"
            class="tool-btn"
            ?disabled=${this.disabled || this.readonly || !(this._engine?.canUndo ?? false)}
            @click=${() => this.undo()}
          >
            ${this.t('undoLabel')}
          </button>
          <button
            type="button"
            class="tool-btn"
            ?disabled=${this.disabled || this.readonly || !(this._engine?.canRedo ?? false)}
            @click=${() => this.redo()}
          >
            ${this.t('redoLabel')}
          </button>
          <button
            type="button"
            class="tool-btn"
            ?disabled=${this.disabled || this.readonly || items.length === 0}
            @click=${() => this.clearAnnotations()}
          >
            ${this.t('clearLabel')}
          </button>
          <slot name="toolbar"></slot>
        </div>

        <div part="stage" @click=${this.handleStageClick}>
          ${safeSrc ? html`<img part="image" src=${safeSrc} alt=${this.alt} />` : nothing}
          <svg
            part="overlay"
            viewBox="0 0 400 240"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            ${items.map((item) => this.renderShape(item))}
          </svg>
        </div>

        <div part="annotation-list" role="listbox" aria-label=${this.t('annotationListLabel')}>
          ${items.length === 0
            ? html`<span part="status">${this.t('emptyAnnotations')}</span>`
            : items.map(
                (item, index) => html`
                  <div
                    part="annotation-item"
                    role="option"
                    tabindex=${this.rovingFocus.currentIndex === index ? '0' : '-1'}
                    data-id=${item.id}
                    aria-selected=${this.selectedId === item.id ? 'true' : 'false'}
                    @click=${() => this.selectAnnotation(item.id)}
                    @keydown=${(e: KeyboardEvent) => this.handleItemKeydown(e, item.id)}
                  >
                    ${item.type}${item.text ? `: ${item.text}` : ''}
                  </div>
                `,
              )}
        </div>

        ${this.errorMessage
          ? html`<div part="status" role="alert">${this.errorMessage}</div>`
          : nothing}
        <slot name="fallback"></slot>
      </div>
    `;
  }
}
