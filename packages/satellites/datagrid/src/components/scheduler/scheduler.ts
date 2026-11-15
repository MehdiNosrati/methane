import { UIElement, type PropertyValues } from '@methane-ui/core';
import { CalendarCore, RovingFocusController, type CalendarDate } from '@methane-ui/primitives';
import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import {
  attachDynamicSheet,
  captureThemeSnapshot,
  createDynamicSheet,
  escapeCssString,
  HeadlessVirtualizer,
  readCssToken,
  type BaseSatelliteEngine,
} from '../../shared/engine.js';
import { schedulerMessages } from './scheduler.messages.js';
import { schedulerStyles } from './scheduler.styles.js';

export interface SchedulerResource {
  readonly id: string;
  readonly label: string;
}

export interface SchedulerEvent {
  readonly id: string;
  readonly resourceId: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
}

export interface TimelineDayColumn {
  readonly iso: string;
  readonly label: string;
}

export interface MthSchedulerEngine extends BaseSatelliteEngine {
  readonly calendar: CalendarCore;
  readonly virtualizer: HeadlessVirtualizer;
  getTimelineColumns(): ReadonlyArray<TimelineDayColumn>;
  navigateDays(delta: number): string;
}

function parseIsoDate(iso: string): CalendarDate {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return { year: 2026, month: 1, day: 5 };
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function addDaysUtc(iso: string, offset: number): string {
  const d = parseIsoDate(iso);
  const dt = new Date(Date.UTC(d.year, d.month - 1, d.day + offset));
  const y = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const da = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function diffDaysUtc(startIso: string, endIso: string): number {
  const a = parseIsoDate(startIso);
  const b = parseIsoDate(endIso);
  const msA = Date.UTC(a.year, a.month - 1, a.day);
  const msB = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((msB - msA) / 86_400_000);
}

function formatCalendarIso(d: CalendarDate): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

/**
 * `<mth-scheduler>`: resource × timeline scheduling grid wrapping `CalendarCore` and `@tanstack/virtual-core`.
 */
export class MthScheduler extends UIElement {
  static override messages = schedulerMessages;
  static override styles = schedulerStyles;

  @property({ attribute: false })
  resources: ReadonlyArray<SchedulerResource> = [];

  @property({ attribute: false })
  events: ReadonlyArray<SchedulerEvent> = [];

  @property({ type: String, attribute: 'start-date' })
  startDate = '2026-01-05';

  @property({ type: Number })
  days = 7;

  @property({ type: Number, attribute: 'row-height' })
  rowHeight = 48;

  @property({ type: String })
  label = '';

  @query('.viewport')
  private viewportEl!: HTMLElement | null;

  private readonly calendarCore: CalendarCore;
  private readonly rovingFocus: RovingFocusController;
  private readonly dynamicSheet: CSSStyleSheet | null = createDynamicSheet();

  private _engine: MthSchedulerEngine | null = null;
  private timelineCols: TimelineDayColumn[] = [];

  constructor() {
    super();
    this.calendarCore = new CalendarCore(
      { locale: 'en-US', mode: 'single', initialFocusDate: parseIsoDate(this.startDate) },
      null,
    );
    this.rovingFocus = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: false,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('.body-row') ?? []),
    });
  }

  get engine(): MthSchedulerEngine | null {
    return this._engine;
  }

  private computeTimelineColumns(): TimelineDayColumn[] {
    const safeDays = Math.max(1, Math.min(60, Number.isFinite(this.days) ? Math.round(this.days) : 7));
    const fmt = new Intl.DateTimeFormat(this.resolvedLocale, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    const cols: TimelineDayColumn[] = [];
    for (let i = 0; i < safeDays; i++) {
      const iso = addDaysUtc(this.startDate, i);
      const parsed = parseIsoDate(iso);
      const label = fmt.format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)));
      cols.push({ iso, label });
    }
    return cols;
  }

  private createEngine(): MthSchedulerEngine {
    const virtualizer = new HeadlessVirtualizer({
      count: this.resources.length,
      estimateSize: Number.isFinite(this.rowHeight) && this.rowHeight > 0 ? this.rowHeight : 48,
      getScrollElement: () => this.viewportEl,
      onChange: () => {
        if (this.isConnected) {
          this.requestUpdate();
        }
      },
    });
    virtualizer.mount();

    let theme = captureThemeSnapshot(this);

    const engine: MthSchedulerEngine = {
      calendar: this.calendarCore,
      virtualizer,
      get theme() {
        return theme;
      },
      getAppliedToken: (tokenName: string) => {
        theme = captureThemeSnapshot(this);
        return readCssToken(this, tokenName);
      },
      syncTokens: (host: HTMLElement) => {
        theme = captureThemeSnapshot(host);
      },
      getTimelineColumns: () => this.timelineCols,
      navigateDays: (delta: number) => this.navigateDays(delta),
      dispose: () => {
        virtualizer.dispose();
      },
    };
    return engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = this.createEngine();
    }
    this.syncEngine();
    this.syncDynamicSheet();
    if (this.hasUpdated) {
      attachDynamicSheet(this, this.dynamicSheet);
      this._engine.virtualizer.attachElement(this.viewportEl);
    }
  }

  override disconnectedCallback(): void {
    this._engine?.dispose();
    this._engine = null;
    super.disconnectedCallback();
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    attachDynamicSheet(this, this.dynamicSheet);
    this._engine?.virtualizer.attachElement(this.viewportEl);
    this.syncDynamicSheet();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (
      changed.has('resources') ||
      changed.has('events') ||
      changed.has('startDate') ||
      changed.has('days') ||
      changed.has('rowHeight')
    ) {
      this.syncEngine();
    }
    this.setCustomState('empty', this.resources.length === 0);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this._engine?.virtualizer.attachElement(this.viewportEl);
    this.syncDynamicSheet();
  }

  private syncEngine(): void {
    this.calendarCore.setLocale(this.resolvedLocale);
    this.calendarCore.setFocusedDate(parseIsoDate(this.startDate));
    this.timelineCols = this.computeTimelineColumns();
    if (this._engine) {
      this._engine.virtualizer.updateCount(this.resources.length, this.rowHeight);
      this._engine.syncTokens(this);
    }
  }

  private syncDynamicSheet(): void {
    if (!this.dynamicSheet) return;
    const safeHeight =
      Number.isFinite(this.rowHeight) && this.rowHeight > 0 ? Math.round(this.rowHeight) : 48;
    const totalDays = Math.max(1, this.timelineCols.length);
    const rules: string[] = [`:host { --_sc-row-height: ${safeHeight}px; }`];
    for (const ev of this.events) {
      const startOffset = Math.max(0, diffDaysUtc(this.startDate, ev.startDate));
      const span = Math.max(1, diffDaysUtc(ev.startDate, ev.endDate) + 1);
      const startPct = Math.min(100, (startOffset / totalDays) * 100);
      const widthPct = Math.min(100 - startPct, (span / totalDays) * 100);
      const safeId = escapeCssString(ev.id);
      rules.push(
        `[data-event-id="${safeId}"] { inset-inline-start: ${startPct.toFixed(2)}%; inline-size: ${Math.max(4, widthPct).toFixed(2)}%; }`,
      );
    }
    this.dynamicSheet.replaceSync(rules.join('\n'));
  }

  navigateDays(delta: number): string {
    this.calendarCore.navigateByDays(delta);
    const iso = formatCalendarIso(this.calendarCore.focusedDate);
    this.emitEvent('mth-date-navigate', { detail: { date: iso } });
    return iso;
  }

  private handleRowKeyDown(ev: KeyboardEvent, idx: number): void {
    const dirMultiplier = this.resolvedDir === 'rtl' ? -1 : 1;
    if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      this.navigateDays(1 * dirMultiplier);
      return;
    }
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      this.navigateDays(-1 * dirMultiplier);
      return;
    }
    this.rovingFocus.setActiveIndex(idx, false);
  }

  override render() {
    const cols = this.timelineCols;
    return html`
      <div part="base" class="base">
        <div part="viewport" class="viewport">
          <div
            part="grid"
            class="grid"
            role="grid"
            aria-label=${this.label || this.t('gridLabel')}
          >
            <div part="header" class="row header-row" role="row">
              <div class="resource-cell" role="columnheader">${this.t('resourceColumnLabel')}</div>
              <div class="track" role="presentation">
                ${cols.map(
                  (col) =>
                    html`<div class="day-cell" role="columnheader" data-date=${col.iso}>
                      ${col.label}
                    </div>`,
                )}
              </div>
            </div>
            ${this.resources.length === 0
              ? html`
                  <div part="status" class="status" role="status">
                    ${this.t('emptyLabel')}
                    <slot name="fallback"></slot>
                  </div>
                `
              : this.resources.map((resource, idx) => {
                  const rowEvents = this.events.filter((e) => e.resourceId === resource.id);
                  return html`
                    <div
                      part="resource"
                      class="row body-row"
                      role="row"
                      data-resource-id=${resource.id}
                      tabindex=${idx === this.rovingFocus.currentIndex ? '0' : '-1'}
                      @keydown=${(ev: KeyboardEvent) => this.handleRowKeyDown(ev, idx)}
                    >
                      <div class="resource-cell" role="rowheader">${resource.label}</div>
                      <div class="track" role="gridcell">
                        ${cols.map(
                          (col) => html`<div part="slot-cell" class="day-cell" aria-hidden="true" data-date=${col.iso}></div>`,
                        )}
                        ${rowEvents.map(
                          (evt) => html`
                            <button
                              part="event-bar"
                              type="button"
                              class="event-bar"
                              data-event-id=${evt.id}
                              aria-label=${this.t('selectEventLabel', { title: evt.title })}
                              @click=${() =>
                                this.emitEvent('mth-event-select', { detail: { event: evt } })}
                            >
                              ${evt.title}
                            </button>
                          `,
                        )}
                      </div>
                    </div>
                  `;
                })}
          </div>
        </div>
      </div>
    `;
  }
}
