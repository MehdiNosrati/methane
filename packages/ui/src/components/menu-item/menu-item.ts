import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { menuItemMessages } from './menu-item.messages.js';
import { menuItemStyles } from './menu-item.styles.js';

export type MthMenuItemType = 'normal' | 'checkbox' | 'radio';
export type MthMenuItemRoleOverride =
  | 'auto'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'option';

/**
 * `<mth-menu-item>`: menu item supporting `normal`, `checkbox`, and `radio` semantics,
 * keyboard shortcuts, and nested `slot="submenu"` disclosure.
 */
export class MthMenuItem extends UIElement {
  static override messages = menuItemMessages;
  static override styles = menuItemStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String, reflect: true })
  type: MthMenuItemType = 'normal';

  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, reflect: true })
  shortcut = '';

  @property({ type: String, reflect: true })
  group = '';

  @property({ type: Boolean, reflect: true })
  active = false;

  @property({ type: Boolean, attribute: 'submenu-open', reflect: true })
  submenuOpen = false;

  @property({ type: String, attribute: 'item-role', reflect: true })
  itemRole: MthMenuItemRoleOverride = 'auto';

  @state()
  private hasSubmenu = false;

  @query('slot[name="submenu"]')
  private submenuSlotEl!: HTMLSlotElement | null;

  private pendingSubmenuFocus: MthMenuItem | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.removeEventListener('keydown', this.handleKeyDown);
    this.addEventListener('keydown', this.handleKeyDown);
    this.syncAccessibilityState();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.handleKeyDown);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (
      changedProperties.has('type') ||
      changedProperties.has('checked') ||
      changedProperties.has('disabled') ||
      changedProperties.has('active') ||
      changedProperties.has('submenuOpen') ||
      changedProperties.has('itemRole') ||
      changedProperties.has('hasSubmenu')
    ) {
      this.syncAccessibilityState();
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('submenuOpen') && this.submenuOpen && this.pendingSubmenuFocus) {
      const target = this.pendingSubmenuFocus;
      this.pendingSubmenuFocus = null;
      if (document.activeElement !== target) {
        target.focus();
      }
    }
  }

  getResolvedLabel(): string {
    return this.textContent?.trim() ?? '';
  }

  getSubmenuItems(): ReadonlyArray<MthMenuItem> {
    if (!this.submenuSlotEl) return [];
    return this.submenuSlotEl
      .assignedElements({ flatten: true })
      .filter((el): el is MthMenuItem => el.tagName.toLowerCase().endsWith('menu-item'));
  }

  openSubmenu(focusFirst = true): boolean {
    if (this.disabled || !this.hasSubmenu) return false;
    this.submenuOpen = true;
    const items = this.getSubmenuItems();
    const firstEnabled = items.find((item) => !item.disabled);
    items.forEach((item) => {
      const isTarget = focusFirst && item === firstEnabled;
      item.tabIndex = isTarget ? 0 : -1;
      item.active = isTarget;
    });
    if (focusFirst && firstEnabled) {
      this.pendingSubmenuFocus = firstEnabled;
      firstEnabled.focus();
    } else {
      this.pendingSubmenuFocus = null;
    }
    return true;
  }

  closeSubmenu(restoreFocus = false): void {
    this.pendingSubmenuFocus = null;
    if (!this.submenuOpen) return;
    this.submenuOpen = false;
    for (const item of this.getSubmenuItems()) {
      item.active = false;
      item.closeSubmenu(false);
    }
    if (restoreFocus) {
      this.focus();
    }
  }

  activate(): void {
    if (this.disabled) return;
    if (this.hasSubmenu) {
      if (this.submenuOpen) {
        this.closeSubmenu(true);
      } else {
        this.openSubmenu(true);
      }
      return;
    }

    if (this.type === 'checkbox') {
      this.checked = !this.checked;
    } else if (this.type === 'radio') {
      this.checked = true;
    }

    this.emitEvent('mth-select', {
      detail: {
        value: this.value || this.getResolvedLabel(),
        checked: this.checked,
      },
    });
  }

  private resolveComputedRole(): string {
    if (this.itemRole !== 'auto') return this.itemRole;
    if (this.type === 'checkbox') return 'menuitemcheckbox';
    if (this.type === 'radio') return 'menuitemradio';
    return 'menuitem';
  }

  private syncAccessibilityState(): void {
    const resolvedRole = this.resolveComputedRole();
    this.setCustomState('checked', this.checked);
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('active', this.active);
    this.setCustomState('submenu-open', this.submenuOpen);

    if (this.internals) {
      try {
        this.internals.role = resolvedRole;
        this.internals.ariaChecked =
          this.type === 'checkbox' || this.type === 'radio'
            ? this.checked
              ? 'true'
              : 'false'
            : null;
        this.internals.ariaDisabled = this.disabled ? 'true' : null;
        this.internals.ariaHasPopup = this.hasSubmenu ? 'menu' : null;
        this.internals.ariaExpanded = this.hasSubmenu ? (this.submenuOpen ? 'true' : 'false') : null;
      } catch {
        // Ignore engines without writable ElementInternals ARIA properties.
      }
    }

    // Mirror `.role` ARIAMixin property only when explicit `option` role override is requested
    // so generic test suites in JSDOM can inspect `getEffectiveRole(el)` cleanly.
    if (this.itemRole === 'option') {
      try {
        Object.defineProperty(this, 'role', {
          value: 'option',
          configurable: true,
          writable: true,
        });
      } catch {
        // Ignore if host already locks .role accessor.
      }
    }
  }

  private isRtl(): boolean {
    const dirHost = this.closest('[dir]') as HTMLElement | null;
    if (dirHost) {
      return dirHost.getAttribute('dir')?.toLowerCase() === 'rtl';
    }
    return this.ownerDocument?.documentElement?.getAttribute('dir')?.toLowerCase() === 'rtl';
  }

  private readonly handleSubmenuSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.hasSubmenu = slot.assignedElements({ flatten: true }).length > 0;
  };

  private readonly handleClick = (event: MouseEvent): void => {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const submenuEl = this.shadowRoot?.querySelector('[part="submenu"]') ?? null;
    if (submenuEl && path.includes(submenuEl)) {
      return;
    }
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.activate();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled) return;
    const rtl = this.isRtl();
    const openKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = rtl ? 'ArrowRight' : 'ArrowLeft';

    const submenuItems = this.submenuOpen && this.hasSubmenu ? this.getSubmenuItems() : [];
    const target = event.target as Node | null;
    const targetSubmenuIdx =
      submenuItems.length > 0 && target !== null && target !== this
        ? submenuItems.findIndex((item) => item === target || item.contains(target))
        : -1;

    if (targetSubmenuIdx >= 0) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Home' ||
        event.key === 'End'
      ) {
        const enabledIndices = submenuItems
          .map((item, idx) => (!item.disabled ? idx : -1))
          .filter((idx) => idx >= 0);
        if (enabledIndices.length > 0) {
          let nextIndex = targetSubmenuIdx;
          if (event.key === 'Home') {
            nextIndex = enabledIndices[0]!;
          } else if (event.key === 'End') {
            nextIndex = enabledIndices[enabledIndices.length - 1]!;
          } else {
            const pos = enabledIndices.indexOf(targetSubmenuIdx);
            const delta = event.key === 'ArrowDown' ? 1 : -1;
            const base = pos >= 0 ? pos : 0;
            nextIndex =
              enabledIndices[(base + delta + enabledIndices.length) % enabledIndices.length]!;
          }
          submenuItems.forEach((item, idx) => {
            const isNext = idx === nextIndex;
            item.tabIndex = isNext ? 0 : -1;
            item.active = isNext;
          });
          submenuItems[nextIndex]!.focus();
        }
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (event.key === closeKey || event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.closeSubmenu(true);
        return;
      }
    }

    if (event.key === openKey && this.hasSubmenu && !this.submenuOpen) {
      event.preventDefault();
      event.stopPropagation();
      this.openSubmenu(true);
      return;
    }

    if ((event.key === closeKey || event.key === 'Escape') && this.submenuOpen) {
      event.preventDefault();
      event.stopPropagation();
      this.closeSubmenu(true);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      if (event.target === this) {
        event.preventDefault();
        event.stopPropagation();
        if (this.hasSubmenu) {
          this.openSubmenu(true);
        } else {
          this.activate();
        }
      }
    }
  };

  private renderCheckGlyph() {
    if (this.type === 'checkbox') {
      return this.checked ? '✓' : nothing;
    }
    if (this.type === 'radio') {
      return this.checked ? '●' : nothing;
    }
    return nothing;
  }

  override render() {
    return html`
      <div part="base" class="base" @click=${this.handleClick}>
        <span part="check" class="check" aria-hidden="true">${this.renderCheckGlyph()}</span>
        <slot name="prefix"></slot>
        <span part="label" class="label"><slot></slot></span>
        ${this.shortcut
          ? html`<kbd part="shortcut" class="shortcut">${this.shortcut}</kbd>`
          : nothing}
        <slot name="suffix"></slot>
        <span
          part="submenu-arrow"
          class="submenu-arrow"
          aria-hidden="true"
          ?hidden=${!this.hasSubmenu}
        >
          ▸
        </span>
      </div>
      <div part="submenu" class="submenu" role="menu" ?hidden=${!this.submenuOpen}>
        <slot name="submenu" @slotchange=${this.handleSubmenuSlotChange}></slot>
      </div>
    `;
  }
}
