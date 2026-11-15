import { UIElement, type PropertyValues, html, nothing, property, query, state } from '@methane-ui/core';
import { ObserverPoolController } from '@methane-ui/primitives';
import { breadcrumbPathMessages } from './breadcrumb-path.messages.js';
import { breadcrumbPathStyles } from './breadcrumb-path.styles.js';

export interface MthBreadcrumbPathItem {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
  readonly value?: string;
}

function isSafeHref(href: string | undefined): href is string {
  if (!href) return false;
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (/^(\/|\.\.?\/|\?|#)/.test(trimmed)) return true;
  try {
    const parsed = new URL(trimmed, 'https://example.invalid');
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Data-driven breadcrumb path component with automatic middle-ellipsis collapsing.
 */
export class MthBreadcrumbPath extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = breadcrumbPathStyles;
  static override messages = breadcrumbPathMessages;

  @property({ attribute: false })
  items: ReadonlyArray<MthBreadcrumbPathItem> = [];

  @property({ type: Number, attribute: 'max-items' })
  maxItems = 0;

  @property({ type: String })
  separator = '/';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  expanded = false;

  @query('[part="base"]')
  private baseEl!: HTMLElement | null;

  @state()
  private autoMaxItems = 0;

  private readonly observerPool: ObserverPoolController;

  constructor() {
    super();
    this.observerPool = new ObserverPoolController(this);
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    if (this.baseEl) {
      this.observerPool.observeResize(this.baseEl, (entry) => {
        if (this.maxItems === 0 && entry.contentRect.width > 0) {
          const fitCount = Math.max(3, Math.floor(entry.contentRect.width / 110));
          this.autoMaxItems = this.items.length > fitCount ? fitCount : 0;
        }
      });
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.setCustomState('collapsed', this.isCollapsed());
  }

  private getEffectiveLimit(): number {
    if (this.expanded) return 0;
    if (this.maxItems > 0) return Math.max(2, Math.floor(this.maxItems));
    return this.autoMaxItems;
  }

  private isCollapsed(): boolean {
    const limit = this.getEffectiveLimit();
    return limit > 0 && this.items.length > limit;
  }

  private readonly handleExpandClick = (): void => {
    this.expanded = true;
    this.emitEvent('mth-expand', { detail: { expanded: true } });
  };

  private readonly handleItemClick = (
    event: MouseEvent,
    item: MthBreadcrumbPathItem,
    index: number,
  ): void => {
    const allowed = this.emitEvent('mth-navigate', {
      cancelable: true,
      detail: { item, index },
    });
    if (!allowed) {
      event.preventDefault();
    }
  };

  override render() {
    const navLabel = this.label.trim() || this.t('label');
    const limit = this.getEffectiveLimit();
    const shouldCollapse = limit > 0 && this.items.length > limit;

    type Entry =
      | { kind: 'item'; item: MthBreadcrumbPathItem; index: number }
      | { kind: 'ellipsis' };

    const entries: Entry[] = [];
    if (!shouldCollapse) {
      this.items.forEach((item, index) => entries.push({ kind: 'item', item, index }));
    } else {
      const tailCount = Math.max(1, limit - 1);
      const first = this.items[0];
      if (first) {
        entries.push({ kind: 'item', item: first, index: 0 });
      }
      entries.push({ kind: 'ellipsis' });
      const tailStart = Math.max(1, this.items.length - tailCount);
      for (let i = tailStart; i < this.items.length; i += 1) {
        const item = this.items[i];
        if (item) {
          entries.push({ kind: 'item', item, index: i });
        }
      }
    }

    return html`
      <nav part="base" aria-label=${navLabel}>
        <ol part="list">
          ${entries.map((entry, pos) => {
            const hasSep = pos < entries.length - 1;
            const sep = hasSep
              ? html`<span part="separator" aria-hidden="true">${this.separator}</span>`
              : nothing;

            if (entry.kind === 'ellipsis') {
              return html`
                <li part="item">
                  <button
                    part="ellipsis"
                    type="button"
                    aria-label=${this.t('expandPath')}
                    @click=${this.handleExpandClick}
                  >
                    &hellip;
                  </button>
                  ${sep}
                </li>
              `;
            }

            const isCurrent =
              entry.item.current === true || entry.index === this.items.length - 1;
            const safeHref = isSafeHref(entry.item.href) ? entry.item.href : null;

            return html`
              <li part="item">
                ${safeHref && !isCurrent
                  ? html`
                      <a
                        part="link"
                        href=${safeHref}
                        @click=${(e: MouseEvent) =>
                          this.handleItemClick(e, entry.item, entry.index)}
                      >
                        ${entry.item.label}
                      </a>
                    `
                  : html`
                      <span part="link" aria-current=${isCurrent ? 'page' : nothing}>
                        ${entry.item.label}
                      </span>
                    `}
                ${sep}
              </li>
            `;
          })}
        </ol>
      </nav>
    `;
  }
}
