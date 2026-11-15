import { UIElement, type PropertyValues } from '@methane-ui/core';
import { RovingFocusController, SelectionController, TableCore } from '@methane-ui/primitives';
import type { ColumnDef, Table } from '@tanstack/table-core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import {
  captureThemeSnapshot,
  createTanStackTableInstance,
  readCssToken,
  type BaseSatelliteEngine,
} from '../../shared/engine.js';
import { pivotTableMessages } from './pivot-table.messages.js';
import { pivotTableStyles } from './pivot-table.styles.js';

export type PivotAggregator = 'sum' | 'count' | 'avg' | 'min' | 'max';

export interface PivotGroupSummary {
  readonly groupKey: string;
  readonly rowCount: number;
  readonly buckets: Readonly<Record<string, number>>;
  readonly total: number;
  readonly detailRows: ReadonlyArray<Record<string, unknown>>;
}

export interface PivotMatrix {
  readonly columnKeys: ReadonlyArray<string>;
  readonly groups: ReadonlyArray<PivotGroupSummary>;
  readonly grandTotals: Readonly<Record<string, number>>;
  readonly overallTotal: number;
}

export interface MthPivotTableEngine extends BaseSatelliteEngine {
  readonly table: Table<Record<string, unknown>>;
  readonly tableCore: TableCore<Record<string, unknown>>;
  computePivotMatrix(): PivotMatrix;
  toggleGroup(groupKey: string): void;
}

function aggregateNumbers(values: ReadonlyArray<number>, mode: PivotAggregator): number {
  if (mode === 'count') return values.length;
  if (values.length === 0) return 0;
  if (mode === 'sum') return values.reduce((a, b) => a + b, 0);
  if (mode === 'avg') return values.reduce((a, b) => a + b, 0) / values.length;
  if (mode === 'min') return Math.min(...values);
  return Math.max(...values);
}

/**
 * `<mth-pivot-table>`: multi-dimensional pivot aggregation table wrapping `@tanstack/table-core`.
 */
export class MthPivotTable extends UIElement {
  static override messages = pivotTableMessages;
  static override styles = pivotTableStyles;

  @property({ attribute: false })
  rows: ReadonlyArray<Record<string, unknown>> = [];

  @property({ attribute: false })
  rowDimensions: ReadonlyArray<string> = [];

  @property({ attribute: false })
  columnDimensions: ReadonlyArray<string> = [];

  @property({ attribute: false })
  valueFields: ReadonlyArray<string> = [];

  @property({ type: String, reflect: true })
  aggregator: PivotAggregator = 'sum';

  @property({ type: Boolean, attribute: 'show-totals', reflect: true })
  showTotals = true;

  @property({ type: String })
  label = '';

  private readonly tableCore: TableCore<Record<string, unknown>>;
  private readonly selectionCtrl: SelectionController;
  private readonly rovingFocus: RovingFocusController;

  private _engine: MthPivotTableEngine | null = null;
  private expandedGroups = new Set<string>();
  private pendingPivotChange = false;
  private cachedMatrix: PivotMatrix = {
    columnKeys: [],
    groups: [],
    grandTotals: {},
    overallTotal: 0,
  };

