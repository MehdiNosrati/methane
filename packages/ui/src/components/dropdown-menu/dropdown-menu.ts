import { UIElement, type PropertyValues } from '@methane/core';
import {
  ListboxController,
  OverlayController,
  PositioningController,
  RovingFocusController,
  SlotCollectionController,
  type OverlayCloseReason,
  type Placement,
  type PositioningAnchor,
  type PositioningResult,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { dropdownMenuMessages } from './dropdown-menu.messages.js';
import { dropdownMenuStyles } from './dropdown-menu.styles.js';

interface MenuItemElementLike extends HTMLElement {
  value?: string;
  type?: 'normal' | 'checkbox' | 'radio';
  checked?: boolean;
  disabled?: boolean;
  group?: string;
  active?: boolean;
  itemRole?: string;
  activate?: () => void;
  closeSubmenu?: (restoreFocus?: boolean) => void;
}

export type MthDropdownMenuRoleMode = 'menu' | 'listbox';

/**
 * `<mth-dropdown-menu>`: floating menu overlay orchestrating Light-DOM `<mth-menu-item>`
 * collections via `SlotCollectionController`, `ListboxController`, `RovingFocusController`,
 * `OverlayController`, and dual-path `PositioningController` (adopted `CSSStyleSheet`).
 */
export class MthDropdownMenu extends UIElement {
  static override messages = dropdownMenuMessages;
  static override styles = dropdownMenuStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  placement: Placement = 'bottom-start';

  @property({ type: Number })
  offset = 6;

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'close-on-select', reflect: true })
  closeOnSelect = true;

  @property({ type: String, attribute: 'role-mode', reflect: true })
  roleMode: MthDropdownMenuRoleMode = 'menu';

  @property({ type: Boolean, attribute: 'force-fallback', reflect: true })
  forceFallback = false;

  @property({ attribute: false })
  anchor: PositioningAnchor | null = null;

  @state()
  private fallbackActive = false;

  @query('#mth-dropdown-menu-anchor')
  private anchorWrapperEl!: HTMLElement | null;

  @query('#mth-dropdown-menu-surface')
  private surfaceEl!: HTMLElement | null;

  @query('#mth-dropdown-menu-list')
  private listEl!: HTMLElement | null;

  @query('slot[name="trigger"]')
  private triggerSlotEl!: HTMLSlotElement | null;

  private syncingFromController = false;
  private activatingFromListbox = false;
  private positionSheet: CSSStyleSheet | null = null;

  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private readonly slotCtrl: SlotCollectionController<MenuItemElementLike>;
  private readonly listboxCtrl: ListboxController;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();

    this.slotCtrl = new SlotCollectionController<MenuItemElementLike>(this, {
      filter: (el): el is MenuItemElementLike =>
        el.tagName.toLowerCase().endsWith('menu-item'),
      attributeFilter: ['disabled', 'checked', 'value', 'type', 'group'],
      onItemsChange: () => {
        this.syncMenuItems();
      },
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.surfaceEl,
      trigger: () => this.getSlottedTrigger() ?? undefined!,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      forceFallback: false,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.fallbackActive = nextOpen && !this.overlayCtrl.isUsingNativeTopLayer;
        this.syncingFromController = false;
        this.setCustomState('open', nextOpen);

        if (nextOpen) {
          this.positioningCtrl.start();
          this.syncMenuItems();
        } else {
          this.closeAllSubmenus();
          this.positioningCtrl.stop();
          this.clearPositionSheet();
        }
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.resolveAnchor(),
      floating: () => this.surfaceEl,
      placement: this.placement,
      offset: this.offset,
      flip: true,
      shift: true,
      forceFallback: this.forceFallback,
      onPosition: (result) => {
        this.applyPositionSheet(result);
      },
    });

    this.listboxCtrl = new ListboxController(this, {
      focusMode: 'roving',
      loop: true,
      getListboxElement: () => this.listEl,
      getOptionElements: () => this.getSlottedMenuItems(),
      onActiveChange: (_option, index) => {
        const items = this.getSlottedMenuItems();
        items.forEach((item, i) => {
          item.active = i === index;
        });
        if (index >= 0) {
          this.rovingCtrl.setActiveIndex(index, false);
        }
      },
      onSelectionChange: () => {
        if (this.activatingFromListbox) return;
        const activeEl = this.listboxCtrl.activeOption?.element as MenuItemElementLike | undefined;
        if (activeEl && typeof activeEl.activate === 'function') {
          this.activatingFromListbox = true;
          try {
            activeEl.activate();
          } finally {
            this.activatingFromListbox = false;
          }
        }
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.getSlottedMenuItems(),
      orientation: 'vertical',
      loop: true,
      container: () => this,
      onActiveChange: (_item, index) => {
        const items = this.getSlottedMenuItems();
        items.forEach((el, i) => {
          el.active = i === index;
        });
      },
    });
  }

  get lastPositioningResult(): PositioningResult | null {
    return this.positioningCtrl.lastResult;
  }

  protected override onFirstConnect(): void {
    this.syncMenuItems();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('forceFallback')) {
      this.overlayCtrl.updateOptions({
        forceFallback: this.forceFallback,
      });
    }

    if (
      changedProperties.has('placement') ||
      changedProperties.has('offset') ||
      changedProperties.has('forceFallback') ||
      changedProperties.has('anchor')
    ) {
      this.positioningCtrl.updateOptions({
        placement: this.placement,
        offset: this.offset,
        forceFallback: this.forceFallback,
      });
    }

    if (changedProperties.has('roleMode')) {
      this.syncMenuItems();
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('open') && !this.syncingFromController) {
      if (this.open && !this.overlayCtrl.open) {
        void this.show();
      } else if (!this.open && this.overlayCtrl.open) {
        void this.hide('programmatic');
      }
    }
  }

  async show(): Promise<boolean> {
    await this.updateComplete;
    const opened = await this.overlayCtrl.show();
    if (!opened) {
      this.syncingFromController = true;
      this.open = false;
      this.syncingFromController = false;
    } else {
      this.positioningCtrl.reposition();
      this.syncMenuItems();
    }
    return opened;
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    const closed = await this.overlayCtrl.hide(reason);
    if (!closed) {
      this.syncingFromController = true;
      this.open = true;
      this.syncingFromController = false;
    }
    return closed;
  }

  toggle(): Promise<boolean> {
    return this.open ? this.hide('programmatic') : this.show();
  }

  getSlottedMenuItems(): ReadonlyArray<MenuItemElementLike> {
    return this.slotCtrl.items;
  }

  private getSlottedTrigger(): HTMLElement | null {
    const slot = this.triggerSlotEl;
    if (!slot) return null;
    const assigned = slot.assignedElements({ flatten: true });
    return (assigned[0] as HTMLElement | undefined) ?? null;
  }

  private resolveAnchor(): PositioningAnchor | null {
    if (this.anchor) return this.anchor;
    return this.getSlottedTrigger() ?? this.anchorWrapperEl ?? this;
  }

  private syncMenuItems(): void {
    const items = this.getSlottedMenuItems();
    const desiredRole = this.roleMode === 'listbox' ? 'option' : 'auto';
    items.forEach((item) => {
      if (item.itemRole !== desiredRole) {
        item.itemRole = desiredRole;
      }
    });

    this.listboxCtrl.setOptions(
      items.map((item, idx) => ({
        id: item.id || '',
        value: item.value || item.getAttribute('value') || String(idx),
        label: item.textContent?.trim() ?? '',
        disabled: Boolean(item.disabled || item.hasAttribute('disabled')),
        element: item,
      })),
    );
    this.rovingCtrl.syncTabIndices();
  }

  private closeAllSubmenus(): void {
    for (const item of this.getSlottedMenuItems()) {
      item.closeSubmenu?.(false);
    }
  }

  private readonly handleTriggerClick = (): void => {
    void this.toggle();
  };

  private isSubmenuEventTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    const submenuRoot = target.closest('[slot="submenu"]');
    return submenuRoot !== null && this.contains(submenuRoot);
  }

  private readonly handleListFocusIn = (event: FocusEvent): void => {
    if (this.isSubmenuEventTarget(event.target)) return;
    const items = this.getSlottedMenuItems();
    const target = event.target as Node | null;
    const idx = items.findIndex((item) => item === target || item.contains(target));
    if (idx >= 0 && this.listboxCtrl.activeIndex !== idx) {
      this.activatingFromListbox = true;
      try {
        this.listboxCtrl.setActiveIndex(idx);
      } finally {
        this.activatingFromListbox = false;
      }
    }
  };

  private readonly handleListKeyDown = (event: KeyboardEvent): void => {
    if (this.isSubmenuEventTarget(event.target)) return;
    const items = this.getSlottedMenuItems();
    if (this.listboxCtrl.activeIndex === -1 && event.target instanceof Element) {
      const idx = items.findIndex((item) => item === event.target);
      if (idx >= 0) {
        this.listboxCtrl.setActiveIndex(idx);
      }
    }

    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      // ListboxController on this same element handles vertical roving navigation;
      // prevent bubbling to host RovingFocusController so it does not double-advance.
      event.stopPropagation();
    }
  };

  private readonly handleItemSelect = (event: Event): void => {
    const targetItem = event.target as MenuItemElementLike | null;
    if (!targetItem) return;

    const items = this.getSlottedMenuItems();
    const isTopLevelItem = items.includes(targetItem);

    if (isTopLevelItem && targetItem.type === 'radio') {
      const groupName = targetItem.group ?? '';
      for (const sibling of items) {
        if (sibling !== targetItem && sibling.type === 'radio' && (sibling.group ?? '') === groupName) {
          sibling.checked = false;
        }
      }
    }

    if (!this.activatingFromListbox) {
      this.activatingFromListbox = true;
      try {
        const val = targetItem.value || targetItem.getAttribute('value') || '';
        if (val) {
          this.listboxCtrl.setSelectedValues([val]);
        }
      } finally {
        this.activatingFromListbox = false;
      }
    }

    if (this.closeOnSelect && targetItem.type !== 'checkbox') {
      void this.hide('programmatic');
    }
  };

  private applyPositionSheet(result: PositioningResult): void {
    const root = this.shadowRoot;
    const surface = this.surfaceEl;
    const anchorWrapper = this.anchorWrapperEl;

    let cssRules = '';
    if (result.strategy === 'css-anchor' && surface) {
      const anchorName = surface.style.getPropertyValue('position-anchor');
      const positionArea = surface.style.getPropertyValue('position-area');
      const tryFallbacks = surface.style.getPropertyValue('position-try-fallbacks');

      if (anchorWrapper && anchorWrapper.style.getPropertyValue('anchor-name')) {
        const wrapperAnchorName = anchorWrapper.style.getPropertyValue('anchor-name');
        cssRules += `#mth-dropdown-menu-anchor { anchor-name: ${wrapperAnchorName}; }\n`;
        anchorWrapper.removeAttribute('style');
      }

      cssRules += `#mth-dropdown-menu-surface {\n  position: fixed;\n`;
      if (anchorName) cssRules += `  position-anchor: ${anchorName};\n`;
      if (positionArea) cssRules += `  position-area: ${positionArea};\n`;
      if (tryFallbacks) cssRules += `  position-try-fallbacks: ${tryFallbacks};\n`;
      cssRules += `}\n`;
    } else {
      cssRules += `#mth-dropdown-menu-surface {\n  position: fixed;\n  inset-inline-start: ${result.x}px;\n  inset-block-start: ${result.y}px;\n}\n`;
    }

    surface?.removeAttribute('style');

    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }

    if (!this.positionSheet) {
      this.positionSheet = new CSSStyleSheet();
    }
    if (typeof this.positionSheet.replaceSync === 'function') {
      this.positionSheet.replaceSync(cssRules);
      if (!root.adoptedStyleSheets.includes(this.positionSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.positionSheet];
      }
    }
  }

  private clearPositionSheet(): void {
    const root = this.shadowRoot;
    if (root && 'adoptedStyleSheets' in root && this.positionSheet) {
      root.adoptedStyleSheets = root.adoptedStyleSheets.filter((s) => s !== this.positionSheet);
    }
  }

  override render() {
    const ariaLabel = this.label || this.t('menuLabel');

    return html`
      <span
        id="mth-dropdown-menu-anchor"
        part="anchor"
        class="anchor"
        @click=${this.handleTriggerClick}
      >
        <slot name="trigger"></slot>
      </span>
      <div
        id="mth-dropdown-menu-surface"
        part="base"
        class="surface"
        popover=${this.fallbackActive ? nothing : 'manual'}
        ?hidden=${!this.open}
      >
        <div
          id="mth-dropdown-menu-list"
          part="menu"
          class="menu-list"
          role=${this.roleMode}
          aria-label=${ariaLabel}
          tabindex="-1"
          @focusin=${this.handleListFocusIn}
          @keydown=${this.handleListKeyDown}
          @mth-select=${this.handleItemSelect}
        >
          <slot></slot>
        </div>
      </div>
    `;
  }
}
