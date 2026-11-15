import { UIElement, type PropertyValues } from '@methane/core';
import { ObserverPoolController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { tocMessages } from './toc.messages.js';
import { EMPTY_TOC_ITEMS, type TocItem } from './toc.spec.js';
import { tocStyles } from './toc.styles.js';

export type { TocItem };

function isSafeHref(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^(\/|\.\/|\.\.\/|\?|#)/.test(trimmed)) return !trimmed.startsWith('//');
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!schemeMatch) return !trimmed.startsWith('//');
  const scheme = schemeMatch[1]!.toLowerCase();
  return scheme === 'https' || scheme === 'http' || scheme === 'mailto' || scheme === 'tel';
}

/**
 * `<mth-toc>`: Table of contents landmark that highlights the currently visible
 * section via `ObserverPoolController.observeIntersection`.
 */
export class MthToc extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = tocMessages;
  static override styles = [tocStyles];

  @property({ type: String })
  label = '';

  @property({ type: String })
  heading = '';

  @property({ type: String, attribute: 'active-id' })
  activeId = '';

  @property({ type: String, attribute: 'target-selector' })
  targetSelector = '';

  @property({ attribute: false })
  items: ReadonlyArray<TocItem> = EMPTY_TOC_ITEMS;

  @state()
  private discoveredItems: ReadonlyArray<TocItem> = EMPTY_TOC_ITEMS;

  private readonly observerCtrl: ObserverPoolController;
  private cleanups: Array<() => void> = [];

  constructor() {
    super();
    this.observerCtrl = new ObserverPoolController(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncDiscoveredItems();
    this.rebindHeadingObservers();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearHeadingObservers();
  }

  getResolvedItems(): ReadonlyArray<TocItem> {
    return this.items.length > 0 ? this.items : this.discoveredItems;
  }

  refreshDiscoveryAndObservers(): void {
    this.syncDiscoveredItems();
    this.rebindHeadingObservers();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('items') || changed.has('targetSelector')) {
      this.syncDiscoveredItems();
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('items') || changed.has('targetSelector')) {
      this.rebindHeadingObservers();
    }
  }

  private syncDiscoveredItems(): void {
    if (typeof document === 'undefined') return;
    if (this.items.length === 0 && this.targetSelector.trim()) {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(this.targetSelector));
      this.discoveredItems = nodes
        .filter((el) => Boolean(el.id))
        .map((el) => {
          const levelMatch = /^h([1-6])$/i.exec(el.tagName);
          return {
            id: el.id,
            label: el.textContent?.trim() ?? el.id,
            level: levelMatch ? Number(levelMatch[1]) : 2,
          };
        });
    } else if (this.items.length > 0) {
      this.discoveredItems = EMPTY_TOC_ITEMS;
    }
  }

  private rebindHeadingObservers(): void {
    this.clearHeadingObservers();
    if (typeof document === 'undefined') return;
    const activeItems = this.getResolvedItems();
    for (const item of activeItems) {
      const target = document.getElementById(item.id);
      if (!target) continue;
      const unsub = this.observerCtrl.observeIntersection(target, (entry) => {
        if (entry.isIntersecting && this.activeId !== item.id) {
          this.activeId = item.id;
          this.emitEvent('mth-active-change', { detail: { id: item.id } });
        }
      });
      this.cleanups.push(unsub);
    }
  }

  private clearHeadingObservers(): void {
    for (const unsub of this.cleanups) {
      unsub();
    }
    this.cleanups = [];
  }

  private handleLinkClick(event: Event, item: TocItem, href: string): void {
    event.preventDefault();
    this.activeId = item.id;
    const target = typeof document !== 'undefined' ? document.getElementById(item.id) : null;
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.emitEvent('mth-select', {
      detail: { id: item.id, label: item.label, href },
    });
    this.emitEvent('mth-active-change', {
      detail: { id: item.id },
    });
  }

  protected override render() {
    const resolved = this.getResolvedItems();
    const navLabel = this.label.trim() || this.t('navLabel');
    const headingText = this.heading.trim() || this.t('heading');

    return html`
      <nav part="nav" aria-label=${navLabel}>
        <div part="heading">
          <slot name="heading">${headingText}</slot>
        </div>
        <ol part="list">
          ${resolved.map((item) => {
            const fallbackHref = `#${item.id}`;
            const rawHref = item.href && isSafeHref(item.href) ? item.href.trim() : fallbackHref;
            const isActive = this.activeId === item.id;
            const level = Math.min(4, Math.max(2, item.level ?? 2));
            return html`
              <li part="item">
                <a
                  part="link"
                  href=${rawHref}
                  data-level=${String(level)}
                  data-id=${item.id}
                  aria-current=${isActive ? 'location' : nothing}
                  @click=${(e: Event) => this.handleLinkClick(e, item, rawHref)}
                >
                  ${item.label}
                </a>
              </li>
            `;
          })}
        </ol>
      </nav>
    `;
  }
}
