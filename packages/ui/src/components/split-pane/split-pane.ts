import { UIElement, type PropertyValues, html, property, query } from '@methane-ui/core';
import { splitPaneMessages } from './split-pane.messages.js';
import { splitPaneStyles } from './split-pane.styles.js';

export type MthSplitPaneOrientation = 'horizontal' | 'vertical';

/**
 * Two-pane resizable splitter with WAI-ARIA separator keyboard control and pointer capture.
 */
export class MthSplitPane extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = splitPaneStyles;
  static override messages = splitPaneMessages;

  @property({ type: String, reflect: true })
  orientation: MthSplitPaneOrientation = 'horizontal';

  @property({ type: Number })
  ratio = 50;

  @property({ type: Number, attribute: 'min-ratio' })
  minRatio = 0;

  @property({ type: Number, attribute: 'max-ratio' })
  maxRatio = 100;

  @property({ type: Number })
  step = 5;

  @property({ type: Number, attribute: 'step-large' })
  stepLarge = 15;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  @query('[part="base"]')
  private baseEl!: HTMLElement | null;

  @query('[part="divider"]')
  private dividerEl!: HTMLElement | null;

  private dynamicSheet: CSSStyleSheet | null = null;
  private draggingPointerId: number | null = null;

  private clampRatio(value: number): number {
    const min = Math.max(0, Math.min(100, this.minRatio));
    const max = Math.max(min, Math.min(100, this.maxRatio));
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    this.syncDynamicLayout();
  }

  private syncDynamicLayout(): void {
    if (
      typeof CSSStyleSheet === 'undefined' ||
      !this.shadowRoot ||
      !('adoptedStyleSheets' in this.shadowRoot)
    ) {
      return;
    }
    if (!this.dynamicSheet) {
      this.dynamicSheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        this.dynamicSheet,
      ];
    }

    const startRatio = this.clampRatio(this.ratio);
    const endRatio = Math.max(0, 100 - startRatio);
    const rule =
      this.orientation === 'vertical'
        ? `[part="base"] { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, ${startRatio}fr) auto minmax(0, ${endRatio}fr); }`
        : `[part="base"] { grid-template-columns: minmax(0, ${startRatio}fr) auto minmax(0, ${endRatio}fr); grid-template-rows: minmax(0, 1fr); }`;
    this.dynamicSheet.replaceSync(rule);
  }

  private setRatioFromInteraction(nextRatio: number): void {
    const clamped = Math.round(this.clampRatio(nextRatio) * 100) / 100;
    if (clamped === this.ratio) return;
    this.ratio = clamped;
    this.emitEvent('mth-resize', { detail: { ratio: clamped } });
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.disabled || event.button !== 0) return;
    this.draggingPointerId = event.pointerId;
    this.setCustomState('dragging', true);
    if (typeof this.dividerEl?.setPointerCapture === 'function') {
      try {
        this.dividerEl.setPointerCapture(event.pointerId);
      } catch {
        // Ignore in synthetic environments.
      }
    }
    this.updateRatioFromPointer(event);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.draggingPointerId !== event.pointerId || this.disabled) return;
    this.updateRatioFromPointer(event);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.draggingPointerId !== event.pointerId) return;
    this.draggingPointerId = null;
    this.setCustomState('dragging', false);
    if (typeof this.dividerEl?.releasePointerCapture === 'function') {
      try {
        this.dividerEl.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore in synthetic environments.
      }
    }
  };

  private updateRatioFromPointer(event: PointerEvent): void {
    const rect = this.baseEl?.getBoundingClientRect();
    if (!rect) return;
    if (this.orientation === 'vertical') {
      if (rect.height <= 0) return;
      const raw = ((event.clientY - rect.top) / rect.height) * 100;
      this.setRatioFromInteraction(raw);
      return;
    }
    if (rect.width <= 0) return;
    const isRtl = this.resolvedDir === 'rtl';
    const offsetX = isRtl ? rect.right - event.clientX : event.clientX - rect.left;
    const raw = (offsetX / rect.width) * 100;
    this.setRatioFromInteraction(raw);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled) return;
    const step = event.shiftKey ? this.stepLarge : this.step;
    const isRtl = this.resolvedDir === 'rtl';

    if (event.key === 'Home') {
      event.preventDefault();
      this.setRatioFromInteraction(this.minRatio);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.setRatioFromInteraction(this.maxRatio);
      return;
    }
    if (event.key === 'PageUp') {
      event.preventDefault();
      this.setRatioFromInteraction(this.ratio + this.stepLarge);
      return;
    }
    if (event.key === 'PageDown') {
      event.preventDefault();
      this.setRatioFromInteraction(this.ratio - this.stepLarge);
      return;
    }

    if (this.orientation === 'horizontal') {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.setRatioFromInteraction(this.ratio + (isRtl ? step : -step));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.setRatioFromInteraction(this.ratio + (isRtl ? -step : step));
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setRatioFromInteraction(this.ratio - step);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setRatioFromInteraction(this.ratio + step);
    }
  };

  override render() {
    const clamped = Math.round(this.clampRatio(this.ratio));
    const dividerAriaOrientation = this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    const dividerLabel = this.label.trim() || this.t('dividerLabel');

    return html`
      <div part="base">
        <div part="start">
          <slot name="start"></slot>
        </div>
        <div
          part="divider"
          role="separator"
          tabindex=${this.disabled ? '-1' : '0'}
          aria-orientation=${dividerAriaOrientation}
          aria-valuenow=${String(clamped)}
          aria-valuemin=${String(this.minRatio)}
          aria-valuemax=${String(this.maxRatio)}
          aria-label=${dividerLabel}
          @pointerdown=${this.handlePointerDown}
          @pointermove=${this.handlePointerMove}
          @pointerup=${this.handlePointerUp}
          @pointercancel=${this.handlePointerUp}
          @keydown=${this.handleKeyDown}
        >
          <slot name="divider"></slot>
        </div>
        <div part="end">
          <slot name="end"></slot>
        </div>
      </div>
    `;
  }
}
