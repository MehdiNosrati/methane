import { UIElement, type PropertyValues } from '@methane/core';
import {
  RovingFocusController,
  addCalendarDays,
  formatIsoDate,
  getDayOfWeek,
  getTodayCalendarDate,
  type CalendarDate,
} from '@methane/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { calendarHeatmapMessages } from './calendar-heatmap.messages.js';
import { calendarHeatmapStyles } from './calendar-heatmap.styles.js';

export interface CalendarHeatmapEntry {
  readonly date: string;
  readonly count: number;
}

interface HeatmapCellModel {
  readonly iso: string;
  readonly count: number;
  readonly level: 0 | 1 | 2 | 3 | 4;
}

function parseIsoDate(iso: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function parseDataEntries(raw: string): CalendarHeatmapEntry[] {
  if (!raw.trim()) return [];
  const entries: CalendarHeatmapEntry[] = [];
  for (const part of raw.split(',')) {
    const [datePart, countPart] = part.split(':');
    if (!datePart) continue;
    const count = Number(countPart ?? '0');
    if (parseIsoDate(datePart) && Number.isFinite(count)) {
      entries.push({ date: datePart.trim(), count: Math.max(0, count) });
    }
  }
  return entries;
}

/**
 * `<mth-calendar-heatmap>`: accessible contribution matrix using `CalendarCore`
 * date math and 2D `RovingFocusController` keyboard navigation across day cells.
 */
export class MthCalendarHeatmap extends UIElement {
  static override messages = calendarHeatmapMessages;
  static override styles = calendarHeatmapStyles;

  @property({ attribute: false })
  values: ReadonlyArray<CalendarHeatmapEntry> = [];

  @property({ type: String })
  data = '';

  @property({ type: String, attribute: 'end-date' })
  endDate = '';

  @property({ type: Number })
  weeks = 12;

  @property({ type: String, attribute: 'selected-date', reflect: true })
  selectedDate = '';

  @property({ type: String })
  label = '';

  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'both',
      columns: 12,
      loop: false,
      getItems: () => this.getCells(),
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('has-selection', this.selectedDate.trim().length > 0);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('selectedDate')) {
      this.setCustomState('has-selection', this.selectedDate.trim().length > 0);
    }
    if (changedProperties.has('weeks')) {
      this.rovingCtrl.updateOptions({
        columns: Math.max(1, Math.min(53, Math.floor(this.weeks) || 12)),
      });
    }
    this.rovingCtrl.syncTabIndices();
  }

  getCells(): HTMLElement[] {
    return Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[role="gridcell"]') ?? []);
  }

  private resolveEntries(): Map<string, number> {
    const map = new Map<string, number>();
    const list = this.values.length > 0 ? this.values : parseDataEntries(this.data);
    for (const item of list) {
      const normalized = item.date.trim();
      if (normalized) {
        map.set(normalized, Math.max(0, item.count));
      }
    }
    return map;
  }

  private buildRows(): HeatmapCellModel[][] {
    const weekCount = Math.max(1, Math.min(53, Math.floor(this.weeks) || 12));
    const countsByDate = this.resolveEntries();

    let anchorEnd = parseIsoDate(this.endDate);
    if (!anchorEnd && countsByDate.size > 0) {
      const sortedDates = Array.from(countsByDate.keys()).sort();
      anchorEnd = parseIsoDate(sortedDates[sortedDates.length - 1]!) ?? null;
    }
    if (!anchorEnd) {
      anchorEnd = getTodayCalendarDate();
    }

    // Align grid end to Saturday (dow 6) of anchorEnd's week so every row has weekCount cells.
    const endDow = getDayOfWeek(anchorEnd);
    const gridEnd = addCalendarDays(anchorEnd, 6 - endDow);
    const totalDays = weekCount * 7;
    const gridStart = addCalendarDays(gridEnd, -(totalDays - 1));

    let maxCount = 0;
    for (const c of countsByDate.values()) {
      if (c > maxCount) maxCount = c;
    }

    const rows: HeatmapCellModel[][] = Array.from({ length: 7 }, () => []);
    for (let w = 0; w < weekCount; w += 1) {
      for (let d = 0; d < 7; d += 1) {
        const cellDate = addCalendarDays(gridStart, w * 7 + d);
        const iso = formatIsoDate(cellDate);
        const count = countsByDate.get(iso) ?? 0;
        const level = quantizeLevel(count, maxCount);
        rows[d]!.push({ iso, count, level });
      }
    }
    return rows;
  }

  private selectCell(cell: HeatmapCellModel): void {
    this.selectedDate = cell.iso;
    this.emitEvent('mth-select', {
      detail: { date: cell.iso, count: cell.count },
    });
  }

  override render() {
    const rows = this.buildRows();
    const ariaLabel = this.label.trim() || this.t('gridLabel');

    return html`
      <div part="base" class="base">
        <div part="grid" class="grid" role="grid" aria-label=${ariaLabel}>
          ${rows.map(
            (row) => html`
              <div part="row" class="row" role="row">
                ${row.map((cell) => {
                  const isSelected = this.selectedDate === cell.iso;
                  const cellAria = this.t('cellLabel', {
                    date: cell.iso,
                    count: String(cell.count),
                  });
                  return html`
                    <button
                      part="cell"
                      class="cell"
                      type="button"
                      role="gridcell"
                      data-date=${cell.iso}
                      data-level=${String(cell.level)}
                      aria-label=${cellAria}
                      aria-selected=${isSelected ? 'true' : 'false'}
                      @click=${() => this.selectCell(cell)}
                    ></button>
                  `;
                })}
              </div>
            `,
          )}
        </div>
        <div part="legend" class="legend">
          <slot name="legend">
            <span>${this.t('legendLess')}</span>
            <span class="legend-swatch" data-level="0" aria-hidden="true"></span>
            <span class="legend-swatch" data-level="1" aria-hidden="true"></span>
            <span class="legend-swatch" data-level="2" aria-hidden="true"></span>
            <span class="legend-swatch" data-level="3" aria-hidden="true"></span>
            <span class="legend-swatch" data-level="4" aria-hidden="true"></span>
            <span>${this.t('legendMore')}</span>
          </slot>
        </div>
      </div>
    `;
  }
}

function quantizeLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || maxCount <= 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}
