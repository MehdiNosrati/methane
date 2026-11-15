import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  ObserverPoolController,
  RovingFocusController,
  type RovingOrientation,
} from '@methane-ui/primitives';
import { html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { menubarMessages } from './menubar.messages.js';
import { EMPTY_MENUBAR_ITEMS, type MenubarItem, type MenubarSubItem } from './menubar.spec.js';
import { menubarStyles } from './menubar.styles.js';

export type { MenubarItem, MenubarSubItem };

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
 * `<mth-menubar>`: WAI-ARIA application menubar with RTL-aware roving focus and submenus.
 */
export class MthMenubar extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = menubarMessages;
  static override styles = [menubarStyles];

  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  orientation: RovingOrientation = 'horizontal';

  @property({ attribute: false })
  items: ReadonlyArray<MenubarItem> = EMPTY_MENUBAR_ITEMS;

  @state()
  private openItemValue = '';

  private readonly rovingCtrl: RovingFocusController;
  private readonly observerCtrl: ObserverPoolController;
  private stopClickOutside: (() => void) | null = null;

  constructor() {
    super();
    this.observerCtrl = new ObserverPoolController(this);
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: this.orientation,
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? []),
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopClickOutside?.();
    this.stopClickOutside = null;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.rovingCtrl.updateOptions({
      orientation: this.orientation,
      dir: this.closest('[dir]') ? 'auto' : this.resolvedDir,
    });
    if (changed.has('openItemValue')) {
      this.setCustomState('open', this.openItemValue.length > 0);
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('items') || changed.has('orientation')) {
      this.rovingCtrl.syncTabIndices();
    }
  }

  openSubmenu(value: string, focusFirst = false): void {
    const entry = this.items.find((i) => i.value === value && !i.disabled && i.children?.length);
    if (!entry) return;
    this.openItemValue = entry.value;
    this.setCustomState('open', true);
    if (!this.stopClickOutside) {
      this.stopClickOutside = this.observerCtrl.observeClickOutside(this, () => {
        this.closeSubmenu(false);
      });
    }
    if (focusFirst) {
      void this.updateComplete.then(() => {
        const firstSub = this.shadowRoot?.querySelector<HTMLElement>(
          `[data-menu-for="${CSS.escape(entry.value)}"] [part="submenu-item"]:not([aria-disabled="true"])`,
        );
        firstSub?.focus();
      });
    }
  }

  closeSubmenu(restoreTriggerFocus = false): void {
    const prevValue = this.openItemValue;
    if (!prevValue) return;
    this.openItemValue = '';
    this.setCustomState('open', false);
    this.stopClickOutside?.();
    this.stopClickOutside = null;
    if (restoreTriggerFocus) {
      const trigger = this.shadowRoot?.querySelector<HTMLElement>(
        `[part="item"][data-value="${CSS.escape(prevValue)}"]`,
      );
      trigger?.focus();
    }
  }

  private isRtl(): boolean {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl';
  }

  private getTopItems(): Array<HTMLElement> {
    return Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? []);
  }

  private handleTopItemClick(event: Event, item: MenubarItem): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    if (item.children && item.children.length > 0) {
      if (this.openItemValue === item.value) {
        this.closeSubmenu(false);
      } else {
        this.openSubmenu(item.value, false);
      }
      return;
    }
    this.closeSubmenu(false);
    this.emitEvent('mth-select', {
      detail: {
        value: item.value,
        label: item.label,
        ...(item.href && isSafeHref(item.href) ? { href: item.href.trim() } : {}),
      },
    });
  }

  private handleTopItemKeyDown(event: KeyboardEvent, item: MenubarItem): void {
    if (item.disabled) return;
    const hasMenu = Boolean(item.children && item.children.length > 0);
    if (!hasMenu) return;

    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openSubmenu(item.value, true);
    } else if (event.key === 'Escape' && this.openItemValue === item.value) {
      event.preventDefault();
      this.closeSubmenu(true);
    }
  }

  private handleSubItemClick(event: Event, parent: MenubarItem, sub: MenubarSubItem): void {
    if (sub.disabled) {
      event.preventDefault();
      return;
    }
    this.closeSubmenu(false);
    this.emitEvent('mth-select', {
      detail: {
        value: sub.value,
        label: sub.label,
        parentValue: parent.value,
        ...(sub.href && isSafeHref(sub.href) ? { href: sub.href.trim() } : {}),
      },
    });
  }

  private handleSubmenuKeyDown(event: KeyboardEvent, parent: MenubarItem): void {
    const menu = this.shadowRoot?.querySelector<HTMLElement>(
      `[data-menu-for="${CSS.escape(parent.value)}"]`,
    );
    if (!menu) return;

    const subItems = Array.from(
      menu.querySelectorAll<HTMLElement>('[part="submenu-item"]:not([aria-disabled="true"])'),
    );
    if (subItems.length === 0) return;

    const active = this.shadowRoot?.activeElement as HTMLElement | null;
    const currentIdx = active ? subItems.indexOf(active) : -1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      const next = subItems[(currentIdx + 1) % subItems.length];
      next?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      const prev = subItems[(currentIdx - 1 + subItems.length) % subItems.length];
      prev?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      event.stopPropagation();
      subItems[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      event.stopPropagation();
      subItems[subItems.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeSubmenu(true);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      const topItems = this.getTopItems().filter(
        (el) => el.getAttribute('aria-disabled') !== 'true',
      );
      const currentTopIdx = topItems.findIndex((el) => el.dataset['value'] === parent.value);
      if (currentTopIdx >= 0 && topItems.length > 0) {
        const rtl = this.isRtl();
        const delta =
          (event.key === 'ArrowRight' && !rtl) || (event.key === 'ArrowLeft' && rtl) ? 1 : -1;
        const nextTop = topItems[(currentTopIdx + delta + topItems.length) % topItems.length];
        const nextVal = nextTop?.dataset['value'] ?? '';
        this.closeSubmenu(false);
        nextTop?.focus();
        const nextEntry = this.items.find((i) => i.value === nextVal);
        if (nextEntry?.children?.length) {
          this.openSubmenu(nextEntry.value, true);
        }
      }
    }
  }

  private renderSubItem(parent: MenubarItem, sub: MenubarSubItem): TemplateResult {
    const safeHref = sub.href && isSafeHref(sub.href) ? sub.href.trim() : null;
    if (safeHref && !sub.disabled) {
      return html`
        <a
          part="submenu-item"
          role="menuitem"
          tabindex="-1"
          href=${safeHref}
          @click=${(e: Event) => this.handleSubItemClick(e, parent, sub)}
        >
          <span>${sub.label}</span>
          ${sub.shortcut ? html`<span part="shortcut">${sub.shortcut}</span>` : nothing}
        </a>
      `;
    }
    return html`
      <button
        part="submenu-item"
        type="button"
        role="menuitem"
        tabindex="-1"
        ?disabled=${Boolean(sub.disabled)}
        aria-disabled=${sub.disabled ? 'true' : nothing}
        @click=${(e: Event) => this.handleSubItemClick(e, parent, sub)}
      >
        <span>${sub.label}</span>
        ${sub.shortcut ? html`<span part="shortcut">${sub.shortcut}</span>` : nothing}
      </button>
    `;
  }

  private renderTopItem(item: MenubarItem): TemplateResult {
    const hasSubmenu = Boolean(item.children && item.children.length > 0);
    const isOpen = hasSubmenu && this.openItemValue === item.value;
    const menuId = `mth-mb-menu-${item.value}`;
    const safeHref = !hasSubmenu && item.href && isSafeHref(item.href) ? item.href.trim() : null;

    return html`
      <div class="mb-entry" role="none">
        ${safeHref && !item.disabled
          ? html`
              <a
                part="item"
                role="menuitem"
                data-value=${item.value}
                href=${safeHref}
                @click=${(e: Event) => this.handleTopItemClick(e, item)}
                @keydown=${(e: KeyboardEvent) => this.handleTopItemKeyDown(e, item)}
              >
                <span>${item.label}</span>
              </a>
            `
          : html`
              <button
                part="item"
                type="button"
                role="menuitem"
                data-value=${item.value}
                ?disabled=${Boolean(item.disabled)}
                aria-disabled=${item.disabled ? 'true' : nothing}
                aria-haspopup=${hasSubmenu ? 'menu' : nothing}
                aria-expanded=${hasSubmenu ? (isOpen ? 'true' : 'false') : nothing}
                aria-controls=${hasSubmenu ? menuId : nothing}
                @click=${(e: Event) => this.handleTopItemClick(e, item)}
                @keydown=${(e: KeyboardEvent) => this.handleTopItemKeyDown(e, item)}
              >
                <span>${item.label}</span>
                ${hasSubmenu ? html`<span aria-hidden="true">▾</span>` : nothing}
              </button>
            `}

        ${hasSubmenu
          ? html`
              <div
                id=${menuId}
                part="menu"
                role="menu"
                aria-label=${item.label}
                data-menu-for=${item.value}
                ?hidden=${!isOpen}
                @keydown=${(e: KeyboardEvent) => this.handleSubmenuKeyDown(e, item)}
              >
                ${item.children!.map((sub) => this.renderSubItem(item, sub))}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  protected override render() {
    const menubarLabel = this.label.trim() || this.t('menubarLabel');

    return html`
      <div
        id="mth-menubar-root"
        part="menubar"
        role="menubar"
        aria-orientation=${this.orientation}
        aria-label=${menubarLabel}
      >
        ${this.items.length > 0
          ? this.items.map((item) => this.renderTopItem(item))
          : html`<slot></slot>`}
      </div>
    `;
  }
}
