import { UIElement, type PropertyValues, html, nothing, property, query } from '@methane/core';
import {
  ObserverPoolController,
  VirtualizerController,
  type VirtualItem,
} from '@methane/primitives';
import { virtualScrollerMessages } from './virtual-scroller.messages.js';
import { virtualScrollerStyles } from './virtual-scroller.styles.js';

/**
 * Windowed virtual list scroller backed by `VirtualizerController`.
 */
export class MthVirtualScroller<T = unknown> extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = virtualScrollerStyles;
  static override messages = virtualScrollerMessages;

  @property({ attribute: false })
  items: ReadonlyArray<T> = [];

  @property({ attribute: false })
  renderItem?: (item: T, index: number) => unknown;

  @property({ type: Number, attribute: 'estimate-size' })
  estimateSize = 48;

  @property({ type: Number })
  overscan = 3;

  @property({ type: Number, attribute: 'viewport-height' })
  viewportHeight = 320;

  @property({ type: String })
  label = '';

  @query('[part="viewport"]')
  private viewportEl!: HTMLElement | null;

  private readonly virtualizer: VirtualizerController;
  private readonly observerPool: ObserverPoolController;
  private dynamicSheet: CSSStyleSheet | null = null;
  private lastRangeKey = '';

  constructor() {
    super();
    this.observerPool = new ObserverPoolController(this);
    this.virtualizer = new VirtualizerController(this, {
      count: 0,
      estimateSize: () => Math.max(1, this.estimateSize || 48),
      overscan: this.overscan,
      getScrollElement: () => this.viewportEl,
    });
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('items')) {
      this.virtualizer.setCount(this.items.length);
    }
    if (changed.has('viewportHeight') || !this.hasUpdated) {
      const measuredHeight = this.viewportEl?.clientHeight ?? 0;
      this.virtualizer.setViewport(measuredHeight > 0 ? measuredHeight : this.viewportHeight);
    }
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    if (this.viewportEl) {
      this.observerPool.observeResize(this.viewportEl, (entry) => {
        if (entry.contentRect.height > 0) {
          this.virtualizer.setViewport(entry.contentRect.height, entry.contentRect.width);
        }
      });
    }
    this.syncDynamicStyles(this.getVirtualItems());
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    const virtualItems = this.getVirtualItems();
    this.syncDynamicStyles(virtualItems);
    this.emitRangeIfChanged(virtualItems);
  }

  /**
   * Returns currently windowed virtual items.
   */
  getVirtualItems(): VirtualItem[] {
    if (this.items.length === 0) return [];
    return this.virtualizer.getVirtualItems();
  }

  /**
   * Updates measured block size for a specific row index.
   */
  measureItem(index: number, size: number): void {
    this.virtualizer.measureItem(index, size);
  }

  /**
   * Scrolls viewport to align the specified item index.
   */
  scrollToIndex(index: number, align: 'start' | 'center' | 'end' = 'start'): void {
    this.virtualizer.scrollToIndex(index, align);
    this.requestUpdate();
  }

  /**
   * Sets scroll offset explicitly (useful in headless environments without layout).
   */
  setScrollTop(scrollTop: number): void {
    this.virtualizer.setScrollPosition(Math.max(0, scrollTop), 0);
    if (this.viewportEl) {
      this.viewportEl.scrollTop = Math.max(0, scrollTop);
    }
  }

  private readonly handleScroll = (): void => {
    if (!this.viewportEl) return;
    this.virtualizer.setScrollPosition(this.viewportEl.scrollTop, this.viewportEl.scrollLeft);
  };

  private emitRangeIfChanged(virtualItems: VirtualItem[]): void {
    const startIndex = virtualItems[0]?.index ?? -1;
    const endIndex = virtualItems[virtualItems.length - 1]?.index ?? -1;
    const key = `${startIndex}:${endIndex}`;
    if (key !== this.lastRangeKey) {
      this.lastRangeKey = key;
      if (startIndex >= 0 && endIndex >= 0) {
        this.emitEvent('mth-range-change', { detail: { startIndex, endIndex } });
      }
    }
  }

  private syncDynamicStyles(virtualItems: VirtualItem[]): void {
    if (
      typeof CSSStyleSheet === 'undefined' ||
      !this.shadowRoot ||
      !('adoptedStyleSheets' in this.shadowRoot)
    ) {
      return;
    }
    if (!this.dynamicSheet) {
      this.dynamicSheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        this.dynamicSheet,
      ];
    }

    const totalSize = this.virtualizer.totalSize;
    const itemRules = virtualItems
      .map(
        (v) =>
          `[data-virtual-index="${v.index}"] { transform: translateY(${v.start}px); min-block-size: ${v.size}px; }`,
      )
      .join('\n');
    this.dynamicSheet.replaceSync(
      `[part="viewport"] { block-size: ${Math.max(1, this.viewportHeight)}px; }\n[part="spacer"] { block-size: ${totalSize}px; }\n${itemRules}`,
    );
  }

  override render() {
    const virtualItems = this.getVirtualItems();

    return html`
      <div
        part="viewport"
        tabindex="0"
        role=${this.items.length > 0 ? 'list' : nothing}
        aria-label=${this.label || nothing}
        @scroll=${this.handleScroll}
      >
        ${this.items.length === 0
          ? html`<slot></slot>`
          : html`
              <div part="spacer">
                ${virtualItems.map((vItem) => {
                  const data = this.items[vItem.index];
                  const content = this.renderItem
                    ? this.renderItem(data as T, vItem.index)
                    : String(data ?? '');
                  return html`
                    <div
                      part="item"
                      role="listitem"
                      data-virtual-index=${String(vItem.index)}
                    >
                      ${content}
                    </div>
                  `;
                })}
              </div>
            `}
      </div>
    `;
  }
}
