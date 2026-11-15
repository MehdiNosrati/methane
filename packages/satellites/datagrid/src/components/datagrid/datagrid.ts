import { UIElement, type PropertyValues } from '@methane/core';
import {
  DataController,
  RovingFocusController,
  SelectionController,
  TableCore,
  type DataSource,
  type TableColumnDef,
} from '@methane/primitives';
import type { ColumnDef, Row, SortingState, Table } from '@tanstack/table-core';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import {
  attachDynamicSheet,
  captureThemeSnapshot,
  createDynamicSheet,
  createTanStackTableInstance,
  escapeCssString,
  HeadlessVirtualizer,
  readCssToken,
  type BaseSatelliteEngine,
} from '../../shared/engine.js';
import { datagridMessages } from './datagrid.messages.js';
import { datagridStyles } from './datagrid.styles.js';

export interface DatagridColumn<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly header: string;
  readonly accessorKey?: keyof T & string;
  readonly accessor?: (row: T) => unknown;
  readonly sortable?: boolean;
  readonly filterable?: boolean;
  readonly resizable?: boolean;
  readonly width?: number;
  readonly pinned?: 'left' | 'right' | null;
}

export interface MthDatagridEngine extends BaseSatelliteEngine {
  readonly table: Table<Record<string, unknown>>;
  readonly virtualizer: HeadlessVirtualizer;
  readonly tableCore: TableCore<Record<string, unknown>>;
  readonly dataController: DataController<Record<string, unknown>, string>;
  getProcessedRows(): ReadonlyArray<Record<string, unknown>>;
  setSort(columnId: string, desc?: boolean): void;
  setGlobalFilter(filterText: string): void;
  resizeColumn(columnId: string, width: number): void;
}

/**
 * `<mth-datagrid>`: enterprise virtualized data grid wrapping `@tanstack/table-core` and
 * `@tanstack/virtual-core` alongside `TableCore` and `DataController`.
 */
export class MthDatagrid extends UIElement {
  static override messages = datagridMessages;
  static override styles = datagridStyles;

  @property({ attribute: false })
  rows: ReadonlyArray<Record<string, unknown>> = [];

  @property({ attribute: false })
  columns: ReadonlyArray<DatagridColumn> = [];

  @property({ attribute: false })
  dataSource: DataSource<Record<string, unknown>, string> | null = null;

  @property({ type: Boolean, reflect: true })
  selectable = false;

  @property({ type: Boolean, attribute: 'multi-sort', reflect: true })
  multiSort = false;

  @property({ type: String })
  filter = '';

  @property({ type: Number, attribute: 'row-height' })
  rowHeight = 40;

  @property({ type: String })
  label = '';

  @query('.viewport')
  private viewportEl!: HTMLElement | null;

  private readonly dataCtrl: DataController<Record<string, unknown>, string>;
  private readonly tableCore: TableCore<Record<string, unknown>>;
  private readonly selectionCtrl: SelectionController;
  private readonly rovingFocus: RovingFocusController;
  private readonly dynamicSheet: CSSStyleSheet | null = createDynamicSheet();

  private _engine: MthDatagridEngine | null = null;
  private sortingState: SortingState = [];
  private columnWidths = new Map<string, number>();

