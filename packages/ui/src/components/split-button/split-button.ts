import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  OverlayController,
  PositioningController,
  RovingFocusController,
} from '@methane-ui/primitives';
import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { splitButtonMessages } from './split-button.messages.js';
import { splitButtonStyles } from './split-button.styles.js';

export type MthSplitButtonVariant = 'solid' | 'soft' | 'outline' | 'outlined' | 'ghost';
export type MthSplitButtonSize = 'sm' | 'md' | 'lg';

export interface MthSplitButtonItem {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

/**
 * `<mth-split-button>`: primary action button paired with an anchored secondary options menu.
 */
export class MthSplitButton extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = splitButtonMessages;
  static override styles = splitButtonStyles;

  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  variant: MthSplitButtonVariant = 'solid';

  @property({ type: String, reflect: true })
  size: MthSplitButtonSize = 'md';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, attribute: 'menu-label' })
  menuLabel = '';

  @property({ attribute: false })
  items: ReadonlyArray<MthSplitButtonItem> = [];

  @query('[part="group"]')
  private groupEl!: HTMLElement | null;

  @query('[part="trigger"]')
  private triggerEl!: HTMLButtonElement | null;

  @query('#mth-sb-menu')
  private menuEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      surface: () => this.menuEl,
      trigger: () => (this.shadowRoot?.activeElement === this.triggerEl ? this.triggerEl : null),
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (open) => {
        this.open = open;
        this.syncStates();
        if (open) {
          this.positioningCtrl.reposition();
          this.rovingCtrl.syncTabIndices();
        }
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.groupEl,
      floating: () => this.menuEl,
      placement: 'bottom-end',
      offset: 4,
      autoUpdate: true,
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.getMenuButtons(),
      orientation: 'vertical',
      loop: true,
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStates();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncStates();
    if (changed.has('open')) {
      if (this.open && !this.disabled) {
        this.positioningCtrl.reposition();
      }
    }
  }

  async show(): Promise<void> {
    if (this.disabled) return;
    await this.overlayCtrl.show();
  }

  async hide(reason: 'escape' | 'outside' | 'programmatic' | 'invoker' = 'programmatic'): Promise<void> {
    await this.overlayCtrl.hide(reason);
  }

  private getMenuButtons(): HTMLElement[] {
    const shadowButtons = this.menuEl
      ? Array.from(this.menuEl.querySelectorAll<HTMLElement>('[role="menuitem"]'))
      : [];
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="menu"]');
    const slotted: HTMLElement[] = [];
    if (slot) {
      for (const el of slot.assignedElements({ flatten: true })) {
        if (!(el instanceof HTMLElement)) continue;
        if (el.matches('[role="menuitem"], button, a')) {
          slotted.push(el);
        } else {
          slotted.push(...Array.from(el.querySelectorAll<HTMLElement>('[role="menuitem"], button, a')));
        }
      }
    }
    return [...shadowButtons, ...slotted];
  }

  private syncStates(): void {
    this.setCustomState('open', this.open);
    this.setCustomState('disabled', this.disabled);
  }

  private readonly handlePrimaryClick = (event: MouseEvent): void => {
    if (this.disabled) {
      event.preventDefault();
      return;
    }
    this.emitEvent('mth-press', {
      detail: { originalEvent: event },
      cancelable: true,
    });
  };

  private readonly handleTriggerClick = (): void => {
    if (this.disabled) return;
    if (this.open) {
      void this.hide('invoker');
    } else {
      void this.show();
    }
  };

  private readonly handleTriggerKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled) return;
    if (event.key === 'ArrowDown' && !this.open) {
      event.preventDefault();
      void this.show().then(() => {
        this.rovingCtrl.setActiveIndex(0, true);
      });
    }
  };

  private readonly handleItemClick = (item: MthSplitButtonItem): void => {
    if (item.disabled || this.disabled) return;
    this.emitEvent('mth-select', {
      detail: { value: item.value, label: item.label },
    });
    void this.hide('programmatic');
  };

  override render() {
    const toggleAriaLabel = this.menuLabel.trim() || this.t('moreOptions');

    return html`
      <div part="base">
        <div part="group">
          <button
            part="primary"
            type="button"
            ?disabled=${this.disabled}
            @click=${this.handlePrimaryClick}
          >
            <slot>${this.label}</slot>
          </button>
          <button
            part="trigger"
            type="button"
            aria-haspopup="menu"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls="mth-sb-menu"
            aria-label=${toggleAriaLabel}
            ?disabled=${this.disabled}
            @click=${this.handleTriggerClick}
            @keydown=${this.handleTriggerKeyDown}
          >
            <svg
              part="caret-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m4 6 4 4 4-4" />
            </svg>
          </button>
        </div>
        <div
          id="mth-sb-menu"
          part="menu"
          role="menu"
          ?hidden=${!this.open}
        >
          ${this.items.map(
            (item) => html`
              <button
                part="item"
                type="button"
                role="menuitem"
                ?disabled=${Boolean(item.disabled)}
                @click=${() => this.handleItemClick(item)}
              >
                ${item.label}
              </button>
            `,
          )}
          <slot name="menu" @slotchange=${() => this.rovingCtrl.syncTabIndices()}></slot>
        </div>
      </div>
    `;
  }
}
