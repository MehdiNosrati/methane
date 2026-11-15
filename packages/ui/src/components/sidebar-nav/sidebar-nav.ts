import { UIElement, type PropertyValues } from '@methane-ui/core';
import { RovingFocusController } from '@methane-ui/primitives';
import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { sidebarNavMessages } from './sidebar-nav.messages.js';
import { EMPTY_SIDEBAR_NAV_ITEMS, type SidebarNavItem } from './sidebar-nav.spec.js';
import { sidebarNavStyles } from './sidebar-nav.styles.js';

export type { SidebarNavItem };

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
 * `<mth-sidebar-nav>`: Collapsible vertical navigation landmark with roving focus
 * keyboard navigation, grouped sections, and safe URL validation.
 */
export class MthSidebarNav extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = sidebarNavMessages;
  static override styles = [sidebarNavStyles];

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  collapsed = false;

  @property({ type: Boolean })
  collapsible = false;

  @property({ type: String, attribute: 'active-value' })
  activeValue = '';

  @property({ type: String, attribute: 'active-href' })
  activeHref = '';

  @property({ attribute: false })
  items: ReadonlyArray<SidebarNavItem> = EMPTY_SIDEBAR_NAV_ITEMS;

  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? []),
    });
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    this.setCustomState('collapsed', this.collapsed);
    this.emitEvent('mth-collapse-change', {
      detail: { collapsed: this.collapsed },
    });
  }

  protected override onFirstConnect(): void {
    this.setCustomState('collapsed', this.collapsed);
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('collapsed')) {
      this.setCustomState('collapsed', this.collapsed);
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('items') || changed.has('activeValue') || changed.has('activeHref')) {
      this.rovingCtrl.syncTabIndices();
    }
  }

  private isItemActive(item: SidebarNavItem): boolean {
    if (this.activeValue && item.value === this.activeValue) return true;
    if (this.activeHref && item.href === this.activeHref) return true;
    return false;
  }

  private handleItemActivate(event: Event, item: SidebarNavItem): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    this.activeValue = item.value;
    if (item.href) {
      this.activeHref = item.href;
    }
    this.emitEvent('mth-select', {
      detail: {
        value: item.value,
        label: item.label,
        ...(item.href && isSafeHref(item.href) ? { href: item.href.trim() } : {}),
      },
    });
  }

  private renderItem(item: SidebarNavItem): TemplateResult {
    const isActive = this.isItemActive(item);
    const safeHref = item.href && isSafeHref(item.href) ? item.href.trim() : null;

    if (safeHref && !item.disabled) {
      return html`
        <li>
          <a
            part="item"
            href=${safeHref}
            aria-current=${isActive ? 'page' : nothing}
            @click=${(e: Event) => this.handleItemActivate(e, item)}
          >
            <span part="item-label">${item.label}</span>
            ${item.badge ? html`<span part="badge">${item.badge}</span>` : nothing}
          </a>
        </li>
      `;
    }

    return html`
      <li>
        <button
          part="item"
          type="button"
          ?disabled=${Boolean(item.disabled)}
          aria-disabled=${item.disabled ? 'true' : nothing}
          aria-current=${isActive ? 'page' : nothing}
          @click=${(e: Event) => this.handleItemActivate(e, item)}
        >
          <span part="item-label">${item.label}</span>
          ${item.badge ? html`<span part="badge">${item.badge}</span>` : nothing}
        </button>
      </li>
    `;
  }

  private renderGroupedItems(): Array<TemplateResult> {
    const ungrouped: Array<SidebarNavItem> = [];
    const grouped = new Map<string, Array<SidebarNavItem>>();
    for (const item of this.items) {
      if (item.group) {
        const list = grouped.get(item.group) ?? [];
        list.push(item);
        grouped.set(item.group, list);
      } else {
        ungrouped.push(item);
      }
    }

    const blocks: Array<TemplateResult> = [];
    for (const item of ungrouped) {
      blocks.push(this.renderItem(item));
    }

    for (const [groupName, items] of grouped.entries()) {
      blocks.push(html`
        <li role="presentation">
          <div part="group-label">${groupName}</div>
          <ul part="list">
            ${items.map((item) => this.renderItem(item))}
          </ul>
        </li>
      `);
    }

    return blocks;
  }

  protected override render() {
    const navLabel = this.label.trim() || this.t('navLabel');
    const toggleLabel = this.collapsed ? this.t('expandSidebar') : this.t('collapseSidebar');

    return html`
      <aside part="base">
        <div part="header">
          <slot name="header"></slot>
          ${this.collapsible
            ? html`
                <button
                  part="toggle"
                  type="button"
                  aria-expanded=${this.collapsed ? 'false' : 'true'}
                  aria-controls="mth-snav-list"
                  aria-label=${toggleLabel}
                  @click=${() => this.toggleCollapsed()}
                >
                  ${this.collapsed ? '»' : '«'}
                </button>
              `
            : nothing}
        </div>

        <nav part="nav" aria-label=${navLabel}>
          <ul id="mth-snav-list" part="list">
            ${this.items.length > 0 ? this.renderGroupedItems() : html`<slot></slot>`}
          </ul>
        </nav>

        <div part="footer">
          <slot name="footer"></slot>
        </div>
      </aside>
    `;
  }
}
