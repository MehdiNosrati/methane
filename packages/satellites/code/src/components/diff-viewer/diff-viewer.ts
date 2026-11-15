import { UIElement, type PropertyValues } from '@methane-ui/core';
import { RovingFocusController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { computeLineDiff, type DiffComputeResult } from '../../shared/line-diff.js';
import { readHostTokenValue, syncTokenStylesheet } from '../../shared/theme-sync.js';
import { diffViewerMessages } from './diff-viewer.messages.js';
import type { DiffViewMode } from './diff-viewer.spec.js';
import { diffViewerStyles } from './diff-viewer.styles.js';

const TRACKED_TOKENS = [
  '--mth-color-surface',
  '--mth-color-bg-subtle',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-border',
  '--mth-color-accent',
] as const;

export interface DiffViewerEngine {
  readonly view: DiffViewMode;
  readonly additions: number;
  readonly deletions: number;
  readonly hunkCount: number;
  nextHunk(): number;
  prevHunk(): number;
  setView(view: DiffViewMode): void;
  getThemeToken(tokenName: string): string;
  destroy(): void;
}

/**
 * `<mth-diff-viewer>`: Unified and split line-diff viewer with LCS diffing,
 * keyboard hunk navigation (`RovingFocusController`), and `--mth-*` token sync.
 */
export class MthDiffViewer extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = diffViewerMessages;
  static override styles = [diffViewerStyles];

  @property({ type: String })
  original = '';

  @property({ type: String })
  modified = '';

  @property({ type: String })
  filename = '';

  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  view: DiffViewMode = 'unified';

  @state()
  private activeHunkIndex = -1;

  private readonly rovingCtrl: RovingFocusController;

  private _engine: DiffViewerEngine | null = null;
  private diffCache: DiffComputeResult = computeLineDiff('', '');
  private tokenSheet: CSSStyleSheet | null = null;
  private readonly tokenCache = new Map<string, string>();
  private styleObserver: MutationObserver | null = null;

  constructor() {
    super();

    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="tool-button"]') ?? []),
    });
  }

  get engine(): DiffViewerEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.ensureEngine();
    this.attachStyleObserver();
    this.syncThemeTokens();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.styleObserver?.disconnect();
    this.styleObserver = null;
    this._engine?.destroy();
    this._engine = null;
  }

  syncThemeTokens(): void {
    if (!this.tokenSheet && typeof CSSStyleSheet !== 'undefined') {
      this.tokenSheet = new CSSStyleSheet();
    }
    syncTokenStylesheet(
      this,
      this.shadowRoot,
      this.tokenSheet,
      this.tokenCache,
      TRACKED_TOKENS,
    );
  }

  nextHunk(): number {
    const total = this.diffCache.hunkIndices.length;
    if (total === 0) return -1;
    const next = (this.activeHunkIndex + 1) % total;
    this.activeHunkIndex = next;
    this.emitEvent('mth-hunk-change', { detail: { hunkIndex: next, total } });
    return next;
  }

  prevHunk(): number {
    const total = this.diffCache.hunkIndices.length;
    if (total === 0) return -1;
    const prev = this.activeHunkIndex <= 0 ? total - 1 : this.activeHunkIndex - 1;
    this.activeHunkIndex = prev;
    this.emitEvent('mth-hunk-change', { detail: { hunkIndex: prev, total } });
    return prev;
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    this.syncThemeTokens();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.rovingCtrl.updateOptions({
      dir:
        (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl'
          ? 'rtl'
          : 'ltr',
    });
    if (changed.has('view')) {
      this.setCustomState('split', this.view === 'split');
    }
    if (changed.has('original') || changed.has('modified')) {
      this.diffCache = computeLineDiff(this.original, this.modified);
      this.activeHunkIndex = this.diffCache.hunkIndices.length > 0 ? 0 : -1;
    }
  }

  private attachStyleObserver(): void {
    if (typeof MutationObserver === 'undefined') return;
    this.styleObserver?.disconnect();
    this.styleObserver = new MutationObserver(() => {
      this.syncThemeTokens();
    });
    this.styleObserver.observe(this, { attributes: true, attributeFilter: ['style'] });
  }

  private ensureEngine(): void {
    if (this._engine) return;
    const readStats = () => ({
      view: this.view,
      additions: this.diffCache.additions,
      deletions: this.diffCache.deletions,
      hunkCount: this.diffCache.hunkIndices.length,
    });

    this._engine = {
      get view() {
        return readStats().view;
      },
      get additions() {
        return readStats().additions;
      },
      get deletions() {
        return readStats().deletions;
      },
      get hunkCount() {
        return readStats().hunkCount;
      },
      nextHunk: () => this.nextHunk(),
      prevHunk: () => this.prevHunk(),
      setView: (nextView: DiffViewMode) => {
        this.setView(nextView);
      },
      getThemeToken: (tokenName: string) =>
        readHostTokenValue(this, tokenName) || this.tokenCache.get(tokenName) || '',
      destroy: () => {
        // Released on disconnect
      },
    };
  }

  private setView(nextView: DiffViewMode): void {
    if (this.view === nextView) return;
    this.view = nextView;
    this.emitEvent('mth-view-change', { detail: { view: nextView } });
  }

  protected override render() {
    const regionLabel = this.label.trim() || this.t('regionLabel');
    const diff = this.diffCache;
    const activeRowIdx =
      this.activeHunkIndex >= 0 ? (diff.hunkIndices[this.activeHunkIndex] ?? -1) : -1;

    return html`
      <div part="base" role="region" aria-label=${regionLabel}>
        <div part="header">
          <div class="dv-meta">
            ${this.filename ? html`<span class="dv-file">${this.filename}</span>` : nothing}
            <span class="dv-added">+${diff.additions}</span>
            <span class="dv-removed">-${diff.deletions}</span>
          </div>

          <div class="dv-actions" role="toolbar" aria-label=${this.t('toolbarLabel')}>
            <button
              part="tool-button"
              type="button"
              ?disabled=${diff.hunkIndices.length === 0}
              @click=${() => this.prevHunk()}
            >
              ${this.t('prevHunkLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              ?disabled=${diff.hunkIndices.length === 0}
              @click=${() => this.nextHunk()}
            >
              ${this.t('nextHunkLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              aria-pressed=${this.view === 'unified' ? 'true' : 'false'}
              @click=${() => this.setView('unified')}
            >
              ${this.t('unifiedLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              aria-pressed=${this.view === 'split' ? 'true' : 'false'}
              @click=${() => this.setView('split')}
            >
              ${this.t('splitLabel')}
            </button>
          </div>
        </div>

        <div part="surface">
          ${diff.lines.map((line, idx) => {
            const isActiveHunk = idx === activeRowIdx;
            if (this.view === 'split') {
              const leftNum = line.oldLine !== null ? String(line.oldLine) : '';
              const rightNum = line.newLine !== null ? String(line.newLine) : '';
              const leftText = line.kind === 'added' ? '' : line.text;
              const rightText = line.kind === 'removed' ? '' : line.text;
              return html`
                <div
                  part="row"
                  data-kind=${line.kind}
                  data-active-hunk=${isActiveHunk ? 'true' : nothing}
                >
                  <span class="dv-num">${leftNum}</span>
                  <span class="dv-split-cell">${leftText}</span>
                  <span class="dv-num">${rightNum}</span>
                  <span class="dv-split-cell">${rightText}</span>
                </div>
              `;
            }

            const marker = line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' ';
            return html`
              <div
                part="row"
                data-kind=${line.kind}
                data-active-hunk=${isActiveHunk ? 'true' : nothing}
              >
                <span class="dv-num">${line.oldLine !== null ? String(line.oldLine) : ''}</span>
                <span class="dv-num">${line.newLine !== null ? String(line.newLine) : ''}</span>
                <span class="dv-marker">${marker}</span>
                <span>${line.text}</span>
              </div>
            `;
          })}
        </div>

        <div part="fallback">
          <slot name="fallback"></slot>
        </div>
      </div>
    `;
  }
}
