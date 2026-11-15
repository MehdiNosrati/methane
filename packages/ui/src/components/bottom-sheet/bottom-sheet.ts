import { UIElement, type PropertyValues } from '@methane/core';
import {
  DragSortController,
  FocusTrapController,
  OverlayController,
  type OverlayCloseReason,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { bottomSheetMessages } from './bottom-sheet.messages.js';
import { bottomSheetStyles } from './bottom-sheet.styles.js';

export type BottomSheetDetent = 'collapsed' | 'half' | 'full';

const DETENT_ORDER: readonly BottomSheetDetent[] = ['collapsed', 'half', 'full'];

/**
 * `<mth-bottom-sheet>`: modal bottom sheet overlay with detent snapping,
 * `OverlayController`, `FocusTrapController`, `MotionController`, and drag/keyboard support.
 */
export class MthBottomSheet extends UIElement {
  static override messages = bottomSheetMessages;
  static override styles = bottomSheetStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  detent: BottomSheetDetent = 'half';

  @property({ type: Boolean, reflect: true })
  closable = true;

  @property({ type: Boolean, attribute: 'light-dismiss', reflect: true })
  lightDismiss = true;

  @property({ type: Boolean, attribute: 'close-on-escape', reflect: true })
  closeOnEscape = true;

  @property({ type: String })
  label = '';

  @state()
  private hasFooter = false;

  @query('#mth-bottom-sheet-surface')
  private dialogEl!: HTMLDialogElement | null;

  @query('.handle-bar')
  private handleEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly focusTrapCtrl: FocusTrapController;
  private readonly dragCtrl: DragSortController;
  private syncingFromController = false;
  private triggerEl: HTMLElement | null = null;
  private dragStartY = 0;

  constructor() {
    super();

    this.overlayCtrl = new OverlayController(this, {
      mode: 'dialog',
      surface: () => this.dialogEl,
      trigger: () => this.triggerEl,
      closeOnEscape: this.closeOnEscape,
      lightDismiss: this.lightDismiss,
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

    this.dragCtrl = new DragSortController(this, {
      getItems: () => (this.handleEl ? [this.handleEl] : []),
      orientation: 'vertical',
    });

    this.syncDetentStates(this.detent);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('detent')) {
      this.syncDetentStates(this.detent);
    }
    if (changedProperties.has('closeOnEscape') || changedProperties.has('lightDismiss')) {
      this.overlayCtrl.updateOptions({
        closeOnEscape: this.closeOnEscape,
        lightDismiss: this.lightDismiss,
      });
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

  public setDetent(next: BottomSheetDetent): void {
    if (next === this.detent) {
      return;
    }
    this.detent = next;
    this.syncDetentStates(next);
    this.emitEvent('mth-detent-change', { detail: { detent: next } });
  }

  private syncDetentStates(active: BottomSheetDetent): void {
    for (const candidate of DETENT_ORDER) {
      this.setCustomState(`detent-${candidate}`, candidate === active);
    }
  }

  private readonly handleBackdropCancel = (event: Event): void => {
    event.preventDefault();
    if (this.closeOnEscape) {
      void this.hide('escape');
    }
  };

  private readonly handleDialogClick = (event: MouseEvent): void => {
    if (!this.lightDismiss || event.target !== this.dialogEl) {
      return;
    }
    void this.hide('outside');
  };

  private readonly handleCloseClick = (): void => {
    void this.hide('programmatic');
  };

  private readonly handleHandleKeyDown = (event: KeyboardEvent): void => {
    const idx = DETENT_ORDER.indexOf(this.detent);
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const next = DETENT_ORDER[Math.min(DETENT_ORDER.length - 1, idx + 1)] ?? 'full';
      this.setDetent(next);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (idx <= 0) {
        void this.hide('programmatic');
      } else {
        const next = DETENT_ORDER[idx - 1] ?? 'collapsed';
        this.setDetent(next);
      }
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.dragStartY = event.clientY;
    this.setCustomState('dragging', true);
    void this.dragCtrl;
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.setCustomState('dragging', false);
    const deltaY = event.clientY - this.dragStartY;
    if (deltaY > 96) {
      if (this.detent === 'full') {
        this.setDetent('half');
      } else if (this.detent === 'half') {
        this.setDetent('collapsed');
      } else {
        void this.hide('programmatic');
      }
    } else if (deltaY < -64) {
      if (this.detent === 'collapsed') {
        this.setDetent('half');
      } else if (this.detent === 'half') {
        this.setDetent('full');
      }
    }
  };

  private readonly handleFooterSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement | null;
    this.hasFooter = (slot?.assignedNodes({ flatten: true }).length ?? 0) > 0;
  };

  protected override render() {
    const headingId = 'mth-bottom-sheet-title';
    const resolvedLabel = this.label || this.t('defaultLabel');

    return html`
      <dialog
        id="mth-bottom-sheet-surface"
        part="base"
        aria-labelledby=${headingId}
        @cancel=${this.handleBackdropCancel}
        @click=${this.handleDialogClick}
      >
        <button
          type="button"
          class="handle-bar"
          part="handle-bar"
          aria-label=${this.t('dragHandleLabel')}
          @keydown=${this.handleHandleKeyDown}
          @pointerdown=${this.handlePointerDown}
          @pointerup=${this.handlePointerUp}
        >
          <span class="handle" part="handle" aria-hidden="true"></span>
        </button>

        <header class="header" part="header">
          <h2 id=${headingId} class="title" part="title">
            <slot name="header">${resolvedLabel}</slot>
          </h2>
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
