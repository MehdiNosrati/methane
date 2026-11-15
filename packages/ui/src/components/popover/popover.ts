import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  FocusTrapController,
  OverlayController,
  PositioningController,
  type OverlayCloseReason,
  type Placement,
  type PositioningAnchor,
  type PositioningResult,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { popoverMessages } from './popover.messages.js';
import { popoverStyles } from './popover.styles.js';

/**
 * `<mth-popover>`: anchored floating overlay using `OverlayController` and dual-path
 * `PositioningController` (CSS Anchor Positioning + JS collision fallback) via adopted
 * `CSSStyleSheet` so rendered shadow elements remain completely free of inline `style=`.
 */
export class MthPopover extends UIElement {
  static override messages = popoverMessages;
  static override styles = popoverStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  placement: Placement = 'bottom';

  @property({ type: Number })
  offset = 8;

  @property({ type: Boolean, reflect: true })
  modal = false;

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'close-on-escape', reflect: true })
  closeOnEscape = true;

  @property({ type: Boolean, attribute: 'force-fallback', reflect: true })
  forceFallback = false;

  @property({ attribute: false })
  anchor: PositioningAnchor | null = null;

  @query('#mth-popover-anchor')
  private anchorWrapperEl!: HTMLElement | null;

  @query('#mth-popover-surface')
  private surfaceEl!: HTMLElement | null;

  @query('#mth-popover-arrow')
  private arrowEl!: HTMLElement | null;

  @query('slot[name="trigger"]')
  private triggerSlotEl!: HTMLSlotElement | null;

  private syncingFromController = false;
  private positionSheet: CSSStyleSheet | null = null;

  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private readonly focusTrapCtrl: FocusTrapController;

  constructor() {
    super();

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.surfaceEl,
      trigger: () => this.getSlottedTrigger() ?? undefined!,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
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
          if (this.modal) {
            this.focusTrapCtrl.activate();
          }
        } else {
          this.focusTrapCtrl.deactivate();
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

    this.focusTrapCtrl = new FocusTrapController(this, {
      container: () => this.surfaceEl,
      restoreFocus: false,
    });
  }

  get lastPositioningResult(): PositioningResult | null {
    return this.positioningCtrl.lastResult;
  }

  get isUsingNativeTopLayer(): boolean {
    return this.overlayCtrl.isUsingNativeTopLayer;
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (
      changedProperties.has('modal') ||
      changedProperties.has('closeOnEscape') ||
      changedProperties.has('forceFallback')
    ) {
      this.overlayCtrl.updateOptions({
        mode: this.modal ? 'dialog' : 'popover',
        closeOnEscape: this.closeOnEscape,
        lightDismiss: !this.modal,
        forceFallback: this.forceFallback,
      });
      this.setCustomState('modal', this.modal);
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

  private getSlottedTrigger(): HTMLElement | null {
    const slot = this.triggerSlotEl;
    if (!slot) return null;
    const assigned = slot.assignedElements({ flatten: true });
    return (assigned[0] as HTMLElement | undefined) ?? null;
  }

  private resolveAnchor(): PositioningAnchor | null {
    if (this.anchor) return this.anchor;
    return this.anchorWrapperEl ?? this.getSlottedTrigger() ?? this;
  }

  private applyPositionSheet(result: PositioningResult): void {
    const root = this.shadowRoot;
    const surface = this.surfaceEl;
    const arrow = this.arrowEl;
    const anchorWrapper = this.anchorWrapperEl;

    let cssRules = '';
    if (result.strategy === 'css-anchor' && surface) {
      const anchorName = surface.style.getPropertyValue('position-anchor');
      const positionArea = surface.style.getPropertyValue('position-area');
      const tryFallbacks = surface.style.getPropertyValue('position-try-fallbacks');

      if (anchorWrapper && anchorWrapper.style.getPropertyValue('anchor-name')) {
        const wrapperAnchorName = anchorWrapper.style.getPropertyValue('anchor-name');
        cssRules += `#mth-popover-anchor { anchor-name: ${wrapperAnchorName}; }\n`;
        anchorWrapper.removeAttribute('style');
      }

      cssRules += `#mth-popover-surface {\n  position: fixed;\n`;
      if (anchorName) cssRules += `  position-anchor: ${anchorName};\n`;
      if (positionArea) cssRules += `  position-area: ${positionArea};\n`;
      if (tryFallbacks) cssRules += `  position-try-fallbacks: ${tryFallbacks};\n`;
      cssRules += `}\n`;
    } else {
      cssRules += `#mth-popover-surface {\n  position: fixed;\n  inset-inline-start: ${result.x}px;\n  inset-block-start: ${result.y}px;\n}\n`;
      if (arrow) {
        const arrowRules: string[] = [];
        if (result.arrowX !== undefined) {
          arrowRules.push(`inset-inline-start: ${result.arrowX}px;`);
        }
        if (result.arrowY !== undefined) {
          arrowRules.push(`inset-block-start: ${result.arrowY}px;`);
        }
        if (arrowRules.length > 0) {
          cssRules += `#mth-popover-arrow { ${arrowRules.join(' ')} }\n`;
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

  private readonly handleTriggerClick = (): void => {
    void this.toggle();
  };

  override render() {
    return html`
      <span id="mth-popover-anchor" part="anchor" class="anchor" @click=${this.handleTriggerClick}>
        <slot name="trigger"></slot>
      </span>
      <div
        id="mth-popover-surface"
        part="base"
        class="surface"
        popover=${this.modal ? nothing : 'manual'}
        role=${this.modal ? 'dialog' : nothing}
        aria-modal=${this.modal ? 'true' : nothing}
        aria-label=${this.modal && this.label ? this.label : nothing}
        ?hidden=${!this.open}
      >
        <div id="mth-popover-arrow" part="arrow" class="arrow" aria-hidden="true"></div>
        <div part="content" class="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
