import { html, property, svg, UIElement, type PropertyValues, type TemplateResult } from '@methane/core';
import { RovingFocusController, SelectionController } from '@methane/primitives';
import { clampNumber, createMapEngine, type MapEngineHandle } from '../shared/map-engine.js';
import { floorPlanMessages } from './floor-plan.messages.js';
import { floorPlanStyles } from './floor-plan.styles.js';

export interface FloorPlanRoom {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly level?: string;
  readonly disabled?: boolean;
}

export class MthFloorPlan extends UIElement {
  static override styles = floorPlanStyles;
  static override messages = floorPlanMessages;

  @property({ attribute: false }) rooms: ReadonlyArray<FloorPlanRoom> = [];
  @property({ attribute: false }) selectedIds: ReadonlyArray<string> = [];
  @property({ type: String }) level = '1';
  @property({ type: Number }) zoom = 1;
  @property({ type: Number, attribute: 'pan-x' }) panX = 0;
  @property({ type: Number, attribute: 'pan-y' }) panY = 0;
  @property({ type: Boolean, reflect: true }) multiple = false;
  @property({ type: String }) label = '';

  private _engine: MapEngineHandle | null = null;
  private transformSheet: CSSStyleSheet | null = null;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.selectionCtrl = new SelectionController<string>(this, {
      mode: this.multiple ? 'multiple' : 'single',
      allowEmpty: true,
      onChange: (selected) => {
        this.selectedIds = selected;
      },
    });
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () =>
        Array.from(
          this.shadowRoot?.querySelectorAll<HTMLElement>('.room-btn:not([aria-disabled="true"])') ?? [],
        ),
    });
  }

  get engine(): MapEngineHandle | null {
    return this._engine;
  }

  private get isRtl(): boolean {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = createMapEngine({ host: this, zoom: this.zoom });
    }
    this.setCustomState('multiple', this.multiple);
    this.syncSelectionItems();
  }

  override disconnectedCallback(): void {
    if (this._engine) {
      this._engine.remove();
      this._engine = null;
    }
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('multiple')) {
      this.selectionCtrl.mode = this.multiple ? 'multiple' : 'single';
      this.setCustomState('multiple', this.multiple);
    }
    if (changed.has('rooms') || changed.has('level')) {
      this.syncSelectionItems();
    }
    if (changed.has('selectedIds')) {
      this.selectionCtrl.setSelection(this.selectedIds);
    }
    this.rovingCtrl.updateOptions({ dir: this.isRtl ? 'rtl' : 'ltr' });
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.applyPanZoomSheet();
    this._engine?.syncThemeTokens();
  }

  private get visibleRooms(): ReadonlyArray<FloorPlanRoom> {
    return this.rooms.filter((r) => !r.level || r.level === this.level);
  }

  private syncSelectionItems(): void {
    this.selectionCtrl.setItems(
      this.visibleRooms.map((r) => ({ value: r.id, disabled: Boolean(r.disabled) })),
    );
  }

  private applyPanZoomSheet(): void {
    const root = this.shadowRoot;
    if (!root || typeof CSSStyleSheet === 'undefined') return;
    const safeZoom = clampNumber(this.zoom, 0.5, 4);
    const safePanX = clampNumber(this.panX, -2000, 2000);
    const safePanY = clampNumber(this.panY, -2000, 2000);
    if (!this.transformSheet) {
      this.transformSheet = new CSSStyleSheet();
    }
    this.transformSheet.replaceSync(
      `:host { --_fp-zoom: ${safeZoom}; --_fp-pan-x: ${safePanX}px; --_fp-pan-y: ${safePanY}px; }`,
    );
    const current = root.adoptedStyleSheets ?? [];
    if (!current.includes(this.transformSheet)) {
      root.adoptedStyleSheets = [...current, this.transformSheet];
    }
  }

  zoomIn(): void {
    this.setTransform(clampNumber(this.zoom + 0.25, 0.5, 4), this.panX, this.panY);
  }

  zoomOut(): void {
    this.setTransform(clampNumber(this.zoom - 0.25, 0.5, 4), this.panX, this.panY);
  }

  resetView(): void {
    this.setTransform(1, 0, 0);
  }

  private setTransform(zoom: number, panX: number, panY: number): void {
    this.zoom = zoom;
    this.panX = panX;
    this.panY = panY;
    this._engine?.setView({ zoom });
    this.emitEvent('mth-floor-zoom', { detail: { zoom, panX, panY } });
  }

  selectRoom(room: FloorPlanRoom): void {
    if (room.disabled) return;
    if (this.multiple) {
      this.selectionCtrl.toggle(room.id);
    } else {
      this.selectionCtrl.select(room.id);
    }
    this.emitEvent('mth-room-select', {
      detail: {
        selectedIds: this.selectionCtrl.selectedValues,
        room,
      },
    });
  }

  protected override render(): TemplateResult {
    const visible = this.visibleRooms;
    const regionLabel = this.label || this.t('regionLabel');
    const selectedSet = this.selectionCtrl.selectedSet;

    return html`
      <div class="base" part="base" role="region" aria-label=${regionLabel}>
        <div class="header">
          <span class="level-badge">${this.t('levelLabel', { level: this.level })}</span>
          <div class="controls">
            <button type="button" class="ctrl-btn" aria-label=${this.t('zoomIn')} @click=${() => this.zoomIn()}>
              +
            </button>
            <button type="button" class="ctrl-btn" aria-label=${this.t('zoomOut')} @click=${() => this.zoomOut()}>
              -
            </button>
            <button type="button" class="ctrl-btn" aria-label=${this.t('resetPanZoom')} @click=${() => this.resetView()}>
              0
            </button>
          </div>
        </div>

        <div class="viewport" part="viewport">
          <slot name="fallback"></slot>
          <svg class="svg-stage" part="svg" viewBox="0 0 360 180" aria-hidden="true">
            ${visible.map((room) => {
              const isSelected = selectedSet.has(room.id);
              const classes = [
                'room-shape',
                isSelected ? 'selected' : '',
                room.disabled ? 'disabled' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return svg`
                <g @click=${() => this.selectRoom(room)}>
                  <rect
                    class=${classes}
                    x=${room.x}
                    y=${room.y}
                    width=${room.width}
                    height=${room.height}
                    rx="4"
                  ></rect>
                  <text class="room-label" x=${room.x + 6} y=${room.y + 16}>${room.name}</text>
                </g>
              `;
            })}
          </svg>
        </div>

        <div class="rooms" part="rooms" role="toolbar" aria-label=${this.t('roomsLabel')}>
          ${visible.map((room, idx) => {
            const isSelected = selectedSet.has(room.id);
            const ariaLabel = room.disabled
              ? this.t('roomUnavailable', { name: room.name })
              : isSelected
                ? this.t('roomSelected', { name: room.name })
                : room.name;
            return html`
              <button
                type="button"
                class="room-btn"
                part="room-button"
                tabindex=${idx === 0 && !room.disabled ? '0' : '-1'}
                aria-pressed=${isSelected ? 'true' : 'false'}
                aria-disabled=${room.disabled ? 'true' : 'false'}
                aria-label=${ariaLabel}
                @click=${() => this.selectRoom(room)}
              >
                ${room.name}
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }
}
