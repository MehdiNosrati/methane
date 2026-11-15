import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  FocusTrapController,
  OverlayController,
  type OverlayCloseReason,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { fullscreenOverlayMessages } from './fullscreen-overlay.messages.js';
import { fullscreenOverlayStyles } from './fullscreen-overlay.styles.js';

/**
 * `<mth-fullscreen-overlay>`: edge-to-edge modal `<dialog>` overlay built on
 * `OverlayController`, `FocusTrapController`, and `MotionController`.
 */
export class MthFullscreenOverlay extends UIElement {
  static override messages = fullscreenOverlayMessages;
  static override styles = fullscreenOverlayStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  closable = true;

  @property({ type: Boolean, attribute: 'close-on-escape', reflect: true })
  closeOnEscape = true;

  @state()
  private hasFooter = false;

  @query('#mth-fullscreen-overlay-surface')
  private dialogEl!: HTMLDialogElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly focusTrapCtrl: FocusTrapController;
  private syncingFromController = false;
  private triggerEl: HTMLElement | null = null;

  constructor() {
    super();

    this.overlayCtrl = new OverlayController(this, {
      mode: 'dialog',
      surface: () => this.dialogEl,
      trigger: () => this.triggerEl,
      closeOnEscape: this.closeOnEscape,
      lightDismiss: false,
      restoreFocus: true,
      motion: {
        target: () => this.dialogEl,
      },
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.syncingFromController = false;
        this.setCustomState('open', nextOpen);
        if (nextOpen) {
          this.focusTrapCtrl.activate();
        } else {
          this.focusTrapCtrl.deactivate();
        }
      },
    });

    this.focusTrapCtrl = new FocusTrapController(this, {
      container: () => this.dialogEl,
      restoreFocus: false,
    });
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('closeOnEscape')) {
      this.overlayCtrl.updateOptions({ closeOnEscape: this.closeOnEscape });
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('open') && !this.syncingFromController) {
      if (this.open && !this.overlayCtrl.open) {
        void this.overlayCtrl.show();
      } else if (!this.open && this.overlayCtrl.open) {
        void this.overlayCtrl.hide('programmatic');
      }
    }
  }

  public show(trigger?: HTMLElement | null): Promise<boolean> {
    if (trigger !== undefined) {
      this.triggerEl = trigger;
    }
    return this.overlayCtrl.show();
  }

  public hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    return this.overlayCtrl.hide(reason);
  }

  private readonly handleDialogCancel = (event: Event): void => {
    event.preventDefault();
    if (this.closeOnEscape) {
      void this.hide('escape');
    }
  };

  private readonly handleCloseClick = (): void => {
    void this.hide('programmatic');
  };

  private readonly handleFooterSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement | null;
    this.hasFooter = (slot?.assignedNodes({ flatten: true }).length ?? 0) > 0;
  };

  protected override render() {
    const headingId = 'mth-fullscreen-overlay-title';
    const resolvedLabel = this.label || this.t('defaultLabel');

    return html`
      <dialog
        id="mth-fullscreen-overlay-surface"
        part="base"
        aria-labelledby=${headingId}
        @cancel=${this.handleDialogCancel}
      >
        <header class="header" part="header">
          <h2 id=${headingId} class="title" part="title">
            <slot name="header">${resolvedLabel}</slot>
          </h2>
          <div class="actions" part="actions">
            <slot name="actions"></slot>
            ${this.closable
              ? html`
                  <button
                    type="button"
                    class="close-button"
                    part="close-button"
                    aria-label=${this.t('closeLabel')}
                    @click=${this.handleCloseClick}
                  >
                    ✕
                  </button>
                `
              : nothing}
          </div>
        </header>

        <div class="body" part="body">
          <slot></slot>
        </div>

        <footer class="footer" part="footer" ?hidden=${!this.hasFooter}>
          <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
        </footer>
      </dialog>
    `;
  }
}
