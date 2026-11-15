import { UIElement, type PropertyValues } from '@methane/core';
import { RovingFocusController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { bottomNavMessages } from './bottom-nav.messages.js';
import { EMPTY_BOTTOM_NAV_ITEMS, type BottomNavItem } from './bottom-nav.spec.js';
import { bottomNavStyles } from './bottom-nav.styles.js';

export type { BottomNavItem };

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
 * `<mth-bottom-nav>`: Responsive viewport-pinned bottom `<nav>` bar with
 * horizontal roving focus and safe destination handling.
 */
export class MthBottomNav extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = bottomNavMessages;
  static override styles = [bottomNavStyles];

  @property({ type: String })
  label = '';

  @property({ type: String, attribute: 'active-value' })
  activeValue = '';

  @property({ type: String, attribute: 'active-href' })
  activeHref = '';

  @property({ type: Boolean, reflect: true })
  fixed = true;

  @property({ attribute: false })
  items: ReadonlyArray<BottomNavItem> = EMPTY_BOTTOM_NAV_ITEMS;

  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? []),
    });
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('items') || changed.has('activeValue') || changed.has('activeHref')) {
      this.rovingCtrl.syncTabIndices();
    }
  }

  private isItemActive(item: BottomNavItem): boolean {
    if (this.activeValue && item.value === this.activeValue) return true;
    if (this.activeHref && item.href && item.href === this.activeHref) return true;
    return false;
  }

  private handleItemActivate(event: Event, item: BottomNavItem): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    const safeHref = item.href && isSafeHref(item.href) ? item.href.trim() : undefined;
    if (item.href && !safeHref) {
      event.preventDefault();
    }
    this.activeValue = item.value;
    if (safeHref) {
      this.activeHref = safeHref;
    }
    this.emitEvent('mth-select', {
      detail: {
        value: item.value,
        label: item.label,
        ...(safeHref ? { href: safeHref } : {}),
      },
    });
  }

  protected override render() {
    const navLabel = this.label.trim() || this.t('navLabel');

    return html`
      <nav part="nav" aria-label=${navLabel}>
        <ul part="list">
          ${this.items.map((item) => {
            const safeHref = item.href && isSafeHref(item.href) ? item.href.trim() : null;
            const current = this.isItemActive(item);

            return html`
              <li>
                ${item.href
                  ? html`
                      <a
                        part="item"
                        href=${item.disabled || !safeHref ? '#' : safeHref}
                        data-value=${item.value}
                        aria-current=${current ? 'page' : nothing}
                        aria-disabled=${item.disabled ? 'true' : nothing}
                        @click=${(e: Event) => this.handleItemActivate(e, item)}
                      >
                        <span>${item.label}</span>
                        ${item.badge ? html`<span part="badge">${item.badge}</span>` : nothing}
                      </a>
                    `
                  : html`
                      <button
                        part="item"
                        type="button"
                        data-value=${item.value}
                        ?disabled=${Boolean(item.disabled)}
                        aria-current=${current ? 'page' : nothing}
                        aria-disabled=${item.disabled ? 'true' : nothing}
                        @click=${(e: Event) => this.handleItemActivate(e, item)}
                      >
                        <span>${item.label}</span>
                        ${item.badge ? html`<span part="badge">${item.badge}</span>` : nothing}
                      </button>
                    `}
              </li>
            `;
          })}
        </ul>
      </nav>
    `;
  }
}
