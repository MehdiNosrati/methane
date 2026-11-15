import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  OverlayController,
  PositioningController,
  type OverlayCloseReason,
  type PositioningResult,
  type VirtualAnchor,
} from '@methane-ui/primitives';
import { html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { contextMenuMessages } from './context-menu.messages.js';
import type { ContextMenuItem } from './context-menu.spec.js';
import { contextMenuStyles } from './context-menu.styles.js';

export type { ContextMenuItem };

const EMPTY_CONTEXT_MENU_ITEMS: ReadonlyArray<ContextMenuItem> = Object.freeze([]);

function createPointAnchor(x: number, y: number): VirtualAnchor {
  return {
    getBoundingClientRect: () =>
      ({
        x,
        y,
        width: 0,
        height: 0,
        top: y,
        left: x,
        right: x,
        bottom: y,
        toJSON: () => ({ x, y, width: 0, height: 0, top: y, left: x, right: x, bottom: y }),
      }) as DOMRect,
  };
}

/**
 * `<mth-context-menu>`: Virtual-anchor context menu using `OverlayController` and
 * `PositioningController`, supporting nested submenus and right-click / programmatic open.
 */
export class MthContextMenu extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = contextMenuMessages;
  static override styles = [contextMenuStyles];

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'force-fallback' })
  forceFallback = false;

  @property({ attribute: false })
  items: ReadonlyArray<ContextMenuItem> = EMPTY_CONTEXT_MENU_ITEMS;

  @state()
  private openSubmenuPath: ReadonlyArray<string> = [];

  @query('#mth-cm-popup')
  private popupEl!: HTMLElement | null;

  @query('#mth-cm-menu')
  private menuEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private virtualAnchor: VirtualAnchor = createPointAnchor(0, 0);
  private syncingOpen = false;
  private isHydratingSync = false;

  constructor() {
    super();

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.popupEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      forceFallback: this.forceFallback,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingOpen = true;
        this.open = nextOpen;
        this.syncingOpen = false;
        this.setCustomState('open', nextOpen);
        if (!nextOpen) {
          this.openSubmenuPath = [];
          this.positioningCtrl.stop();
        }
        this.requestUpdate();
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.virtualAnchor,
      floating: () => this.popupEl,
      placement: 'bottom-start',
      offset: 2,
      flip: true,
      shift: true,
      forceFallback: this.forceFallback,
    });
  }

  get lastPositioningResult(): PositioningResult | null {
    return this.positioningCtrl.lastResult;
  }

  async openAt(x: number, y: number): Promise<boolean> {
    this.virtualAnchor = createPointAnchor(x, y);
    this.positioningCtrl.updateOptions({
      anchor: () => this.virtualAnchor,
      forceFallback: this.forceFallback,
    });
    return this.show();
  }

  async show(): Promise<boolean> {
    await this.updateComplete;
    const opened = await this.overlayCtrl.show();
    if (opened) {
      this.syncingOpen = true;
      this.open = true;
      this.syncingOpen = false;
      this.positioningCtrl.updateOptions({
        anchor: () => this.virtualAnchor,
        forceFallback: this.forceFallback,
      });
      await this.positioningCtrl.start();
      const firstItem = this.menuEl?.querySelector<HTMLElement>(
        '[part="item"]:not([aria-disabled="true"])',
      );
      firstItem?.focus();
    }
    return opened;
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    const closed = await this.overlayCtrl.hide(reason);
    if (closed) {
      this.syncingOpen = true;
      this.open = false;
      this.syncingOpen = false;
      this.openSubmenuPath = [];
      this.positioningCtrl.stop();
    }
    return closed;
  }

  protected override onFirstConnect(): void {
    this.isHydratingSync = true;
    this.setCustomState('open', this.open);
    this.isHydratingSync = false;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('forceFallback')) {
      this.overlayCtrl.updateOptions({ forceFallback: this.forceFallback });
      this.positioningCtrl.updateOptions({ forceFallback: this.forceFallback });
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('open') && !this.syncingOpen && !this.isHydratingSync) {
      if (this.open) {
        void this.show();
      } else {
        void this.hide('programmatic');
      }
    }
  }

  private isRtl(): boolean {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl';
  }

  private handleTargetContextMenu(event: MouseEvent): void {
    event.preventDefault();
    void this.openAt(event.clientX, event.clientY);
  }

  private isSubmenuOpen(pathKey: string): boolean {
    return this.openSubmenuPath.some((p) => p === pathKey);
  }

  private openSubmenu(openKeys: ReadonlyArray<string>, focusFirst: boolean): void {
    this.openSubmenuPath = openKeys;
    if (focusFirst) {
      const targetKey = openKeys[openKeys.length - 1] ?? '';
      void this.updateComplete.then(() => {
        const subMenu = this.shadowRoot?.querySelector<HTMLElement>(
          `[data-submenu-path="${CSS.escape(targetKey)}"]`,
        );
        const first = subMenu?.querySelector<HTMLElement>(
          '[part="item"]:not([aria-disabled="true"])',
        );
        first?.focus();
      });
    }
  }

  private handleItemActivate(item: ContextMenuItem, path: ReadonlyArray<string>): void {
    if (item.disabled) return;
    if (item.children && item.children.length > 0) {
      const key = path.join('>');
      if (this.isSubmenuOpen(key)) {
        this.openSubmenuPath = this.openSubmenuPath.filter((p) => !p.startsWith(key));
      } else {
        this.openSubmenu([...this.openSubmenuPath.filter((p) => !p.startsWith(key)), key], false);
      }
      return;
    }

    void this.hide('programmatic');
    this.emitEvent('mth-select', {
      detail: { value: item.value, label: item.label },
    });
  }

  private handleMenuKeyDown(
    event: KeyboardEvent,
    menuItems: ReadonlyArray<ContextMenuItem>,
    parentPath: ReadonlyArray<string>,
  ): void {
    const scopeSelector =
      parentPath.length === 0
        ? '#mth-cm-menu'
        : `[data-submenu-path="${CSS.escape(parentPath.join('>'))}"]`;
    const menuRoot = this.shadowRoot?.querySelector<HTMLElement>(scopeSelector);
    if (!menuRoot) return;

    const directItems = Array.from(menuRoot.children)
      .map((row) =>
        Array.from(row.children).find(
          (child): child is HTMLElement => child.getAttribute('part') === 'item',
        ) ?? null,
      )
      .filter(
        (el): el is HTMLElement => el !== null && el.getAttribute('aria-disabled') !== 'true',
      );
    if (directItems.length === 0) return;

    const eventTarget =
      event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[part="item"]') : null;
    const shadowActive = this.shadowRoot?.activeElement as HTMLElement | null;
    const active =
      (eventTarget && directItems.includes(eventTarget) ? eventTarget : null) ??
      (shadowActive && directItems.includes(shadowActive) ? shadowActive : null);
    const currentIdx = active ? directItems.indexOf(active) : -1;
    const rtl = this.isRtl();
    const openSubKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const closeSubKey = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      directItems[(currentIdx + 1) % directItems.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      directItems[(currentIdx - 1 + directItems.length) % directItems.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      event.stopPropagation();
      directItems[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      event.stopPropagation();
      directItems[directItems.length - 1]?.focus();
    } else if (event.key === openSubKey && active) {
      const value = active.dataset['value'];
      const matched = menuItems.find((i) => i.value === value);
      if (matched?.children?.length) {
        event.preventDefault();
        event.stopPropagation();
        const nextPath = [...parentPath, matched.value];
        const key = nextPath.join('>');
        this.openSubmenu([...this.openSubmenuPath.filter((p) => !p.startsWith(key)), key], true);
      }
    } else if (event.key === closeSubKey && parentPath.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      const closingKey = parentPath.join('>');
      this.openSubmenuPath = this.openSubmenuPath.filter((p) => !p.startsWith(closingKey));
      const parentVal = parentPath[parentPath.length - 1] ?? '';
      const parentBtn = this.shadowRoot?.querySelector<HTMLElement>(
        `[part="item"][data-value="${CSS.escape(parentVal)}"]`,
      );
      parentBtn?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      void this.hide('escape');
    }
  }

  private renderItems(
    items: ReadonlyArray<ContextMenuItem>,
    parentPath: ReadonlyArray<string>,
  ): Array<TemplateResult> {
    return items.map((item) => {
      if (item.separator) {
        return html`<div part="separator" role="separator"></div>`;
      }
      const nextPath = [...parentPath, item.value];
      const pathKey = nextPath.join('>');
      const hasChildren = Boolean(item.children && item.children.length > 0);
      const subOpen = hasChildren && this.isSubmenuOpen(pathKey);
      const subId = `mth-cm-sub-${pathKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

      return html`
        <div class="cm-row" role="none">
          <button
            part="item"
            type="button"
            role="menuitem"
            data-value=${item.value}
            ?disabled=${Boolean(item.disabled)}
            aria-disabled=${item.disabled ? 'true' : nothing}
            aria-haspopup=${hasChildren ? 'menu' : nothing}
            aria-expanded=${hasChildren ? (subOpen ? 'true' : 'false') : nothing}
            aria-controls=${hasChildren ? subId : nothing}
            @click=${() => this.handleItemActivate(item, nextPath)}
          >
            <span>${item.label}</span>
            ${item.shortcut ? html`<span part="shortcut">${item.shortcut}</span>` : nothing}
            ${hasChildren ? html`<span aria-hidden="true">▸</span>` : nothing}
          </button>

          ${hasChildren
            ? html`
                <div
                  id=${subId}
                  part="submenu"
                  role="menu"
                  aria-label=${item.label}
                  data-submenu-path=${pathKey}
                  ?hidden=${!subOpen}
                  @keydown=${(e: KeyboardEvent) =>
                    this.handleMenuKeyDown(e, item.children!, nextPath)}
                >
                  ${this.renderItems(item.children!, nextPath)}
                </div>
              `
            : nothing}
        </div>
      `;
    });
  }

  protected override render() {
    const menuLabel = this.label.trim() || this.t('menuLabel');

    return html`
      <div part="target" @contextmenu=${this.handleTargetContextMenu}>
        <slot></slot>
      </div>

      <div id="mth-cm-popup" part="popup" popover="manual" ?hidden=${!this.open}>
        <div
          id="mth-cm-menu"
          part="menu"
          role="menu"
          aria-label=${menuLabel}
          @keydown=${(e: KeyboardEvent) => this.handleMenuKeyDown(e, this.items, [])}
        >
          ${this.renderItems(this.items, [])}
        </div>
      </div>
    `;
  }
}
