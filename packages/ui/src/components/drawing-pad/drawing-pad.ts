import { UIElement, type PropertyValues, html, property, query, state } from '@methane-ui/core';
import { drawingPadMessages } from './drawing-pad.messages.js';
import { drawingPadStyles } from './drawing-pad.styles.js';

export type DrawingTool = 'pen' | 'eraser';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  tool: DrawingTool;
  color: string;
  width: number;
  points: DrawingPoint[];
}

/**
 * Pointer-capture and keyboard-capable canvas sketchpad with undo, clear, pen, and eraser.
 */
export class MthDrawingPad extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = drawingPadStyles;
  static override messages = drawingPadMessages;

  @property({ type: String, reflect: true })
  tool: DrawingTool = 'pen';

  @property({ type: Number, attribute: 'stroke-width' })
  strokeWidth = 3;

  @property({ type: String, attribute: 'stroke-color' })
  strokeColor = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  @state()
  private strokes: DrawingStroke[] = [];

  @query('[part="canvas"]')
  private canvasEl!: HTMLCanvasElement | null;

  private activePointerId: number | null = null;
  private activeStroke: DrawingStroke | null = null;
  private keyboardDrawing = false;
  private cursorX = 200;
  private cursorY = 110;

  get strokeCount(): number {
    return this.strokes.length;
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
  }

  undo(): void {
    if (this.disabled || this.strokes.length === 0) return;
    this.strokes = this.strokes.slice(0, -1);
    this.redraw();
    this.emitEvent('mth-change', { detail: { strokeCount: this.strokes.length } });
  }

  clear(): void {
    if (this.disabled) return;
    this.strokes = [];
    this.activeStroke = null;
    this.keyboardDrawing = false;
    this.redraw();
    this.emitEvent('mth-change', { detail: { strokeCount: 0 } });
  }

  toDataURL(type = 'image/png'): string {
    if (!this.canvasEl) return '';
    try {
      const ctx = this.canvasEl.getContext('2d');
      return ctx ? this.canvasEl.toDataURL(type) : '';
    } catch {
      return '';
    }
  }

  private resolveColor(): string {
    if (this.strokeColor.trim()) return this.strokeColor.trim();
    if (typeof getComputedStyle === 'function') {
      const color = getComputedStyle(this).color;
      if (color) return color;
    }
    return 'currentColor';
  }

  private redraw(): void {
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
    for (const stroke of this.strokes) {
      if (stroke.points.length === 0) continue;
      ctx.save();
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(1, stroke.width);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0]!.x, stroke.points[0]!.y);
      for (let i = 1; i < stroke.points.length; i += 1) {
        ctx.lineTo(stroke.points[i]!.x, stroke.points[i]!.y);
      }
      if (stroke.points.length === 1) {
        ctx.lineTo(stroke.points[0]!.x + 0.1, stroke.points[0]!.y + 0.1);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  private getCanvasPoint(event: PointerEvent): DrawingPoint {
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
    if (this.disabled) return;
    const canvas = event.currentTarget as HTMLCanvasElement;
    this.activePointerId = event.pointerId;
    this.activeStroke = {
      tool: this.tool,
      color: this.resolveColor(),
      width: this.strokeWidth,
      points: [this.getCanvasPoint(event)],
    };
    canvas.setPointerCapture?.(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.disabled || this.activePointerId !== event.pointerId || !this.activeStroke) return;
    this.activeStroke.points.push(this.getCanvasPoint(event));
    const existing = this.strokes.filter((s) => s !== this.activeStroke);
    this.strokes = [...existing, this.activeStroke];
    this.redraw();
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId || !this.activeStroke) return;
    const finished = this.activeStroke;
    this.activePointerId = null;
    this.activeStroke = null;
    const existing = this.strokes.filter((s) => s !== finished);
    this.strokes = [...existing, finished];
    this.redraw();
    this.emitEvent('mth-change', { detail: { strokeCount: this.strokes.length } });
  };

  private readonly handleCanvasKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled) return;
    const step = event.shiftKey ? 20 : 8;
    const maxW = this.canvasEl?.width ?? 480;
    const maxH = this.canvasEl?.height ?? 220;

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!this.keyboardDrawing) {
        this.keyboardDrawing = true;
        this.activeStroke = {
          tool: this.tool,
          color: this.resolveColor(),
          width: this.strokeWidth,
          points: [{ x: this.cursorX, y: this.cursorY }],
        };
        this.strokes = [...this.strokes, this.activeStroke];
        this.redraw();
      } else {
        this.keyboardDrawing = false;
        this.activeStroke = null;
        this.emitEvent('mth-change', { detail: { strokeCount: this.strokes.length } });
      }
      return;
    }

    let moved = true;
    switch (event.key) {
      case 'ArrowLeft':
        this.cursorX = Math.max(0, this.cursorX - step);
        break;
      case 'ArrowRight':
        this.cursorX = Math.min(maxW, this.cursorX + step);
        break;
      case 'ArrowUp':
        this.cursorY = Math.max(0, this.cursorY - step);
        break;
      case 'ArrowDown':
        this.cursorY = Math.min(maxH, this.cursorY + step);
        break;
      default:
        moved = false;
    }

    if (moved) {
      event.preventDefault();
      if (this.keyboardDrawing && this.activeStroke) {
        this.activeStroke.points.push({ x: this.cursorX, y: this.cursorY });
        this.redraw();
      }
    }
  };

  protected override render() {
    return html`
      <div part="base" class="base">
        <div part="toolbar" class="toolbar" role="toolbar" aria-label=${this.label || this.t('canvasLabel')}>
          <button
            type="button"
            part="tool-button"
            class="tool-button"
            aria-pressed=${this.tool === 'pen' ? 'true' : 'false'}
            ?disabled=${this.disabled}
            @click=${() => {
              this.tool = 'pen';
            }}
          >
            ${this.t('penTool')}
          </button>
          <button
            type="button"
            part="tool-button"
            class="tool-button"
            aria-pressed=${this.tool === 'eraser' ? 'true' : 'false'}
            ?disabled=${this.disabled}
            @click=${() => {
              this.tool = 'eraser';
            }}
          >
            ${this.t('eraserTool')}
          </button>
          <label class="width-label">
            <span>${this.t('strokeWidthLabel')}</span>
            <input
              part="width-input"
              type="range"
              min="1"
              max="24"
              .value=${String(this.strokeWidth)}
              aria-label=${this.t('strokeWidthLabel')}
              ?disabled=${this.disabled}
              @input=${(e: Event) => {
                this.strokeWidth = Number.parseInt((e.currentTarget as HTMLInputElement).value, 10) || 1;
              }}
            />
          </label>
          <button
            type="button"
            part="undo-button"
            class="action-button"
            ?disabled=${this.disabled || this.strokes.length === 0}
            @click=${() => this.undo()}
          >
            ${this.t('undo')}
          </button>
          <button
            type="button"
            part="clear-button"
            class="action-button"
            ?disabled=${this.disabled || this.strokes.length === 0}
            @click=${() => this.clear()}
          >
            ${this.t('clear')}
          </button>
        </div>
        <canvas
          part="canvas"
          class="canvas"
          width="480"
          height="220"
          tabindex=${this.disabled ? '-1' : '0'}
          role="img"
          aria-label=${this.label || this.t('canvasLabel')}
          @pointerdown=${this.handlePointerDown}
          @pointermove=${this.handlePointerMove}
          @pointerup=${this.handlePointerUp}
          @pointercancel=${this.handlePointerUp}
          @keydown=${this.handleCanvasKeyDown}
        ></canvas>
      </div>
    `;
  }
}
