import { UIElement, type PropertyValues } from '@methane/core';
import { DragSortController } from '@methane/primitives';
import { html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { beforeAfterMessages } from './before-after.messages.js';
import { beforeAfterStyles } from './before-after.styles.js';

/**
 * `<mth-before-after>`: accessible image/content comparison slider supporting pointer
 * scrubbing, `DragSortController`, RTL-aware keyboard navigation, and adopted CSS sheet clipping.
 */
export class MthBeforeAfter extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = beforeAfterMessages;
  static override styles = beforeAfterStyles;

  @property({ type: Number, reflect: true })
  position = 50;

  @property({ type: Number })
  step = 2;

  @property({ type: String })
  label = '';

  @property({ type: String, attribute: 'before-label' })
  beforeLabel = '';

  @property({ type: String, attribute: 'after-label' })
  afterLabel = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @state()
  private dragging = false;

  @query('.base')
  private baseEl!: HTMLElement;

  @query('.handle')
  private handleEl!: HTMLButtonElement;

  private splitSheet: CSSStyleSheet | null = null;
  private readonly dragCtrl: DragSortController<HTMLElement>;

  constructor() {
    super();
    this.dragCtrl = new DragSortController<HTMLElement>(this, {
      orientation: 'horizontal',
      getItems: () => (this.handleEl ? [this.handleEl] : []),
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSplitSheet();
    this.syncCustomStates();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('position')) {
      this.syncSplitSheet();
    }
    this.syncCustomStates();
  }

  private syncCustomStates(): void {
    this.setCustomState('dragging', this.dragging || this.dragCtrl.isDragging);
    this.setCustomState('disabled', this.disabled);
  }

  private syncSplitSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (!this.splitSheet) {
      this.splitSheet = new CSSStyleSheet();
    }
    if (typeof this.splitSheet.replaceSync === 'function') {
      const clamped = this.clampPosition(this.position);
      this.splitSheet.replaceSync(`:host { --_split-position: ${clamped}%; }`);
      if (!root.adoptedStyleSheets.includes(this.splitSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.splitSheet];
      }
    }
  }

  private clampPosition(val: number): number {
    if (!Number.isFinite(val)) return 50;
    return Math.round(Math.max(0, Math.min(100, val)) * 100) / 100;
  }

  private setPosition(next: number): void {
    if (this.disabled) return;
    const clamped = this.clampPosition(next);
    if (clamped === this.position) return;
    this.position = clamped;
    this.syncSplitSheet();
    this.dispatchEvent(
      new CustomEvent<{ position: number }>('mth-change', {
        bubbles: true,
        composed: true,
        detail: { position: clamped },
      }),
    );
  }

  private updateFromPointer(clientX: number): void {
    const rect = this.baseEl?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const ratio = (clientX - rect.left) / rect.width;
    const isRtl = this.resolvedDir === 'rtl';
    const percent = (isRtl ? 1 - ratio : ratio) * 100;
    this.setPosition(percent);
  }

  private handlePointerDown = (e: PointerEvent): void => {
    if (this.disabled) return;
    this.dragging = true;
    this.syncCustomStates();
    this.handleEl?.focus();
    this.updateFromPointer(e.clientX);
    if (typeof this.baseEl?.setPointerCapture === 'function') {
      try {
        this.baseEl.setPointerCapture(e.pointerId);
      } catch {
        // Ignore synthetic pointer capture failure in JSDOM.
      }
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.dragging || this.disabled) return;
    this.updateFromPointer(e.clientX);
  };

  private handlePointerUp = (): void => {
    if (!this.dragging) return;
    this.dragging = false;
    this.syncCustomStates();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    const isRtl = this.resolvedDir === 'rtl';
    const forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
    const small = Math.max(1, this.step || 2);
    const large = Math.max(10, small * 5);

    if (e.key === forwardKey) {
      e.preventDefault();
      this.setPosition(this.position + small);
    } else if (e.key === backKey) {
      e.preventDefault();
      this.setPosition(this.position - small);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      this.setPosition(this.position + large);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      this.setPosition(this.position - large);
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.setPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      this.setPosition(100);
    }
  };

  protected override render() {
    const clamped = this.clampPosition(this.position);
    const beforeAria = this.beforeLabel || this.t('beforeLabel');
    const afterAria = this.afterLabel || this.t('afterLabel');

    return html`
      <div
        class="base"
        part="base"
        role="region"
        aria-label=${this.label || this.t('comparisonLabel')}
        @pointerdown=${this.handlePointerDown}
        @pointermove=${this.handlePointerMove}
        @pointerup=${this.handlePointerUp}
        @pointercancel=${this.handlePointerUp}
      >
        <div class="after" part="after" aria-label=${afterAria}>
          <slot name="after"></slot>
        </div>

        <div class="before" part="before" aria-label=${beforeAria}>
          <slot name="before"></slot>
        </div>

        <div class="divider" part="divider" aria-hidden="true"></div>

        <button
          type="button"
          class="handle"
          part="handle"
          role="slider"
          aria-label=${this.label || this.t('dividerLabel')}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow=${String(clamped)}
          aria-valuetext=${`${clamped}%`}
          ?disabled=${this.disabled}
          @keydown=${this.handleKeyDown}
        >
          ⇄
        </button>
      </div>
    `;
  }
}
