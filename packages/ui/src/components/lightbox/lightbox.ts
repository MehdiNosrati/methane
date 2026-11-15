import { UIElement, type PropertyValues } from '@methane/core';
import {
  FocusTrapController,
  OverlayController,
  type OverlayCloseReason,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { lightboxMessages } from './lightbox.messages.js';
import { lightboxStyles } from './lightbox.styles.js';

function isSafeUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  // eslint-disable-next-line no-control-regex
  const cleaned = trimmed.replace(/[\u0000-\u0020\u007f]+/g, '');
  if (cleaned.startsWith('/') || cleaned.startsWith('#') || cleaned.startsWith('./') || cleaned.startsWith('../')) {
    return !cleaned.startsWith('//');
  }
  const colonIdx = cleaned.indexOf(':');
  const slashIdx = cleaned.indexOf('/');
  const queryIdx = cleaned.indexOf('?');
  const hashIdx = cleaned.indexOf('#');
  const firstDelimiter = [slashIdx, queryIdx, hashIdx].filter((n) => n >= 0).sort((a, b) => a - b)[0] ?? Infinity;
  if (colonIdx === -1 || colonIdx > firstDelimiter) {
    return true;
  }
  const scheme = cleaned.slice(0, colonIdx).toLowerCase();
  return scheme === 'http' || scheme === 'https' || scheme === 'blob';
}

export interface MthLightboxItem {
  readonly src: string;
  readonly alt?: string;
  readonly caption?: string;
  readonly title?: string;
}

/**
 * `<mth-lightbox>`: modal media gallery overlay using native `<dialog>`,
 * `OverlayController`, `FocusTrapController`, safe URL validation, zoom toggle,
 * and keyboard navigation.
 */
