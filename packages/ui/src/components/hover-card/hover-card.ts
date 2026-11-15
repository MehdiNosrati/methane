import { UIElement, type PropertyValues } from '@methane/core';
import {
  OverlayController,
  PositioningController,
  type OverlayCloseReason,
  type Placement,
  type PositioningResult,
} from '@methane/primitives';
import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { hoverCardMessages } from './hover-card.messages.js';
import { hoverCardStyles } from './hover-card.styles.js';

/**
 * `<mth-hover-card>`: floating rich preview surface with native `interestfor`
 * progressive enhancement, hover/focus delay timers, `OverlayController`, and
 * dual-path `PositioningController`.
 */
export class MthHoverCard extends UIElement {
  static override messages = hoverCardMessages;
  static override styles = hoverCardStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  placement: Placement = 'bottom';

  @property({ type: Number, attribute: 'open-delay' })
  openDelay = 200;

  @property({ type: Number, attribute: 'close-delay' })
  closeDelay = 300;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, attribute: 'force-fallback', reflect: true })
  forceFallback = false;

  @property({ type: String })
  label = '';

  @query('#mth-hc-trigger')
  private triggerWrapperEl!: HTMLElement | null;

  @query('#mth-hc-surface')
  private popupEl!: HTMLElement | null;

  @query('#mth-hc-arrow')
  private arrowEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private syncingFromController = false;
  private slottedTriggerEl: HTMLElement | null = null;

  constructor() {
    super();

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.popupEl,
      trigger: () => this.resolveTriggerElement(),
      closeOnEscape: true,
      lightDismiss: true,
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

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.resolveTriggerElement() ?? this,
      floating: () => this.popupEl,
      arrow: () => this.arrowEl,
      placement: this.placement,
      offset: 8,
      flip: true,
      shift: true,
      forceFallback: this.forceFallback,
    });
  }

  get hasNativeInterestFor(): boolean {
    return (
      typeof HTMLElement !== 'undefined' &&
      'interestForElement' in HTMLElement.prototype
    );
  }

  get lastPositioningResult(): PositioningResult | null {
    return this.positioningCtrl.lastResult;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('open', this.open);
    this.addEventListener('interest', this.handleInterestEvent);
    this.addEventListener('loseinterest', this.handleLoseInterestEvent);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearTimers();
    this.removeEventListener('interest', this.handleInterestEvent);
    this.removeEventListener('loseinterest', this.handleLoseInterestEvent);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('placement') || changedProperties.has('forceFallback')) {
      this.positioningCtrl.updateOptions({
        placement: this.placement,
        forceFallback: this.forceFallback,
      });
    }
    if (changedProperties.has('disabled') && this.disabled && this.open) {
      this.clearTimers();
      void this.hide('programmatic');
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
    if (this.disabled) return false;
    this.clearTimers();
    return this.overlayCtrl.show();
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    this.clearTimers();
    return this.overlayCtrl.hide(reason);
  }

  async toggle(): Promise<boolean> {
    return this.open ? this.hide('invoker') : this.show();
  }

  private resolveTriggerElement(): HTMLElement | null {
    if (this.slottedTriggerEl) return this.slottedTriggerEl;
    const assigned = this.querySelector<HTMLElement>('[slot="trigger"]');
    return assigned ?? this.triggerWrapperEl;
  }

  private clearTimers(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private scheduleOpen(): void {
    if (this.disabled) return;
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    if (this.open || this.openTimer !== null) return;
    const delay = Math.max(0, Number.isFinite(this.openDelay) ? this.openDelay : 0);
    if (delay === 0) {
      void this.show();
      return;
    }
    this.openTimer = setTimeout(() => {
      this.openTimer = null;
      void this.show();
    }, delay);
  }

  private scheduleClose(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    if (!this.open || this.closeTimer !== null) return;
    const delay = Math.max(0, Number.isFinite(this.closeDelay) ? this.closeDelay : 0);
    if (delay === 0) {
      void this.hide('outside');
      return;
    }
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      void this.hide('outside');
    }, delay);
  }

  private readonly handleInterestEvent = (): void => {
    void this.show();
  };

  private readonly handleLoseInterestEvent = (): void => {
    void this.hide('outside');
  };

  private readonly handleTriggerSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    const first = slot.assignedElements({ flatten: true })[0];
    this.slottedTriggerEl = first instanceof HTMLElement ? first : null;
  };

  private readonly handlePointerEnter = (): void => {
    if (this.hasNativeInterestFor) return;
    this.scheduleOpen();
  };

  private readonly handlePointerLeave = (): void => {
    if (this.hasNativeInterestFor) return;
    this.scheduleClose();
  };

  private readonly handleFocusIn = (): void => {
    this.scheduleOpen();
  };

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    if (next && (this.contains(next) || this.shadowRoot?.contains(next))) {
      return;
    }
    this.scheduleClose();
  };

  override render() {
    const surfaceLabel = this.label.trim().length > 0 ? this.label : this.t('surfaceLabel');

    return html`
      <span
        id="mth-hc-trigger"
        part="trigger"
        class="trigger"
        @mouseenter=${this.handlePointerEnter}
        @mouseleave=${this.handlePointerLeave}
        @focusin=${this.handleFocusIn}
        @focusout=${this.handleFocusOut}
      >
        <slot name="trigger" @slotchange=${this.handleTriggerSlotChange}></slot>
      </span>
      <div
        id="mth-hc-surface"
        part="popup"
        class="popup"
        role="dialog"
        aria-label=${surfaceLabel}
        ?hidden=${!this.open}
        @mouseenter=${this.handlePointerEnter}
        @mouseleave=${this.handlePointerLeave}
        @focusin=${this.handleFocusIn}
        @focusout=${this.handleFocusOut}
      >
        <div id="mth-hc-arrow" part="arrow" class="arrow" aria-hidden="true"></div>
        <div part="content" class="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
