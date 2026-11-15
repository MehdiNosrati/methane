import { UIElement, type PropertyValues } from '@methane/core';
import {
  OverlayController,
  PositioningController,
  type OverlayCloseReason,
  type Placement,
  type PositioningAnchor,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { coachmarkMessages } from './coachmark.messages.js';
import { coachmarkStyles } from './coachmark.styles.js';

/**
 * `<mth-coachmark>`: anchored feature-discovery tip popover built with
 * `OverlayController` and `PositioningController`.
 */
export class MthCoachmark extends UIElement {
  static override messages = coachmarkMessages;
  static override styles = coachmarkStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  target = '';

  @property({ type: String })
  heading = '';

  @property({ type: String })
  placement: Placement = 'bottom';

  @property({ type: Boolean, reflect: true })
  beacon = true;

  @property({ type: Boolean, reflect: true })
  closable = true;

  @property({ type: String, attribute: 'dismiss-label' })
  dismissLabel = '';

  @property({ type: Number })
  step = 0;

  @property({ type: Number })
  total = 0;

  @property({ type: Boolean, attribute: 'force-fallback' })
  forceFallback = false;

  @query('.surface')
  private surfaceEl!: HTMLElement | null;

  @query('.arrow')
  private arrowEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private positionSheet: CSSStyleSheet | null = null;
  private explicitAnchor: PositioningAnchor | null = null;
  private triggerEl: HTMLElement | null = null;
  private syncingFromController = false;

  constructor() {
    super();

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.resolveAnchor(),
      floating: () => this.surfaceEl,
      arrow: () => this.arrowEl,
      placement: this.placement,
      offset: 10,
      forceFallback: this.forceFallback,
      onPosition: (pos) => {
        this.applyPositionSheet(pos.x, pos.y, pos.arrowX ?? 0, pos.arrowY ?? 0);
      },
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.surfaceEl,
      trigger: () => this.triggerEl,
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
          this.positioningCtrl.start();
        } else {
          this.positioningCtrl.stop();
        }
      },
    });

    this.setCustomState('beacon', this.beacon);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('beacon')) {
      this.setCustomState('beacon', this.beacon);
    }
    if (changedProperties.has('placement') || changedProperties.has('forceFallback')) {
      this.positioningCtrl.updateOptions({
        placement: this.placement,
        forceFallback: this.forceFallback,
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

  public setAnchor(anchor: PositioningAnchor | null): void {
    this.explicitAnchor = anchor;
    if (this.open) {
      this.positioningCtrl.reposition();
    }
  }

  public show(anchor?: PositioningAnchor | null): Promise<boolean> {
    if (anchor !== undefined) {
      this.explicitAnchor = anchor;
      if (anchor instanceof HTMLElement) {
        this.triggerEl = anchor;
      }
    }
    return this.overlayCtrl.show();
  }

  public hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    return this.overlayCtrl.hide(reason);
  }

  private resolveAnchor(): PositioningAnchor | null {
    if (this.explicitAnchor) {
      return this.explicitAnchor;
    }
    if (!this.target || typeof document === 'undefined') {
      return null;
    }
    try {
      return document.querySelector(this.target);
    } catch {
      return null;
    }
  }

  private applyPositionSheet(x: number, y: number, arrowX: number, arrowY: number): void {
    const root = this.shadowRoot;
    if (!root || typeof CSSStyleSheet === 'undefined' || !Array.isArray(root.adoptedStyleSheets)) {
      return;
    }
    if (!this.positionSheet) {
      this.positionSheet = new CSSStyleSheet();
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.positionSheet];
    }
    this.positionSheet.replaceSync(
      `:host { --_cm-x: ${Math.round(x)}px; --_cm-y: ${Math.round(y)}px; --_cm-ax: ${Math.round(arrowX)}px; --_cm-ay: ${Math.round(arrowY)}px; }`,
    );
  }

  private readonly handleDismissClick = (): void => {
    this.emitEvent('mth-dismiss');
    void this.hide('invoker');
  };

  private readonly handleCloseClick = (): void => {
    void this.hide('invoker');
  };

  protected override render() {
    const headingId = 'mth-coachmark-heading';
    const titleText = this.heading || this.t('defaultLabel');
    const dismissText = this.dismissLabel || this.t('dismissLabel');
    const showProgress = this.step > 0 && this.total > 0;

    return html`
      <section
        class="surface"
        part="base"
        role="dialog"
        aria-modal="false"
        aria-labelledby=${headingId}
        ?hidden=${!this.open}
      >
        <div class="arrow" part="arrow" aria-hidden="true"></div>
        <header class="header" part="header">
          <div class="title-wrap">
            ${this.beacon ? html`<span class="beacon" part="beacon" aria-hidden="true"></span>` : nothing}
            <h2 id=${headingId} class="heading" part="heading">${titleText}</h2>
          </div>
          ${this.closable
            ? html`
                <button
                  type="button"
                  class="close-btn"
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

        <footer class="footer" part="footer">
          ${showProgress
            ? html`<span class="progress">${this.t('stepProgress', { current: this.step, total: this.total })}</span>`
            : nothing}
          <div class="actions">
            <slot name="actions"></slot>
            <button
              type="button"
              class="dismiss-btn"
              part="dismiss-button"
              @click=${this.handleDismissClick}
            >
              ${dismissText}
            </button>
          </div>
        </footer>
      </section>
    `;
  }
}