export class MthLightbox extends UIElement {
  static override messages = lightboxMessages;
  static override styles = lightboxStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Number })
  index = 0;

  @property({ type: Boolean, reflect: true })
  loop = true;

  @property({ type: Boolean, reflect: true })
  closable = true;

  @property({ type: Boolean, reflect: true })
  zoomable = true;

  @property({ type: String })
  label = '';

  @property({ attribute: false })
  items: ReadonlyArray<MthLightboxItem> = [];

  @state()
  private zoomed = false;

  @query('#mth-lightbox-surface')
  private dialogEl!: HTMLDialogElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly focusTrapCtrl: FocusTrapController;
  private syncingFromController = false;

  constructor() {
    super();

    this.overlayCtrl = new OverlayController(this, {
      mode: 'dialog',
      surface: () => this.dialogEl,
      closeOnEscape: true,
      lightDismiss: false,
      restoreFocus: true,
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
          this.zoomed = false;
          this.setCustomState('zoomed', false);
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
    if (changedProperties.has('index') || changedProperties.has('items')) {
      const clamped = this.clampIndex(this.index);
      if (clamped !== this.index) {
        this.index = clamped;
      }
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
    return this.overlayCtrl.show();
  }

  async openAt(targetIndex: number): Promise<boolean> {
    this.setIndex(targetIndex);
    return this.show();
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    if (!this.overlayCtrl.open) {
      this.open = false;
      this.setCustomState('open', false);
      return true;
    }
    const allowed = this.emitEvent('mth-close', {
      cancelable: true,
      detail: { reason },
    });
    if (!allowed) return false;
    return this.overlayCtrl.hide(reason);
  }

  next(): void {
    if (this.items.length === 0) return;
    const nextIdx = this.index + 1;
    if (nextIdx >= this.items.length) {
      if (this.loop) {
        this.setIndex(0);
      }
      return;
    }
    this.setIndex(nextIdx);
  }

  previous(): void {
    if (this.items.length === 0) return;
    const prevIdx = this.index - 1;
    if (prevIdx < 0) {
      if (this.loop) {
        this.setIndex(this.items.length - 1);
      }
      return;
    }
    this.setIndex(prevIdx);
  }

  toggleZoom(): void {
    if (!this.zoomable) return;
    this.zoomed = !this.zoomed;
    this.setCustomState('zoomed', this.zoomed);
  }

  private clampIndex(raw: number): number {
    if (this.items.length === 0 || !Number.isFinite(raw)) return 0;
    return Math.min(Math.max(0, Math.trunc(raw)), this.items.length - 1);
  }

  private setIndex(nextIndex: number): void {
    const clamped = this.clampIndex(nextIndex);
    if (clamped === this.index) return;
    this.index = clamped;
    this.zoomed = false;
    this.setCustomState('zoomed', false);
    this.emitEvent('mth-change', {
      detail: { index: clamped, item: this.items[clamped] ?? null },
    });
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.open || this.items.length <= 1) return;
    const rtl =
      typeof getComputedStyle === 'function' && getComputedStyle(this).direction === 'rtl';
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (rtl) this.previous();
      else this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (rtl) this.next();
      else this.previous();
    }
  };

  override render() {
    const total = this.items.length;
    const currentIndex = this.clampIndex(this.index);
    const currentItem = total > 0 ? this.items[currentIndex] : undefined;
    const hasSafeMedia = currentItem ? isSafeUrl(currentItem.src) : false;
    const dialogLabel = this.label.trim().length > 0 ? this.label : this.t('dialogLabel');
    const captionText = currentItem?.caption ?? currentItem?.title ?? '';

    return html`
      <dialog
        id="mth-lightbox-surface"
        part="base"
        class="base"
        role="dialog"
        aria-modal="true"
        aria-label=${dialogLabel}
        @keydown=${this.handleKeyDown}
      >
        <div part="toolbar" class="toolbar">
          <span class="counter">
            ${total > 0
              ? this.t('counter', { current: currentIndex + 1, total })
              : ''}
          </span>
          <div class="toolbar-actions">
            <slot name="actions"></slot>
            ${this.zoomable && hasSafeMedia
              ? html`
                  <button
                    type="button"
                    part="zoom-button"
                    class="tool-btn"
                    aria-pressed=${this.zoomed ? 'true' : 'false'}
                    aria-label=${this.zoomed ? this.t('zoomOut') : this.t('zoomIn')}
                    @click=${() => this.toggleZoom()}
                  >
                    ${this.zoomed ? '−' : '+'}
                  </button>
                `
              : nothing}
            ${this.closable
              ? html`
                  <button
                    type="button"
                    part="close-button"
                    class="tool-btn"
                    aria-label=${this.t('close')}
                    @click=${() => void this.hide('invoker')}
                  >
                    ×
                  </button>
                `
              : nothing}
          </div>
        </div>

        <div part="stage" class="stage">
          ${total > 1
            ? html`
                <button
                  type="button"
                  part="prev-button"
                  class="nav-btn"
                  aria-label=${this.t('previous')}
                  ?disabled=${!this.loop && currentIndex === 0}
                  @click=${() => this.previous()}
                >
                  ‹
                </button>
              `
            : nothing}

          <div class="media-frame">
            ${currentItem
              ? hasSafeMedia
                ? html`
                    <img
                      part="image"
                      class="image"
                      src=${currentItem.src.trim()}
                      alt=${currentItem.alt ?? captionText}
                      data-zoomed=${this.zoomed ? 'true' : 'false'}
                      @click=${() => this.toggleZoom()}
                    />
                  `
                : html`<p class="blocked" role="alert">${this.t('unsafeMedia')}</p>`
              : html`<slot></slot>`}
          </div>

          ${total > 1
            ? html`
                <button
                  type="button"
                  part="next-button"
                  class="nav-btn"
                  aria-label=${this.t('next')}
                  ?disabled=${!this.loop && currentIndex >= total - 1}
                  @click=${() => this.next()}
                >
                  ›
                </button>
              `
            : nothing}
        </div>

        <div part="caption" class="caption" ?hidden=${captionText.length === 0}>
          <slot name="caption">${captionText}</slot>
        </div>
      </dialog>
    `;
  }
}
