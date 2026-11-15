import { UIElement, type PropertyValues } from '@methane/core';
import { OverlayController, type OverlayCloseReason } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { floatingPanelMessages } from './floating-panel.messages.js';
import { floatingPanelStyles } from './floating-panel.styles.js';

export type FloatingPanelDock = 'none' | 'start' | 'end' | 'bottom';

/**
 * `<mth-floating-panel>`: non-modal movable, dockable, and minimizable utility panel
 * backed by `OverlayController` and adopted-stylesheet coordinates.
 */
export class MthFloatingPanel extends UIElement {
  static override messages = floatingPanelMessages;
  static override styles = floatingPanelStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  minimized = false;

  @property({ type: String, reflect: true })
  dock: FloatingPanelDock = 'none';

  @property({ type: Number })
  x = 24;

  @property({ type: Number })
  y = 24;

  @property({ type: Boolean, reflect: true })
  closable = true;

  @property({ type: Boolean, reflect: true })
  minimizable = true;

  @property({ type: Boolean, reflect: true })
  dockable = true;

  @property({ type: Boolean, attribute: 'close-on-escape', reflect: true })
  closeOnEscape = true;

  @state()
  private hasFooter = false;

  @query('.panel')
  private surfaceEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private positionSheet: CSSStyleSheet | null = null;
  private syncingFromController = false;
  private triggerEl: HTMLElement | null = null;
  private dragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor() {
    super();

    this.overlayCtrl = new OverlayController(this, {
      mode: 'non-modal',
      surface: () => this.surfaceEl,
      trigger: () => this.triggerEl,
      closeOnEscape: this.closeOnEscape,
      lightDismiss: false,
      restoreFocus: false,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.syncingFromController = false;
        this.setCustomState('open', nextOpen);
      },
    });
  }

  protected override firstUpdated(_changed: PropertyValues): void {
    super.firstUpdated(_changed);
    this.syncPositionSheet();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('closeOnEscape')) {
      this.overlayCtrl.updateOptions({ closeOnEscape: this.closeOnEscape });
    }
    if (changedProperties.has('minimized')) {
      this.setCustomState('minimized', this.minimized);
    }
    if (changedProperties.has('dock')) {
      this.setCustomState('docked', this.dock !== 'none');
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('x') || changedProperties.has('y')) {
      this.syncPositionSheet();
    }
    if (changedProperties.has('open') && !this.syncingFromController) {
      if (this.open && !this.overlayCtrl.open) {
        void this.overlayCtrl.show();
      } else if (!this.open && this.overlayCtrl.open) {
        void this.overlayCtrl.hide('programmatic');
      }
    }
  }

  public show(trigger?: HTMLElement | null): Promise<boolean> {
    if (trigger !== undefined) {
      this.triggerEl = trigger;
    }
    return this.overlayCtrl.show();
  }

  public hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    return this.overlayCtrl.hide(reason);
  }

  public moveTo(nextX: number, nextY: number): void {
    const safeX = Number.isFinite(nextX) ? Math.max(0, Math.round(nextX)) : 0;
    const safeY = Number.isFinite(nextY) ? Math.max(0, Math.round(nextY)) : 0;
    if (this.dock !== 'none') {
      this.setDock('none');
    }
    this.x = safeX;
    this.y = safeY;
    this.syncPositionSheet();
    this.emitEvent('mth-move', { detail: { x: safeX, y: safeY } });
  }

  public toggleMinimize(): void {
    this.minimized = !this.minimized;
    this.setCustomState('minimized', this.minimized);
    this.emitEvent('mth-minimize-change', { detail: { minimized: this.minimized } });
  }

  public setDock(next: FloatingPanelDock): void {
    if (next === this.dock) {
      return;
    }
    this.dock = next;
    this.setCustomState('docked', next !== 'none');
    this.emitEvent('mth-dock-change', { detail: { dock: next } });
  }

  private syncPositionSheet(): void {
    const root = this.shadowRoot;
    if (!root || typeof CSSStyleSheet === 'undefined' || !Array.isArray(root.adoptedStyleSheets)) {
      return;
    }
    if (!this.positionSheet) {
      this.positionSheet = new CSSStyleSheet();
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.positionSheet];
    }
    const safeX = Number.isFinite(this.x) ? this.x : 24;
    const safeY = Number.isFinite(this.y) ? this.y : 24;
    this.positionSheet.replaceSync(`:host { --_panel-x: ${safeX}px; --_panel-y: ${safeY}px; }`);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    this.dragging = true;
    this.dragOffsetX = event.clientX - this.x;
    this.dragOffsetY = event.clientY - this.y;
    this.setCustomState('dragging', true);
    const target = event.currentTarget as HTMLElement | null;
    target?.setPointerCapture?.(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }
    this.moveTo(event.clientX - this.dragOffsetX, event.clientY - this.dragOffsetY);
  };

  private readonly handlePointerUp = (): void => {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    this.setCustomState('dragging', false);
  };

  private readonly handleDragKeyDown = (event: KeyboardEvent): void => {
    const step = event.shiftKey ? 32 : 12;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.moveTo(this.x - step, this.y);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.moveTo(this.x + step, this.y);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveTo(this.x, this.y - step);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveTo(this.x, this.y + step);
        break;
      default:
        break;
    }
  };

  private readonly handleDockClick = (): void => {
    this.setDock(this.dock === 'none' ? 'end' : 'none');
  };

  private readonly handleMinimizeClick = (): void => {
    this.toggleMinimize();
  };

  private readonly handleCloseClick = (): void => {
    void this.hide('programmatic');
  };

  private readonly handleFooterSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement | null;
    this.hasFooter = (slot?.assignedNodes({ flatten: true }).length ?? 0) > 0;
  };

  protected override render() {
    const resolvedLabel = this.label || this.t('defaultLabel');
    const headingId = 'mth-floating-panel-title';

    return html`
      <section
        class="panel"
        part="base"
        role="region"
        aria-labelledby=${headingId}
        ?hidden=${!this.open}
      >
        <header class="header" part="header">
          <div
            class="drag-handle"
            part="drag-handle"
            tabindex="0"
            role="group"
            aria-label=${resolvedLabel}
            @pointerdown=${this.handlePointerDown}
            @pointermove=${this.handlePointerMove}
            @pointerup=${this.handlePointerUp}
            @keydown=${this.handleDragKeyDown}
          >
            <h2 id=${headingId} class="title" part="title">
              <slot name="header">${resolvedLabel}</slot>
            </h2>
          </div>

          <div class="controls" part="controls">
            ${this.dockable
              ? html`
                  <button
                    type="button"
                    class="control-btn"
                    part="dock-button"
                    aria-label=${this.dock === 'none'
                      ? this.t('dockEndLabel')
                      : this.t('undockLabel')}
                    aria-pressed=${String(this.dock !== 'none')}
                    @click=${this.handleDockClick}
                  >
                    ${this.dock === 'none' ? this.t('dockShort') : this.t('floatShort')}
                  </button>
                `
              : nothing}
            ${this.minimizable
              ? html`
                  <button
                    type="button"
                    class="control-btn"
                    part="minimize-button"
                    aria-label=${this.minimized
                      ? this.t('restoreLabel')
                      : this.t('minimizeLabel')}
                    aria-expanded=${String(!this.minimized)}
                    @click=${this.handleMinimizeClick}
                  >
                    ${this.minimized ? '+' : '−'}
                  </button>
                `
              : nothing}
            ${this.closable
              ? html`
                  <button
                    type="button"
                    class="control-btn"
                    part="close-button"
                    aria-label=${this.t('closeLabel')}
                    @click=${this.handleCloseClick}
                  >
                    ✕
                  </button>
                `
              : nothing}
          </div>
        </header>

        <div class="body" part="body" ?hidden=${this.minimized}>
          <slot></slot>
        </div>

        <footer class="footer" part="footer" ?hidden=${this.minimized || !this.hasFooter}>
          <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
        </footer>
      </section>
    `;
  }
}