  constructor() {
    super();
    this.dataCtrl = new DataController<Record<string, unknown>, string>(this, {
      onStateChange: () => {
        this.syncEngineData();
        this.requestUpdate();
      },
    });
    this.tableCore = new TableCore<Record<string, unknown>>(
      { columns: [], rows: [] },
      null,
    );
    this.selectionCtrl = new SelectionController(this, {
      mode: 'multiple',
      onChange: (ids) => {
        this.emitEvent('mth-selection-change', { detail: { selectedIds: ids } });
      },
    });
    this.rovingFocus = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: false,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('.body-row') ?? []),
    });
  }

  get engine(): MthDatagridEngine | null {
    return this._engine;
  }

  private getActiveRows(): ReadonlyArray<Record<string, unknown>> {
    if (this.dataSource) {
      return this.dataCtrl.items;
    }
    return this.rows;
  }

  private buildTanStackColumns(): ColumnDef<Record<string, unknown>, unknown>[] {
    return this.columns.map((col) => ({
      id: col.id,
      header: col.header,
      accessorFn: (row) => {
        if (col.accessor) return col.accessor(row);
        const key = col.accessorKey ?? col.id;
        return row[key];
      },
      enableSorting: col.sortable !== false,
      enableColumnFilter: col.filterable !== false,
      size: this.columnWidths.get(col.id) ?? col.width ?? 140,
    }));
  }

  private buildPrimitiveColumns(): TableColumnDef<Record<string, unknown>>[] {
    return this.columns.map((col) => ({
      id: col.id,
      header: col.header,
      accessor: (row) => {
        if (col.accessor) return col.accessor(row);
        const key = col.accessorKey ?? col.id;
        return row[key];
      },
      sortable: col.sortable !== false,
      filterable: col.filterable !== false,
      resizable: col.resizable !== false,
      ...(col.width !== undefined ? { width: col.width } : {}),
      ...(col.pinned !== undefined ? { pin: col.pinned } : {}),
    }));
  }

  private createEngine(): MthDatagridEngine {
    const activeRows = [...this.getActiveRows()];
    const tanstackCols = this.buildTanStackColumns();
    const wrapper = createTanStackTableInstance<Record<string, unknown>>({
      data: activeRows,
      columns: tanstackCols,
      getRowId: (row, idx) =>
        typeof row.id === 'string' || typeof row.id === 'number'
          ? String(row.id)
          : String(idx),
      initialSorting: this.sortingState,
    });

    const virtualizer = new HeadlessVirtualizer({
      count: activeRows.length,
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

    const engine: MthDatagridEngine = {
      table: wrapper.table,
      virtualizer,
      tableCore: this.tableCore,
      dataController: this.dataCtrl,
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
      getProcessedRows: () =>
        wrapper.table.getRowModel().rows.map((r: Row<Record<string, unknown>>) => r.original),
      setSort: (columnId: string, desc = false) => {
        this.applySort(columnId, desc);
      },
      setGlobalFilter: (filterText: string) => {
        this.filter = filterText;
      },
      resizeColumn: (columnId: string, width: number) => {
        this.resizeColumn(columnId, width);
      },
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
    this.syncEngineData();
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

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    attachDynamicSheet(this, this.dynamicSheet);
    this._engine?.virtualizer.attachElement(this.viewportEl);
    this.syncDynamicSheet();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('dataSource')) {
      this.dataCtrl.setDataSource(this.dataSource, { load: false });
    }
    if (
      changedProperties.has('rows') ||
      changedProperties.has('columns') ||
      changedProperties.has('filter') ||
      changedProperties.has('rowHeight')
    ) {
      this.syncEngineData();
    }
    this.setCustomState('loading', this.dataCtrl.status === 'loading');
    this.setCustomState('empty', this.dataCtrl.status === 'empty' || this.getActiveRows().length === 0);
    this.setCustomState('error', this.dataCtrl.status === 'error');
    this.setCustomState('selectable', this.selectable);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this._engine?.virtualizer.attachElement(this.viewportEl);
    this.syncDynamicSheet();
  }

  private syncEngineData(): void {
    const activeRows = [...this.getActiveRows()];
    const localFilter = this.dataSource ? '' : this.filter;
    this.tableCore.setColumns(this.buildPrimitiveColumns());
    this.tableCore.setRows(activeRows);
    this.tableCore.setGlobalFilter(localFilter);

    if (this._engine) {
      this._engine.table.setOptions((prev) => ({
        ...prev,
        data: activeRows,
        columns: this.buildTanStackColumns(),
        state: {
          ...prev.state,
          sorting: this.sortingState,
          globalFilter: localFilter,
        },
      }));
      const count = this._engine.table.getRowModel().rows.length;
      this._engine.virtualizer.updateCount(count, this.rowHeight);
      this._engine.syncTokens(this);
    }
  }

  private syncDynamicSheet(): void {
    if (!this.dynamicSheet) return;
    const safeRowHeight =
      Number.isFinite(this.rowHeight) && this.rowHeight > 0 ? Math.round(this.rowHeight) : 40;
    const rules: string[] = [`:host { --_dg-row-height: ${safeRowHeight}px; }`];
    for (const col of this.columns) {
      const w = this.columnWidths.get(col.id) ?? col.width;
      if (typeof w === 'number' && Number.isFinite(w) && w >= 40) {
        const safeId = escapeCssString(col.id);
        rules.push(`[data-col-id="${safeId}"] { flex: 0 0 ${Math.round(w)}px; }`);
      }
    }
    this.dynamicSheet.replaceSync(rules.join('\n'));
  }

  async load(filterQuery?: string): Promise<void> {
    if (filterQuery !== undefined) {
      if (!this.dataSource) {
        this.filter = filterQuery;
      }
      await this.dataCtrl.setFilter(filterQuery);
      return;
    }
    await this.dataCtrl.load();
  }

  resizeColumn(columnId: string, width: number): void {
    if (!Number.isFinite(width) || width < 40) return;
    this.columnWidths.set(columnId, Math.round(width));
    this.syncEngineData();
    this.syncDynamicSheet();
    this.requestUpdate();
    this.emitEvent('mth-column-resize', { detail: { columnId, width: Math.round(width) } });
  }

  private applySort(columnId: string, explicitDesc?: boolean): void {
    const existing = this.sortingState.find((s) => s.id === columnId);
    const nextDesc = explicitDesc !== undefined ? explicitDesc : existing ? !existing.desc : false;
    if (explicitDesc === undefined && existing?.desc) {
      this.sortingState = this.multiSort
        ? this.sortingState.filter((s) => s.id !== columnId)
        : [];
    } else {
      const entry = { id: columnId, desc: nextDesc };
      this.sortingState = this.multiSort
        ? [...this.sortingState.filter((s) => s.id !== columnId), entry]
        : [entry];
    }
    this.syncEngineData();
    this.requestUpdate();
    this.emitEvent('mth-sort-change', { detail: { sorting: [...this.sortingState] } });
  }

  private getRowIdForRow(row: Record<string, unknown>, idx: number): string {
    if (typeof row.id === 'string' || typeof row.id === 'number') {
      return String(row.id);
    }
    return String(idx);
  }

  override render() {
    const status = this.dataCtrl.status;
    const processedRows = this._engine
      ? this._engine.table.getRowModel().rows.map((r) => r.original)
      : [...this.getActiveRows()];

    const virtualItems = this._engine?.virtualizer.getVirtualItems() ?? [];
    const visibleRows =
      virtualItems.length > 0 && processedRows.length > 25
        ? virtualItems
            .map((vi) => ({ row: processedRows[vi.index], index: vi.index }))
            .filter(
              (entry): entry is { row: Record<string, unknown>; index: number } =>
                entry.row !== undefined,
            )
        : processedRows.map((row, index) => ({ row, index }));

    const allRowIds = processedRows.map((r, i) => this.getRowIdForRow(r, i));
    const allSelected =
      allRowIds.length > 0 && allRowIds.every((id) => this.selectionCtrl.isSelected(id));

    return html`
      <div part="base" class="base">
        <div part="viewport" class="viewport">
          <div
            part="grid"
            class="grid"
            role="grid"
            aria-label=${this.label || this.t('gridLabel')}
            aria-busy=${status === 'loading' ? 'true' : 'false'}
          >
            <div part="header" class="row header-row" role="row">
              ${this.selectable
                ? html`
                    <div class="header-cell select-cell" role="columnheader">
                      <input
                        type="checkbox"
                        aria-label=${this.t('selectAllLabel')}
                        .checked=${allSelected}
                        @change=${(ev: Event) => {
                          const checked = (ev.target as HTMLInputElement).checked;
                          this.selectionCtrl.setItems(allRowIds);
                          if (checked) {
                            this.selectionCtrl.selectAll();
                          } else {
                            this.selectionCtrl.clear();
                          }
                          this.requestUpdate();
                        }}
                      />
                    </div>
                  `
                : nothing}
              ${this.columns.map((col) => {
                const sortRule = this.sortingState.find((s) => s.id === col.id);
                const ariaSort = sortRule
                  ? sortRule.desc
                    ? 'descending'
                    : 'ascending'
                  : 'none';
                const currentWidth = this.columnWidths.get(col.id) ?? col.width ?? 140;
                return html`
                  <div
                    class="header-cell"
                    role="columnheader"
                    data-col-id=${col.id}
                    data-pinned=${col.pinned ?? 'none'}
                    aria-sort=${ariaSort}
                  >
                    ${col.sortable !== false
                      ? html`
                          <button
                            type="button"
                            class="sort-btn"
                            @click=${() => this.applySort(col.id)}
                          >
                            <span>${col.header}</span>
                            ${sortRule
                              ? html`<span class="sort-indicator" aria-hidden="true">${sortRule.desc ? '↓' : '↑'}</span>`
                              : nothing}
                          </button>
                        `
                      : html`<span>${col.header}</span>`}
                    ${col.resizable !== false
                      ? html`
                          <button
                            type="button"
                            class="resize-btn"
                            aria-label=${this.t('resizeColumnLabel', { column: col.header })}
                            @click=${() => this.resizeColumn(col.id, currentWidth + 24)}
                          >
                            ↔
                          </button>
                        `
                      : nothing}
                  </div>
                `;
              })}
            </div>

            ${status === 'loading'
              ? html`<div part="status" class="status" role="status" data-state="loading">${this.t('loadingLabel')}</div>`
              : status === 'error'
                ? html`
                    <div part="status" class="status" role="alert" data-state="error">
                      <span>${this.t('errorLabel')}</span>
                      <button type="button" class="retry-btn" @click=${() => void this.load()}>
                        ${this.t('retryLabel')}
                      </button>
                    </div>
                  `
                : visibleRows.length === 0
                  ? html`
                      <div part="status" class="status" role="status" data-state="empty">
                        ${this.t('emptyLabel')}
                        <slot name="fallback"></slot>
                      </div>
                    `
                  : visibleRows.map(({ row, index }) => {
                      const rowId = this.getRowIdForRow(row, index);
                      const isSelected = this.selectionCtrl.isSelected(rowId);
                      return html`
                        <div
                          part="row"
                          class="row body-row"
                          role="row"
                          data-row-id=${rowId}
                          data-selected=${isSelected ? 'true' : 'false'}
                          aria-selected=${this.selectable ? (isSelected ? 'true' : 'false') : nothing}
                          tabindex=${index === this.rovingFocus.currentIndex ? '0' : '-1'}
                        >
                          ${this.selectable
                            ? html`
                                <div class="cell select-cell" role="gridcell">
                                  <input
                                    type="checkbox"
                                    aria-label=${this.t('selectRowLabel', { id: rowId })}
                                    .checked=${isSelected}
                                    @change=${() => {
                                      this.selectionCtrl.select(rowId, {
                                        toggle: true,
                                        additive: true,
                                      });
                                      this.requestUpdate();
                                    }}
                                  />
                                </div>
                              `
                            : nothing}
                          ${this.columns.map((col) => {
                            const rawVal = col.accessor
                              ? col.accessor(row)
                              : row[col.accessorKey ?? col.id];
                            const textVal = rawVal === undefined || rawVal === null ? '' : String(rawVal);
                            return html`
                              <div
                                part="cell"
                                class="cell"
                                role="gridcell"
                                data-col-id=${col.id}
                                data-pinned=${col.pinned ?? 'none'}
                              >
                                ${textVal}
                              </div>
                            `;
                          })}
                        </div>
                      `;
                    })}
          </div>
        </div>
      </div>
    `;
  }
}
