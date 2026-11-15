import { UIElement, type PropertyValues, html, property, query } from '@methane/core';
import {
  MotionController,
  OverlayController,
  RovingFocusController,
  SlotCollectionController,
} from '@methane/primitives';
import { speedDialMessages } from './speed-dial.messages.js';
import { speedDialStyles } from './speed-dial.styles.js';

export type MthSpeedDialDirection = 'up' | 'down' | 'start' | 'end';
export type MthSpeedDialVariant = 'primary' | 'surface' | 'secondary';
export type MthSpeedDialSize = 'sm' | 'md' | 'lg';

export interface MthSpeedDialAction {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

/**
 * Speed dial floating action menu with roving keyboard navigation and Escape focus restoration.
 */
export class MthSpeedDial extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = speedDialStyles;
  static override messages = speedDialMessages;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  direction: MthSpeedDialDirection = 'up';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, reflect: true })
  variant: MthSpeedDialVariant = 'primary';

  @property({ type: String, reflect: true })
  size: MthSpeedDialSize = 'md';

  @property({ attribute: false })
  actions: ReadonlyArray<MthSpeedDialAction> = [];

  @query('[part="trigger"]')
  private triggerEl!: HTMLButtonElement | null;

  @query('#mth-sd-actions')
  private actionsEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly rovingCtrl: RovingFocusController;
  private readonly motionCtrl: MotionController;
  private readonly slotCtrl: SlotCollectionController<HTMLElement>;

  constructor() {
    super();
    this.motionCtrl = new MotionController(this, {
      target: () => this.actionsEl,
      enterKeyframes: [{ opacity: 0 }, { opacity: 1 }],
      exitKeyframes: [{ opacity: 1 }, { opacity: 0 }],
      durationMs: 120,
    });

    this.slotCtrl = new SlotCollectionController<HTMLElement>(this, {
      selector: 'button, [role="menuitem"], a',
      onItemsChange: () => {
        this.rovingCtrl.syncTabIndices();
      },
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      surface: () => this.actionsEl,
      trigger: () => (this.shadowRoot?.activeElement === this.triggerEl ? this.triggerEl : null),
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (open) => {
        this.open = open;
        this.syncStates();
        if (open) {
          this.rovingCtrl.syncTabIndices();
        }
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.getActionElements(),
      orientation: 'vertical',
      loop: true,
      dir: this.resolvedDir,
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStates();
    this.syncRovingOrientation();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncStates();
    if (changed.has('direction')) {
      this.syncRovingOrientation();
    }
    if (changed.has('actions') || changed.has('open')) {
      this.rovingCtrl.syncTabIndices();
    }
  }

  /**
   * Expands the speed-dial action menu.
   */
  async show(): Promise<void> {
    if (this.disabled) return;
    await this.overlayCtrl.show();
  }

  /**
   * Collapses the speed-dial action menu.
   */
  async hide(reason: 'escape' | 'outside' | 'programmatic' | 'invoker' = 'programmatic'): Promise<void> {
    await this.overlayCtrl.hide(reason);
  }

  private syncStates(): void {
    this.setCustomState('open', this.open);
    this.setCustomState('disabled', this.disabled);
  }

  private syncRovingOrientation(): void {
    const orientation =
      this.direction === 'start' || this.direction === 'end' ? 'horizontal' : 'vertical';
    this.rovingCtrl.updateOptions({
      orientation,
      dir: this.resolvedDir,
    });
  }

  private getActionElements(): HTMLElement[] {
    if (this.actions.length > 0 && this.actionsEl) {
      return Array.from(this.actionsEl.querySelectorAll<HTMLElement>('[part="action"]'));
    }
    return this.slotCtrl.slottedElements.filter(
      (el) => !(el as HTMLButtonElement).disabled && el.getAttribute('aria-disabled') !== 'true',
    );
  }

  private readonly handleTriggerClick = (): void => {
    if (this.disabled) return;
    if (this.open) {
      void this.hide('invoker');
    } else {
      void this.show();
    }
  };

  private readonly handleActionClick = (action: MthSpeedDialAction): void => {
    if (this.disabled || action.disabled) return;
    this.emitEvent('mth-select', {
      detail: { value: action.value, label: action.label },
    });
    void this.hide('programmatic');
  };

  override render() {
    const triggerLabel = this.label.trim() || this.t('triggerLabel');
    const actionsLabel = this.t('actionsLabel');
    const reduced = this.motionCtrl.isReducedMotion;

    return html`
      <div part="base" data-reduced-motion=${reduced ? 'true' : 'false'}>
        <button
          part="trigger"
          type="button"
          aria-label=${triggerLabel}
          aria-haspopup="menu"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="mth-sd-actions"
          ?disabled=${this.disabled}
          @click=${this.handleTriggerClick}
        >
          <slot name="icon">+</slot>
        </button>
        <div
          id="mth-sd-actions"
          part="actions"
          role="menu"
          aria-label=${actionsLabel}
          ?hidden=${!this.open}
        >
          ${this.actions.map(
            (action) => html`
              <button
                part="action"
                type="button"
                role="menuitem"
                ?disabled=${Boolean(action.disabled)}
                @click=${() => this.handleActionClick(action)}
              >
                ${action.label}
              </button>
            `,
          )}
          <slot></slot>
        </div>
      </div>
    `;
  }
}
