import { UIElement, type PropertyValues, html, property, query } from '@methane/core';
import { resizableHandleMessages } from './resizable-handle.messages.js';
import { resizableHandleStyles } from './resizable-handle.styles.js';

export type MthResizableOrientation = 'horizontal' | 'vertical';

export interface MthResizeDeltaDetail {
  readonly deltaPercent?: number;
  readonly deltaPx?: number;
  readonly edge?: 'min' | 'max';
  readonly source: 'keyboard' | 'pointer';
}

/**
 * Interactive separator handle inside `<mth-resizable-group>`.
 */
export class MthResizableHandle extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = resizableHandleStyles;
  static override messages = resizableHandleMessages;

  @property({ type: String, reflect: true })
  orientation: MthResizableOrientation = 'horizontal';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Number })
  step = 5;

  @property({ type: Number, attribute: 'value-now' })
  valueNow = 50;

  @property({ type: Number, attribute: 'value-min' })
  valueMin = 0;

  @property({ type: Number, attribute: 'value-max' })
  valueMax = 100;

  @property({ type: String })
  label = '';

  @query('[part="base"]')
  private baseEl!: HTMLElement | null;

  private activePointerId: number | null = null;
  private lastPointerCoord = 0;

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.disabled || event.button !== 0) return;
    this.activePointerId = event.pointerId;
    this.lastPointerCoord = this.orientation === 'vertical' ? event.clientY : event.clientX;
    this.setCustomState('dragging', true);
    if (typeof this.baseEl?.setPointerCapture === 'function') {
      try {
        this.baseEl.setPointerCapture(event.pointerId);
      } catch {
        // Ignore in synthetic environments.
      }
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId || this.disabled) return;
    const coord = this.orientation === 'vertical' ? event.clientY : event.clientX;
    const rawDelta = coord - this.lastPointerCoord;
    this.lastPointerCoord = coord;
    if (rawDelta === 0) return;
    const deltaPx =
      this.orientation === 'horizontal' && this.resolvedDir === 'rtl' ? -rawDelta : rawDelta;
    this.emitEvent<MthResizeDeltaDetail>('mth-resize-delta', {
      detail: { deltaPx, source: 'pointer' },
    });
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) return;
    this.activePointerId = null;
    this.setCustomState('dragging', false);
    if (typeof this.baseEl?.releasePointerCapture === 'function') {
      try {
        this.baseEl.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore in synthetic environments.
      }
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled) return;
    const increment = event.shiftKey ? this.step * 2 : this.step;
    const isRtl = this.resolvedDir === 'rtl';

    if (event.key === 'Home') {
      event.preventDefault();
      this.emitEvent<MthResizeDeltaDetail>('mth-resize-delta', {
        detail: { edge: 'min', source: 'keyboard' },
      });
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.emitEvent<MthResizeDeltaDetail>('mth-resize-delta', {
        detail: { edge: 'max', source: 'keyboard' },
      });
      return;
    }

    if (this.orientation === 'horizontal') {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.emitEvent<MthResizeDeltaDetail>('mth-resize-delta', {
          detail: { deltaPercent: isRtl ? increment : -increment, source: 'keyboard' },
        });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.emitEvent<MthResizeDeltaDetail>('mth-resize-delta', {
          detail: { deltaPercent: isRtl ? -increment : increment, source: 'keyboard' },
        });
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.emitEvent<MthResizeDeltaDetail>('mth-resize-delta', {
        detail: { deltaPercent: -increment, source: 'keyboard' },
      });
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.emitEvent<MthResizeDeltaDetail>('mth-resize-delta', {
        detail: { deltaPercent: increment, source: 'keyboard' },
      });
    }
  };

  override render() {
    const ariaOrientation = this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    const ariaLabel = this.label.trim() || this.t('label');

    return html`
      <div
        part="base"
        role="separator"
        tabindex=${this.disabled ? '-1' : '0'}
        aria-orientation=${ariaOrientation}
        aria-valuenow=${String(Math.round(this.valueNow))}
        aria-valuemin=${String(this.valueMin)}
        aria-valuemax=${String(this.valueMax)}
        aria-label=${ariaLabel}
        @pointerdown=${this.handlePointerDown}
        @pointermove=${this.handlePointerMove}
        @pointerup=${this.handlePointerUp}
        @pointercancel=${this.handlePointerUp}
        @keydown=${this.handleKeyDown}
      >
        <slot></slot>
      </div>
    `;
  }
}
