import { UIElement, type PropertyValues } from '@methane/core';
import { CalendarCore, RovingFocusController, type CalendarDate } from '@methane/primitives';
import { html, nothing, svg } from 'lit';
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
import { ganttMessages } from './gantt.messages.js';
import { ganttStyles } from './gantt.styles.js';

export interface GanttTask {
  readonly id: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly progress?: number;
  readonly milestone?: boolean;
  readonly dependencies?: ReadonlyArray<string>;
}

export interface GanttBarLayout {
  readonly task: GanttTask;
  readonly startPct: number;
  readonly widthPct: number;
  readonly rowIndex: number;
}

export interface MthGanttEngine extends BaseSatelliteEngine {
  readonly calendar: CalendarCore;
  readonly virtualizer: HeadlessVirtualizer;
  getLayouts(): ReadonlyArray<GanttBarLayout>;
  getDependencyPaths(): ReadonlyArray<string>;
}

function parseIso(iso: string): CalendarDate {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return { year: 2026, month: 1, day: 1 };
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function diffDays(aIso: string, bIso: string): number {
  const a = parseIso(aIso);
  const b = parseIso(bIso);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000,
  );
}

/**
 * `<mth-gantt>`: project Gantt timeline satellite wrapping `CalendarCore` and `@tanstack/virtual-core`.
 */
export class MthGantt extends UIElement {
  static override messages = ganttMessages;
  static override styles = ganttStyles;

  @property({ attribute: false })
  tasks: ReadonlyArray<GanttTask> = [];

  @property({ type: String, attribute: 'start-date' })
  startDate = '2026-01-01';

  @property({ type: Number })
  days = 14;

  @property({ type: Number, attribute: 'row-height' })
  rowHeight = 40;

  @property({ type: Boolean, attribute: 'show-dependencies', reflect: true })
  showDependencies = true;

  @property({ type: String })
  label = '';

  @query('.viewport')
  private viewportEl!: HTMLElement | null;

  private readonly calendarCore: CalendarCore;
  private readonly rovingFocus: RovingFocusController;
  private readonly dynamicSheet: CSSStyleSheet | null = createDynamicSheet();

  private _engine: MthGanttEngine | null = null;
  private layouts: GanttBarLayout[] = [];
  private depPaths: string[] = [];

