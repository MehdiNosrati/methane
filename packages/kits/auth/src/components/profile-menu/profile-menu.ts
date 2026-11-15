import { UIElement, html, nothing, property, query, type PropertyValues } from '@methane/core';
import {
  OverlayController,
  PositioningController,
  RovingFocusController,
  type OverlayCloseReason,
  type Placement,
  type PositioningResult,
} from '@methane/primitives';
import type { MthIconName } from '@methane/ui/icon/element.js';
import { profileMenuMessages } from './profile-menu.messages.js';
import { profileMenuStyles } from './profile-menu.styles.js';

const ANCHOR_NAME_RE = /^--[A-Za-z0-9_-]+$/;

export interface ProfileMenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: MthIconName;
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly separatorBefore?: boolean;
}

/**
 * `<mth-profile-menu>`: authenticated profile trigger and floating menu using
 * `OverlayController`, `PositioningController`, and `RovingFocusController`.
 */
export class MthProfileMenu extends UIElement {
  static override messages = profileMenuMessages;
  static override styles = profileMenuStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  name = '';

  @property({ type: String })
  email = '';

  @property({ type: String, attribute: 'avatar-src' })
  avatarSrc = '';

  @property({ type: String, attribute: 'user-role' })
  userRole = '';

  @property({ attribute: false })
  items: ReadonlyArray<ProfileMenuItem> = [];

  @property({ type: String, reflect: true })
  placement: Placement = 'bottom-end';

  @property({ type: Number })
  offset = 8;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ attribute: false })
  externalTrigger: HTMLElement | null = null;

  @query('#mth-pm-trigger')
  private readonly triggerBtnEl?: HTMLButtonElement;

  @query('#mth-pm-surface')
  private readonly surfaceEl?: HTMLElement;

  private syncingFromController = false;
  private positionSheet: CSSStyleSheet | null = null;

  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.surfaceEl ?? null,
      trigger: () => this.externalTrigger ?? this.triggerBtnEl ?? null,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.syncingFromController = false;
        this.setCustomState('open', nextOpen);

        if (nextOpen) {
          this.positioningCtrl.start();
          this.rovingCtrl.syncTabIndices();
        } else {
          this.positioningCtrl.stop();
          this.clearPositionSheet();
        }
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.externalTrigger ?? this.triggerBtnEl ?? this,
      floating: () => this.surfaceEl ?? null,
      placement: this.placement,
      offset: Number.isFinite(this.offset) ? this.offset : 8,
      flip: true,
      shift: true,
      onPosition: (result) => {
        this.applyPositionSheet(result);
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.getMenuItems(),
      orientation: 'vertical',
      loop: true,
      dir: this.resolvedDir,
    });
  }

  private resolveEffectiveDir(): 'ltr' | 'rtl' {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl'
      ? 'rtl'
      : 'ltr';
  }

  getMenuItems(): HTMLButtonElement[] {
    if (!this.open || !this.shadowRoot) return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLButtonElement>('[part="item"]'));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.open && this.hasUpdated) {
      this.positioningCtrl.reposition();
    }
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('placement') || changedProperties.has('offset')) {
      this.positioningCtrl.updateOptions({
        placement: this.placement,
        offset: Number.isFinite(this.offset) ? this.offset : 8,
      });
    }
    this.rovingCtrl.updateOptions({
      dir: this.resolveEffectiveDir(),
    });
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
    if (this.disabled) return false;
    await this.updateComplete;
    const opened = await this.overlayCtrl.show();
    if (!opened) {
      this.syncingFromController = true;
      this.open = false;
      this.syncingFromController = false;
    } else {
      this.positioningCtrl.reposition();
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

  private applyPositionSheet(result: PositioningResult): void {
    const root = this.shadowRoot;
    const surface = this.surfaceEl;

    let cssRules = '';
    if (result.strategy === 'css-anchor' && surface) {
      const rawAnchorName = surface.style.getPropertyValue('position-anchor').trim();
      const anchorName = ANCHOR_NAME_RE.test(rawAnchorName) ? rawAnchorName : '';
      const positionArea = surface.style.getPropertyValue('position-area').trim();
      const tryFallbacks = surface.style.getPropertyValue('position-try-fallbacks').trim();
      cssRules += `#mth-pm-surface {\n  position: fixed;\n`;
      if (anchorName) cssRules += `  position-anchor: ${anchorName};\n`;
      if (positionArea) cssRules += `  position-area: ${positionArea};\n`;
      if (tryFallbacks) cssRules += `  position-try-fallbacks: ${tryFallbacks};\n`;
      cssRules += `}\n`;
    } else if (Number.isFinite(result.x) && Number.isFinite(result.y)) {
      cssRules += `#mth-pm-surface {\n  position: fixed;\n  inset-inline-start: ${result.x}px;\n  inset-block-start: ${result.y}px;\n}\n`;
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
    if (this.positionSheet && typeof this.positionSheet.replaceSync === 'function') {
      this.positionSheet.replaceSync('');
    }
  }

  private handleTriggerClick(): void {
    if (this.disabled) return;
    void this.toggle();
  }

  private handleItemSelect(item: ProfileMenuItem): void {
    if (this.disabled || item.disabled) return;
    this.emitEvent('mth-select', {
      detail: {
        id: item.id,
        label: item.label,
        item,
      },
    });
    void this.hide('programmatic');
  }

  override render() {
    const ariaLabel = this.name
      ? this.t('signedInAs', { name: this.name })
      : this.t('menuLabel');

    return html`
      <div class="wrapper" dir=${this.resolveEffectiveDir()}>
        <button
          id="mth-pm-trigger"
          type="button"
          part="trigger"
          class="trigger-btn"
          aria-haspopup="menu"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="mth-pm-surface"
          aria-label=${ariaLabel}
          ?disabled=${this.disabled}
          @click=${this.handleTriggerClick}
        >
          <mth-avatar
            name=${this.name || 'User'}
            src=${this.avatarSrc}
            size="sm"
          ></mth-avatar>
          ${this.name ? html`<span class="trigger-name">${this.name}</span>` : nothing}
          <mth-icon name="chevron-down" aria-hidden="true"></mth-icon>
        </button>

        <div
          id="mth-pm-surface"
          part="menu"
          class="menu-surface"
          popover="manual"
          role="menu"
          aria-label=${ariaLabel}
          ?hidden=${!this.open}
        >
          ${this.name || this.email || this.userRole
            ? html`
                <div class="account-header">
                  <div class="account-top">
                    <span class="account-name">${this.name}</span>
                    ${this.userRole
                      ? html`<mth-badge variant="info">${this.userRole}</mth-badge>`
                      : nothing}
                  </div>
                  ${this.email ? html`<span class="account-email">${this.email}</span>` : nothing}
                </div>
              `
            : nothing}

          <div class="menu-items">
            ${this.items.map(
              (item, index) => html`
                ${item.separatorBefore
                  ? html`<div class="menu-separator" role="separator"></div>`
                  : nothing}
                <button
                  type="button"
                  part="item"
                  class="menu-item"
                  role="menuitem"
                  tabindex=${index === 0 ? 0 : -1}
                  data-danger=${item.danger ? 'true' : 'false'}
                  ?disabled=${item.disabled || this.disabled}
                  @click=${() => this.handleItemSelect(item)}
                >
                  ${item.icon
                    ? html`<mth-icon name=${item.icon} aria-hidden="true"></mth-icon>`
                    : nothing}
                  <span>${item.label}</span>
                </button>
              `,
            )}
          </div>

          <slot></slot>
        </div>
      </div>
    `;
  }
}