  constructor() {
    super();
    this.tableCore = new TableCore<Record<string, unknown>>({ columns: [], rows: [] }, null);
    this.selectionCtrl = new SelectionController(this, { mode: 'single' });
    this.rovingFocus = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: false,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('.body-row') ?? []),
    });
  }

  get engine(): MthPivotTableEngine | null {
    return this._engine;
  }

  private computeMatrixInternal(): PivotMatrix {
    const rowDim = this.rowDimensions[0];
    const colDim = this.columnDimensions[0];
    const valField = this.valueFields[0];

    const colKeySet = new Set<string>();
    const groupMap = new Map<string, Map<string, number[]>>();
    const groupRowsMap = new Map<string, Record<string, unknown>[]>();
    const allGroupLabel = this.t('allGroupLabel');
    const totalColLabel = this.t('totalColumnLabel');

    for (const row of this.rows) {
      const rKey = rowDim ? String(row[rowDim] ?? '—') : allGroupLabel;
      const cKey = colDim ? String(row[colDim] ?? totalColLabel) : totalColLabel;
      colKeySet.add(cKey);
      const rawVal = valField ? Number(row[valField] ?? 0) : 1;
      const numeric = Number.isFinite(rawVal) ? rawVal : 0;

      let bucketMap = groupMap.get(rKey);
      if (!bucketMap) {
        bucketMap = new Map();
        groupMap.set(rKey, bucketMap);
      }
      const list = bucketMap.get(cKey) ?? [];
      list.push(numeric);
      bucketMap.set(cKey, list);

      const groupRows = groupRowsMap.get(rKey) ?? [];
      groupRows.push(row);
      groupRowsMap.set(rKey, groupRows);
    }

    const columnKeys = Array.from(colKeySet).sort((a, b) => a.localeCompare(b));
    const grandBuckets = new Map<string, number[]>();
    const allValues: number[] = [];

    const groups: PivotGroupSummary[] = [];
    for (const [groupKey, bucketMap] of groupMap.entries()) {
      const buckets: Record<string, number> = {};
      const rowValues: number[] = [];
      for (const ck of columnKeys) {
        const vals = bucketMap.get(ck) ?? [];
        buckets[ck] = aggregateNumbers(vals, this.aggregator);
        rowValues.push(...vals);
        allValues.push(...vals);
        const existingGrand = grandBuckets.get(ck) ?? [];
        existingGrand.push(...vals);
        grandBuckets.set(ck, existingGrand);
      }
      groups.push({
        groupKey,
        rowCount: rowValues.length,
        buckets,
        total: aggregateNumbers(rowValues, this.aggregator),
        detailRows: groupRowsMap.get(groupKey) ?? [],
      });
    }

    const grandTotals: Record<string, number> = {};
    for (const ck of columnKeys) {
      grandTotals[ck] = aggregateNumbers(grandBuckets.get(ck) ?? [], this.aggregator);
    }

    return {
      columnKeys,
      groups,
      grandTotals,
      overallTotal: aggregateNumbers(allValues, this.aggregator),
    };
  }

  private buildTanStackColumns(columnKeys: ReadonlyArray<string>): ColumnDef<Record<string, unknown>, unknown>[] {
    return [
      { id: '__group', header: this.t('rowGroupHeader'), accessorKey: 'groupKey' },
      ...columnKeys.map((ck) => ({
        id: ck,
        header: ck,
        accessorFn: (row: Record<string, unknown>) => row[ck],
      })),
    ];
  }

  private createEngine(): MthPivotTableEngine {
    const matrix = this.computeMatrixInternal();
    this.cachedMatrix = matrix;
    const flatRows = matrix.groups.map((g) => ({ groupKey: g.groupKey, ...g.buckets }));

    const wrapper = createTanStackTableInstance<Record<string, unknown>>({
      data: flatRows,
      columns: this.buildTanStackColumns(matrix.columnKeys),
      initialGrouping: [...this.rowDimensions],
    });

    let theme = captureThemeSnapshot(this);

    const engine: MthPivotTableEngine = {
      table: wrapper.table,
      tableCore: this.tableCore,
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
      computePivotMatrix: () => this.cachedMatrix,
      toggleGroup: (groupKey: string) => {
        this.toggleGroup(groupKey);
      },
      dispose: () => {
        this.expandedGroups.clear();
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
  }

  override disconnectedCallback(): void {
    this._engine?.dispose();
    this._engine = null;
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    const pivotChanged =
      changed.has('rows') ||
      changed.has('rowDimensions') ||
      changed.has('columnDimensions') ||
      changed.has('valueFields') ||
      changed.has('aggregator');
    if (pivotChanged) {
      this.syncEngine();
      if (this.hasUpdated) {
        this.pendingPivotChange = true;
      }
    }
    this.setCustomState('empty', this.rows.length === 0);
    this.setCustomState('grouped', this.rowDimensions.length > 0);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (this.pendingPivotChange) {
      this.pendingPivotChange = false;
      this.emitEvent('mth-pivot-change', {
        detail: {
          aggregator: this.aggregator,
          groupCount: this.cachedMatrix.groups.length,
        },
      });
    }
  }

  private syncEngine(): void {
    this.cachedMatrix = this.computeMatrixInternal();
    const flatRows = this.cachedMatrix.groups.map((g) => ({
      groupKey: g.groupKey,
      ...g.buckets,
    }));
    this.tableCore.setRows(flatRows);
    if (this._engine) {
      this._engine.table.setOptions((prev) => ({
        ...prev,
        data: flatRows,
        columns: this.buildTanStackColumns(this.cachedMatrix.columnKeys),
      }));
      this._engine.syncTokens(this);
    }
  }

  toggleGroup(groupKey: string): void {
    const nextExpanded = !this.expandedGroups.has(groupKey);
    if (nextExpanded) {
      this.expandedGroups.add(groupKey);
    } else {
      this.expandedGroups.delete(groupKey);
    }
    this.selectionCtrl.select(groupKey, { toggle: false });
    this.requestUpdate();
    this.emitEvent('mth-group-toggle', {
      detail: { groupKey, expanded: nextExpanded },
    });
  }

  override render() {
    const matrix = this.cachedMatrix;
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
              <div class="header-cell" role="columnheader">${this.t('rowGroupHeader')}</div>
              ${matrix.columnKeys.map(
                (ck) => html`<div class="header-cell" role="columnheader">${ck}</div>`,
              )}
              <div class="header-cell" role="columnheader">${this.t('totalsRowLabel')}</div>
            </div>
            ${matrix.groups.length === 0
              ? html`
                  <div part="status" class="status" role="status">
                    ${this.t('emptyLabel')}
                    <slot name="fallback"></slot>
                  </div>
                `
              : html`
                  ${matrix.groups.map((group, idx) => {
                    const isExpanded = this.expandedGroups.has(group.groupKey);
                    return html`
                      <div
                        part="row"
                        class="row body-row"
                        role="row"
                        data-group=${group.groupKey}
                        tabindex=${idx === this.rovingFocus.currentIndex ? '0' : '-1'}
                      >
                        <div part="cell" class="cell" role="gridcell">
                          <button
                            type="button"
                            class="group-toggle"
                            aria-expanded=${isExpanded ? 'true' : 'false'}
                            aria-label=${this.t('toggleGroupLabel', { group: group.groupKey })}
                            @click=${() => this.toggleGroup(group.groupKey)}
                          >
                            ${isExpanded ? '−' : '+'}
                          </button>
                          <span>${group.groupKey}</span>
                        </div>
                        ${matrix.columnKeys.map(
                          (ck) =>
                            html`<div part="cell" class="cell" role="gridcell">
                              ${String(group.buckets[ck] ?? 0)}
                            </div>`,
                        )}
                        <div part="cell" class="cell" role="gridcell">${String(group.total)}</div>
                      </div>
                      ${isExpanded
                        ? group.detailRows.map((detailRow, dIdx) => {
                            const colDim = this.columnDimensions[0];
                            const valField = this.valueFields[0];
                            const totalColLabel = this.t('totalColumnLabel');
                            const cKey = colDim
                              ? String(detailRow[colDim] ?? totalColLabel)
                              : totalColLabel;
                            const rawVal = valField ? Number(detailRow[valField] ?? 0) : 1;
                            const cellVal = Number.isFinite(rawVal) ? rawVal : 0;
                            const detailLabel = colDim
                              ? String(detailRow[colDim] ?? '')
                              : `${group.groupKey} #${dIdx + 1}`;
                            return html`
                              <div
                                part="row"
                                class="row detail-row"
                                role="row"
                                data-kind="detail"
                                data-group=${group.groupKey}
                              >
                                <div part="cell" class="cell detail-cell" role="gridcell">
                                  ${detailLabel}
                                </div>
                                ${matrix.columnKeys.map(
                                  (ck) =>
                                    html`<div part="cell" class="cell detail-cell" role="gridcell">
                                      ${ck === cKey ? String(cellVal) : '—'}
                                    </div>`,
                                )}
                                <div part="cell" class="cell detail-cell" role="gridcell">
                                  ${String(cellVal)}
                                </div>
                              </div>
                            `;
                          })
                        : nothing}
                    `;
                  })}
                  ${this.showTotals
                    ? html`
                        <div part="totals" class="row" role="row" data-kind="totals">
                          <div part="cell" class="cell" role="gridcell">${this.t('totalsRowLabel')}</div>
                          ${matrix.columnKeys.map(
                            (ck) =>
                              html`<div part="cell" class="cell" role="gridcell">
                                ${String(matrix.grandTotals[ck] ?? 0)}
                              </div>`,
                          )}
                          <div part="cell" class="cell" role="gridcell">
                            ${String(matrix.overallTotal)}
                          </div>
                        </div>
                      `
                    : nothing}
                `}
          </div>
        </div>
      </div>
    `;
  }
}
