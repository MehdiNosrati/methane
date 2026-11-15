import { UIElement, type PropertyValues } from '@methane/core';
import {
  FocusTrapController,
  OverlayController,
  type MotionControllerOptions,
  type MotionPhase,
  type OverlayCloseReason,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { dialogMessages } from './dialog.messages.js';
import { dialogStyles } from './dialog.styles.js';

export type MthDialogVariant = 'default' | 'alert' | 'confirm' | 'prompt';

/**
 * `<mth-dialog>`: modal and non-modal overlay wrapping native `<dialog>` with
 * top-layer + fallback positioning (`OverlayController`), composed-tree focus trap
 * (`FocusTrapController`), cancelable `mth-open`/`mth-close` transitions
 * (`MotionController`), and `default | alert | confirm | prompt` variants.
 */
export class MthDialog extends UIElement {
  static override messages = dialogMessages;
  static override styles = dialogStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  modal = true;

  @property({ type: String, reflect: true })
  variant: MthDialogVariant = 'default';

  @property({ type: String })
  label = '';

  @property({ type: String })
  description = '';

  @property({ type: String, attribute: 'prompt-value' })
  promptValue = '';

  @property({ type: Boolean, attribute: 'close-on-escape', reflect: true })
  closeOnEscape = true;

  @state()
  private hasSlottedHeader = false;

  @state()
  private _motionPhase: MotionPhase = 'closed';

  @query('#mth-dialog-surface')
  private dialogEl!: HTMLDialogElement | null;

  @query('.popup')
  private popupEl!: HTMLElement | null;

  @query('#mth-dialog-prompt')
  private promptInputEl!: HTMLInputElement | null;

  private lastCloseReason: string = 'programmatic';
  private syncingFromController = false;

  private readonly overlayCtrl: OverlayController;
  private readonly focusTrapCtrl: FocusTrapController;

  constructor() {
    super();

    const motionOptions: MotionControllerOptions = {
      target: () => this.popupEl ?? this.dialogEl,
      enterKeyframes: [
        { opacity: 0, transform: 'scale(0.96)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      exitKeyframes: [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.96)' },
      ],
      durationMs: 160,
      respectReducedMotion: true,
      onPhaseChange: (phase) => {
        this._motionPhase = phase;
      },
    };

    this.overlayCtrl = new OverlayController(this, {
      mode: 'dialog',
      surface: () => this.dialogEl,
      closeOnEscape: true,
      lightDismiss: false,
      restoreFocus: true,
      motion: motionOptions,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.syncingFromController = false;

        if (nextOpen) {
          this.setCustomState('open', true);
          if (this.modal) {
            this.focusTrapCtrl.activate();
            if (this.variant === 'prompt' && this.promptInputEl) {
              this.promptInputEl.focus();
            }
          }
        } else {
          this.focusTrapCtrl.deactivate();
          this.setCustomState('open', false);
        }
      },
    });

    this.focusTrapCtrl = new FocusTrapController(this, {
      container: () => this.dialogEl,
      restoreFocus: false,
    });
  }

  get motionPhase(): MotionPhase {
    return this._motionPhase;
  }

  get returnValue(): string {
    return this.variant === 'prompt' ? this.promptValue : this.lastCloseReason;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncHostRole();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('variant')) {
      this.syncHostRole();
    }
    if (changedProperties.has('modal') || changedProperties.has('closeOnEscape') || changedProperties.has('variant')) {
      this.overlayCtrl.updateOptions({
        mode: this.modal ? 'dialog' : 'non-modal',
        closeOnEscape: this.closeOnEscape,
        lightDismiss: !this.modal && this.variant !== 'alert',
      });
      this.setCustomState('modal', this.modal);
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
    }
    return opened;
  }

  async hide(reason: OverlayCloseReason | 'confirm' | 'cancel' = 'programmatic'): Promise<boolean> {
    this.lastCloseReason = reason;
    const overlayReason: OverlayCloseReason =
      reason === 'confirm' || reason === 'cancel' ? 'programmatic' : reason;
    const closed = await this.overlayCtrl.hide(overlayReason);
    if (!closed) {
      this.syncingFromController = true;
      this.open = true;
      this.syncingFromController = false;
    }
    return closed;
  }

  private syncHostRole(): void {
    const targetRole = this.variant === 'alert' ? 'alertdialog' : 'dialog';
    if (this.internals && 'role' in this.internals) {
      try {
        this.internals.role = targetRole;
      } catch {
        // Ignore engines without writable ElementInternals.role.
      }
    }
  }

  private readonly handleHeaderSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.hasSlottedHeader = slot
      .assignedNodes({ flatten: true })
      .some((node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent?.trim().length ?? 0) > 0);
  };

  private readonly handleCloseClick = (): void => {
    void this.hide('programmatic');
  };

  private readonly handleConfirmClick = (): void => {
    this.emitEvent('mth-confirm', {
      detail: {
        variant: this.variant,
        value: this.variant === 'prompt' ? this.promptValue : undefined,
      },
    });
    void this.hide('confirm');
  };

  private readonly handleCancelClick = (): void => {
    this.emitEvent('mth-cancel', { detail: { variant: this.variant } });
    void this.hide('cancel');
  };

  private readonly handlePromptInput = (event: Event): void => {
    this.promptValue = (event.target as HTMLInputElement).value;
  };

  private renderBuiltInFooter() {
    if (this.variant === 'alert') {
      return html`
        <button type="button" class="action-btn primary" @click=${this.handleConfirmClick}>
          ${this.t('ok')}
        </button>
      `;
    }
    if (this.variant === 'confirm' || this.variant === 'prompt') {
      return html`
        <button type="button" class="action-btn" @click=${this.handleCancelClick}>
          ${this.t('cancel')}
        </button>
        <button type="button" class="action-btn primary" @click=${this.handleConfirmClick}>
          ${this.t('confirm')}
        </button>
      `;
    }
    return nothing;
  }

  override render() {
    const hasTitle = this.label.length > 0 || this.hasSlottedHeader;
    const hasDesc = this.description.length > 0;
    const dialogRole = this.variant === 'alert' ? 'alertdialog' : 'dialog';

    return html`
      <dialog
        id="mth-dialog-surface"
        part="base"
        class="base"
        role=${dialogRole}
        aria-modal=${this.modal ? 'true' : 'false'}
        aria-labelledby=${hasTitle ? 'mth-dialog-title' : nothing}
        aria-describedby=${hasDesc ? 'mth-dialog-desc' : nothing}
      >
        <div part="popup" class="popup">
          <header part="header" class="header">
            <h2 id="mth-dialog-title" part="title" class="title">
              <slot name="header" @slotchange=${this.handleHeaderSlotChange}>${this.label}</slot>
            </h2>
            <button
              type="button"
              part="close-button"
              class="close-btn"
              aria-label=${this.t('close')}
              @click=${this.handleCloseClick}
            >
              ×
            </button>
          </header>
          <div part="body" class="body">
            <p id="mth-dialog-desc" class="description" ?hidden=${!hasDesc}>
              ${this.description}
            </p>
            ${this.variant === 'prompt'
              ? html`
                  <label for="mth-dialog-prompt" class="prompt-label">
                    ${this.t('promptLabel')}
                  </label>
                  <input
                    id="mth-dialog-prompt"
                    part="prompt-input"
                    class="prompt-input"
                    .value=${this.promptValue}
                    @input=${this.handlePromptInput}
                  />
                `
              : nothing}
            <slot></slot>
          </div>
          <footer part="footer" class="footer">
            <slot name="footer">${this.renderBuiltInFooter()}</slot>
          </footer>
        </div>
      </dialog>
    `;
  }
}