  constructor() {
    super();
    this.calendarCore = new CalendarCore(
      { locale: 'en-US', mode: 'single', initialFocusDate: parseIso(this.startDate) },
      null,
    );
    this.rovingFocus = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: false,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('.body-row') ?? []),
    });
  }

  get engine(): MthGanttEngine | null {
    return this._engine;
  }

  private computeLayouts(): { layouts: GanttBarLayout[]; depPaths: string[] } {
    const totalDays = Math.max(1, Number.isFinite(this.days) ? Math.round(this.days) : 14);
    const safeRowH = Number.isFinite(this.rowHeight) && this.rowHeight > 0 ? this.rowHeight : 40;
    const byId = new Map<string, GanttBarLayout>();
    const layouts: GanttBarLayout[] = [];

    this.tasks.forEach((task, rowIndex) => {
      const startOffset = Math.max(0, diffDays(this.startDate, task.startDate));
      const spanDays = task.milestone ? 1 : Math.max(1, diffDays(task.startDate, task.endDate) + 1);
      const startPct = Math.min(96, (startOffset / totalDays) * 100);
      const widthPct = task.milestone
        ? 3
        : Math.max(4, Math.min(100 - startPct, (spanDays / totalDays) * 100));
      const layout: GanttBarLayout = { task, startPct, widthPct, rowIndex };
      layouts.push(layout);
      byId.set(task.id, layout);
    });

    const depPaths: string[] = [];
    for (const item of layouts) {
      for (const depId of item.task.dependencies ?? []) {
        const pred = byId.get(depId);
        if (!pred) continue;
        const x1 = pred.startPct + pred.widthPct;
        const y1 = pred.rowIndex * safeRowH + safeRowH / 2;
        const x2 = item.startPct;
        const y2 = item.rowIndex * safeRowH + safeRowH / 2;
        depPaths.push(`M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`);
      }
    }
    return { layouts, depPaths };
  }

  private createEngine(): MthGanttEngine {
    const virtualizer = new HeadlessVirtualizer({
      count: this.tasks.length,
      estimateSize: Number.isFinite(this.rowHeight) && this.rowHeight > 0 ? this.rowHeight : 40,
      getScrollElement: () => this.viewportEl,
      onChange: () => {
        if (this.isConnected) {
          this.requestUpdate();
        }
      },
    });
    virtualizer.mount();

    let theme = captureThemeSnapshot(this);

    const engine: MthGanttEngine = {
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
      getLayouts: () => this.layouts,
      getDependencyPaths: () => this.depPaths,
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
      changed.has('tasks') ||
      changed.has('startDate') ||
      changed.has('days') ||
      changed.has('rowHeight')
    ) {
      this.syncEngine();
    }
    this.setCustomState('empty', this.tasks.length === 0);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this._engine?.virtualizer.attachElement(this.viewportEl);
    this.syncDynamicSheet();
  }

  private syncEngine(): void {
    this.calendarCore.setLocale(this.resolvedLocale);
    this.calendarCore.setFocusedDate(parseIso(this.startDate));
    const computed = this.computeLayouts();
    this.layouts = computed.layouts;
    this.depPaths = computed.depPaths;
    if (this._engine) {
      this._engine.virtualizer.updateCount(this.tasks.length, this.rowHeight);
      this._engine.syncTokens(this);
    }
  }

  private syncDynamicSheet(): void {
    if (!this.dynamicSheet) return;
    const safeHeight =
      Number.isFinite(this.rowHeight) && this.rowHeight > 0 ? Math.round(this.rowHeight) : 40;
    const rules: string[] = [`:host { --_gt-row-height: ${safeHeight}px; }`];
    for (const layout of this.layouts) {
      const safeId = escapeCssString(layout.task.id);
      const rawProgress = layout.task.progress ?? 0;
      const pct = Math.max(0, Math.min(100, Number.isFinite(rawProgress) ? rawProgress : 0));
      rules.push(
        `[data-task-id="${safeId}"] { inset-inline-start: ${layout.startPct.toFixed(2)}%; ${layout.task.milestone ? '' : `inline-size: ${layout.widthPct.toFixed(2)}%;`} }`,
      );
      rules.push(`[data-progress-id="${safeId}"] { inline-size: ${pct.toFixed(0)}%; }`);
    }
    this.dynamicSheet.replaceSync(rules.join('\n'));
  }

  override render() {
    const safeDays = Math.max(1, Math.min(31, Number.isFinite(this.days) ? Math.round(this.days) : 14));
    const safeRowH = Number.isFinite(this.rowHeight) && this.rowHeight > 0 ? this.rowHeight : 40;
    const svgHeight = Math.max(safeRowH, this.layouts.length * safeRowH);
    const dirAttr = this.closest('[dir]')?.getAttribute('dir')?.toLowerCase();
    const effectiveDir =
      (dirAttr === 'rtl' || dirAttr === 'ltr' ? dirAttr : this.resolvedDir) === 'rtl'
        ? 'rtl'
        : 'ltr';

    return html`
      <div part="base" class="base">
        <div part="viewport" class="viewport">
          ${this.showDependencies && this.depPaths.length > 0
            ? html`
                <svg
                  part="dependencies"
                  class="dependencies-layer"
                  data-dir=${effectiveDir}
                  viewBox=${`0 0 100 ${svgHeight}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  ${this.depPaths.map((d) => svg`<path class="dependency-path" d=${d} />`)}
                </svg>
              `
            : nothing}
          <div
            part="grid"
            class="grid"
            role="grid"
            aria-label=${this.label || this.t('gridLabel')}
          >
            <div part="header" class="row header-row" role="row">
              <div class="task-cell" role="columnheader">${this.t('taskColumnLabel')}</div>
              <div class="timeline-track" role="presentation">
                ${Array.from({ length: safeDays }, (_, i) => i + 1).map(
                  (day) => html`<div class="day-header" role="columnheader">${day}</div>`,
                )}
              </div>
            </div>

            ${this.layouts.length === 0
              ? html`
                  <div part="status" class="status" role="status">
                    ${this.t('emptyLabel')}
                    <slot name="fallback"></slot>
                  </div>
                `
              : this.layouts.map(({ task }, idx) => {
                  const rawProgress = task.progress ?? 0;
                  const pct = Math.max(0, Math.min(100, Number.isFinite(rawProgress) ? rawProgress : 0));
                  const barLabel = task.milestone
                    ? this.t('milestoneLabel', { title: task.title })
                    : this.t('taskBarLabel', { title: task.title, progress: pct });
                  return html`
                    <div
                      part="row"
                      class="row body-row"
                      role="row"
                      data-row-id=${task.id}
                      tabindex=${idx === this.rovingFocus.currentIndex ? '0' : '-1'}
                      @keydown=${() => {
                        this.rovingFocus.setActiveIndex(idx, false);
                      }}
                    >
                      <div class="task-cell" role="rowheader">${task.title}</div>
                      <div class="timeline-track" role="gridcell">
                        <button
                          part=${task.milestone ? 'milestone' : 'task-bar'}
                          type="button"
                          class="task-bar"
                          data-task-id=${task.id}
                          data-milestone=${task.milestone ? 'true' : 'false'}
                          aria-label=${barLabel}
                          @click=${() =>
                            this.emitEvent('mth-task-select', { detail: { task } })}
                        >
                          ${task.milestone
                            ? nothing
                            : html`
                                <span
                                  class="task-progress"
                                  data-progress-id=${task.id}
                                  aria-hidden="true"
                                ></span>
                                <span>${task.title}</span>
                              `}
                        </button>
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
