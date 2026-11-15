import { UIElement, type PropertyValues, html, nothing, property, query, state } from '@methane/core';
import { FormControlController } from '@methane/primitives';
import { signaturePadMessages } from './signature-pad.messages.js';
import { signaturePadStyles } from './signature-pad.styles.js';

export interface SignaturePoint {
  x: number;
  y: number;
}

/**
 * Form-associated pointer-capture signature pad with undo/clear and keyboard fallback.
 */
export class MthSignaturePad extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = signaturePadStyles;
  static override messages = signaturePadMessages;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String, attribute: 'pen-color' })
  penColor = '';

  @property({ type: Number, attribute: 'pen-width' })
  penWidth = 2;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private strokes: SignaturePoint[][] = [];

  @state()
  private typedText = '';

  @query('[part="canvas"]')
  private canvasEl!: HTMLCanvasElement | null;

  private readonly formCtrl: FormControlController;
  private activePointerId: number | null = null;
  private currentStroke: SignaturePoint[] | null = null;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: signaturePadMessages,
      validator: (ctx) => {
        const current = typeof ctx.value === 'string' ? ctx.value : '';
        if (ctx.required && !current.trim()) {
          return { flags: { valueMissing: true }, message: this.t('requiredError') };
        }
        return null;
      },
      onValueSync: (nextValue) => {
        if (!nextValue) {
          this.strokes = [];
          this.typedText = '';
          this.redrawCanvas();
        }
        this.value = nextValue;
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
    });
  }

  get isEmpty(): boolean {
    return this.strokes.length === 0 && !this.typedText.trim() && !this.value.trim();
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage || this.internals?.validationMessage || '';
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.closest('form');
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  protected override onFirstConnect(): void {
    const initialDefault = this.getAttribute('value') ?? this.value ?? '';
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changed.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
    }
    if (changed.has('value')) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
  }

  clear(): void {
    if (this.effectivelyDisabled || this.readonly) return;
    this.strokes = [];
    this.typedText = '';
    this.redrawCanvas();
    this.commitValue('');
  }

  undo(): void {
    if (this.effectivelyDisabled || this.readonly || this.strokes.length === 0) return;
    this.strokes = this.strokes.slice(0, -1);
    this.redrawCanvas();
    this.commitValue(this.serializeSignature());
  }

  private resolveStrokeColor(): string {
    if (this.penColor.trim()) return this.penColor.trim();
    if (typeof getComputedStyle === 'function') {
      const color = getComputedStyle(this).color;
      if (color) return color;
    }
    return 'currentColor';
  }

  private redrawCanvas(): void {
    const canvas = this.canvasEl;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = this.resolveStrokeColor();
    ctx.lineWidth = Math.max(1, this.penWidth);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of this.strokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0]!.x, stroke[0]!.y);
      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i]!.x, stroke[i]!.y);
      }
      if (stroke.length === 1) {
        ctx.lineTo(stroke[0]!.x + 0.1, stroke[0]!.y + 0.1);
      }
      ctx.stroke();
    }
  }

  private serializeSignature(): string {
    if (this.strokes.length === 0) {
      return this.typedText.trim();
    }
    if (this.canvasEl) {
      try {
        const ctx = this.canvasEl.getContext('2d');
        if (ctx) {
          return this.canvasEl.toDataURL('image/png');
        }
      } catch {
        // Fallback below when canvas 2d is unavailable.
      }
    }
    return `strokes:${this.strokes.length}`;
  }

  private commitValue(next: string): void {
    this.value = next;
    this.formCtrl.setValue(next, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', {
      detail: {
        value: next,
        isEmpty: !next.trim(),
      },
    });
  }

  private getCanvasPoint(event: PointerEvent): SignaturePoint {
    const rect = this.canvasEl?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: event.clientX, y: event.clientY };
    }
    const width = this.canvasEl?.width || rect.width;
    const height = this.canvasEl?.height || rect.height;
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    };
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.effectivelyDisabled || this.readonly) return;
    const canvas = event.currentTarget as HTMLCanvasElement;
    this.activePointerId = event.pointerId;
    const pt = this.getCanvasPoint(event);
    this.currentStroke = [pt];
    canvas.setPointerCapture?.(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.effectivelyDisabled || this.readonly) return;
    if (this.activePointerId !== event.pointerId || !this.currentStroke) return;
    this.currentStroke.push(this.getCanvasPoint(event));
    const base = this.strokes.filter((s) => s !== this.currentStroke);
    this.strokes = [...base, this.currentStroke];
    this.redrawCanvas();
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId || !this.currentStroke) return;
    const finished = this.currentStroke;
    this.activePointerId = null;
    this.currentStroke = null;
    // Append finalized stroke cleanly.
    const existing = this.strokes.filter((s) => s !== finished);
    this.strokes = [...existing, finished];
    this.redrawCanvas();
    this.commitValue(this.serializeSignature());
  };

  private readonly handleTypedChange = (event: Event): void => {
    if (this.effectivelyDisabled || this.readonly) return;
    const input = event.currentTarget as HTMLInputElement;
    this.typedText = input.value;
    this.commitValue(this.typedText.trim() || (this.strokes.length > 0 ? this.serializeSignature() : ''));
  };

  protected override render() {
    const isDisabled = this.effectivelyDisabled;
    const labelId = this.label ? 'sig-label' : undefined;

    return html`
      <div part="base" class="base">
        ${this.label
          ? html`<label id="sig-label" for="sig-typed" part="label" class="label">${this.label}</label>`
          : nothing}
        <canvas
          part="canvas"
          class="canvas"
          width="400"
          height="160"
          role="img"
          aria-label=${this.label || this.t('canvasLabel')}
          @pointerdown=${this.handlePointerDown}
          @pointermove=${this.handlePointerMove}
          @pointerup=${this.handlePointerUp}
          @pointercancel=${this.handlePointerUp}
        ></canvas>
        <div class="footer">
          <input
            id="sig-typed"
            part="typed-input"
            class="typed-input"
            type="text"
            .value=${this.typedText}
            placeholder=${this.t('typedPlaceholder')}
            aria-labelledby=${labelId ?? nothing}
            aria-label=${labelId ? nothing : this.t('typedPlaceholder')}
            ?disabled=${isDisabled}
            ?readonly=${this.readonly}
            @change=${this.handleTypedChange}
          />
          <div part="actions" class="actions">
            <button
              type="button"
              part="undo-button"
              class="action-btn"
              ?disabled=${isDisabled || this.readonly || this.strokes.length === 0}
              @click=${() => this.undo()}
            >
              ${this.t('undo')}
            </button>
            <button
              type="button"
              part="clear-button"
              class="action-btn"
              ?disabled=${isDisabled || this.readonly}
              @click=${() => this.clear()}
            >
              ${this.t('clear')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
