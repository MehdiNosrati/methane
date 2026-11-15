import { UIElement, type PropertyValues } from '@methane/core';
import {
  OverlayController,
  PositioningController,
  type OverlayCloseReason,
  type Placement,
  type PositioningAnchor,
  type PositioningResult,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { tooltipMessages } from './tooltip.messages.js';
import { tooltipStyles } from './tooltip.styles.js';

/**
 * `<mth-tooltip>`: accessible tooltip supporting progressive `interestfor` detection,
 * hover/focus/long-press intent fallback, non-focus-stealing Escape dismissal, same-root
 * `aria-describedby`, and adopted `CSSStyleSheet` positioning (zero inline `style=`).
 */
export class MthTooltip extends UIElement {
  static override messages = tooltipMessages;
  static override styles = tooltipStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  content = '';

  @property({ type: String, reflect: true })
  placement: Placement = 'top';

  @property({ type: Number })
  delay = 250;

  @property({ type: Number })
  offset = 8;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, attribute: 'force-fallback', reflect: true })
  forceFallback = false;

  @property({ attribute: false })
  anchor: PositioningAnchor | null = null;

  @state()
  private hasSlottedContent = false;

  @query('#mth-tooltip-trigger')
  private triggerWrapperEl!: HTMLElement | null;

  @query('#mth-tooltip-surface')
  private surfaceEl!: HTMLElement | null;

  @query('#mth-tooltip-arrow')
  private arrowEl!: HTMLElement | null;

  @query('#mth-tooltip-trigger > slot')
  private defaultSlotEl!: HTMLSlotElement | null;

  private syncingFromController = false;
  private positionSheet: CSSStyleSheet | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;

  constructor() {
    super();

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.surfaceEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: false,
      forceFallback: false,
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
          this.clearPositionSheet();
        }
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.resolveAnchor(),
      floating: () => this.surfaceEl,
      arrow: () => this.arrowEl,
      placement: this.placement,
      offset: this.offset,
      flip: true,
      shift: true,
      forceFallback: this.forceFallback,
      onPosition: (result) => {
        this.applyPositionSheet(result);
      },
    });
  }

  get supportsInterestFor(): boolean {
    return (
      typeof HTMLButtonElement !== 'undefined' &&
      'interestForElement' in HTMLButtonElement.prototype
    );
  }

  get lastPositioningResult(): PositioningResult | null {
    return this.positioningCtrl.lastResult;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearTimers();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
      if (this.disabled) {
        this.clearTimers();
        if (this.open) {
          void this.hide('programmatic');
        }
      }
    }

    if (changedProperties.has('forceFallback')) {
      this.overlayCtrl.updateOptions({
        forceFallback: this.forceFallback,
      });
    }

    if (
      changedProperties.has('placement') ||
      changedProperties.has('offset') ||
      changedProperties.has('forceFallback') ||
      changedProperties.has('anchor')
    ) {
      this.positioningCtrl.updateOptions({
        placement: this.placement,
        offset: this.offset,
        forceFallback: this.forceFallback,
      });
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
    this.clearTimers();
    const closed = await this.overlayCtrl.hide(reason);
    if (!closed) {
      this.syncingFromController = true;
      this.open = true;
      this.syncingFromController = false;
    }
    return closed;
  }

  private getSlottedTrigger(): HTMLElement | null {
    const slot = this.defaultSlotEl;
    if (!slot) return null;
    const assigned = slot.assignedElements({ flatten: true });
    return (assigned[0] as HTMLElement | undefined) ?? null;
  }

  private resolveAnchor(): PositioningAnchor | null {
    if (this.anchor) return this.anchor;
    return this.getSlottedTrigger() ?? this.triggerWrapperEl ?? this;
  }

  private scheduleShow(delayMs = this.delay): void {
    if (this.disabled) return;
    this.clearTimers();
    if (delayMs <= 0) {
      void this.show();
      return;
    }
    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      void this.show();
    }, delayMs);
  }

  private clearTimers(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private readonly handlePointerEnter = (): void => {
    this.scheduleShow(this.delay);
  };

  private readonly handlePointerLeave = (): void => {
    void this.hide('programmatic');
  };

  private readonly handleFocusIn = (): void => {
    this.scheduleShow(this.delay);
  };

  private readonly handleFocusOut = (): void => {
    void this.hide('programmatic');
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.disabled || event.pointerType !== 'touch') return;
    this.clearTimers();
    this.longPressTimer = setTimeout(() => {
      this.longPressTimer = null;
      void this.show();
    }, Math.max(this.delay, 500));
  };

  private readonly handlePointerEnd = (): void => {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  };

  private readonly handleNativeInterest = (): void => {
    void this.show();
  };

  private readonly handleNativeLoseInterest = (): void => {
    void this.hide('programmatic');
  };

  private readonly handleSurfacePointerEnter = (): void => {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  };

  private readonly handleContentSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.hasSlottedContent = slot
      .assignedNodes({ flatten: true })
      .some((node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent?.trim().length ?? 0) > 0);
  };

  private applyPositionSheet(result: PositioningResult): void {
    const root = this.shadowRoot;
    const surface = this.surfaceEl;
    const arrow = this.arrowEl;
    const triggerWrapper = this.triggerWrapperEl;

    let cssRules = '';
    if (result.strategy === 'css-anchor' && surface) {
      const anchorName = surface.style.getPropertyValue('position-anchor');
      const positionArea = surface.style.getPropertyValue('position-area');
      const tryFallbacks = surface.style.getPropertyValue('position-try-fallbacks');

      if (triggerWrapper && triggerWrapper.style.getPropertyValue('anchor-name')) {
        const wrapperAnchorName = triggerWrapper.style.getPropertyValue('anchor-name');
        cssRules += `#mth-tooltip-trigger { anchor-name: ${wrapperAnchorName}; }\n`;
        triggerWrapper.removeAttribute('style');
      }

      cssRules += `#mth-tooltip-surface {\n  position: fixed;\n`;
      if (anchorName) cssRules += `  position-anchor: ${anchorName};\n`;
      if (positionArea) cssRules += `  position-area: ${positionArea};\n`;
      if (tryFallbacks) cssRules += `  position-try-fallbacks: ${tryFallbacks};\n`;
      cssRules += `}\n`;
    } else {
      cssRules += `#mth-tooltip-surface {\n  position: fixed;\n  inset-inline-start: ${result.x}px;\n  inset-block-start: ${result.y}px;\n}\n`;
      if (arrow) {
        const arrowRules: string[] = [];
        if (result.arrowX !== undefined) {
          arrowRules.push(`inset-inline-start: ${result.arrowX}px;`);
        }
        if (result.arrowY !== undefined) {
          arrowRules.push(`inset-block-start: ${result.arrowY}px;`);
        }
        if (arrowRules.length > 0) {
          cssRules += `#mth-tooltip-arrow { ${arrowRules.join(' ')} }\n`;
        }
      }
    }

    surface?.removeAttribute('style');
    arrow?.removeAttribute('style');

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
    const root = this.shadowRoot;
    if (root && 'adoptedStyleSheets' in root && this.positionSheet) {
      root.adoptedStyleSheets = root.adoptedStyleSheets.filter((s) => s !== this.positionSheet);
    }
  }

  override render() {
    const hasContent = this.content.length > 0 || this.hasSlottedContent;

    return html`
      <span
        id="mth-tooltip-trigger"
        part="trigger"
        class="trigger"
        aria-describedby=${hasContent ? 'mth-tooltip-surface' : nothing}
        @pointerenter=${this.handlePointerEnter}
        @pointerleave=${this.handlePointerLeave}
        @focusin=${this.handleFocusIn}
        @focusout=${this.handleFocusOut}
        @pointerdown=${this.handlePointerDown}
        @pointerup=${this.handlePointerEnd}
        @pointercancel=${this.handlePointerEnd}
        @interest=${this.handleNativeInterest}
        @loseinterest=${this.handleNativeLoseInterest}
      >
        <slot></slot>
      </span>
      <div
        id="mth-tooltip-surface"
        part="base"
        class="surface"
        role="tooltip"
        popover="manual"
        ?hidden=${!this.open}
        @pointerenter=${this.handleSurfacePointerEnter}
        @pointerleave=${this.handlePointerLeave}
      >
        <div id="mth-tooltip-arrow" part="arrow" class="arrow" aria-hidden="true"></div>
        <div part="content" class="content">
          <slot name="content" @slotchange=${this.handleContentSlotChange}>${this.content}</slot>
        </div>
      </div>
    `;
  }
}
