import { UIElement, type PropertyValues } from '@methane/core';
import {
  DataController,
  RovingFocusController,
  SelectionController,
  SlotCollectionController,
  TableCore,
  type ColumnPin,
  type DataControllerStatus,
  type DataSource,
  type TableColumnDef,
  type TableSortRule,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { tableMessages } from './table.messages.js';
import { tableStyles } from './table.styles.js';

export type TableRowRecord = Record<string, unknown>;
export type MthTableSelectable = 'none' | 'single' | 'multiple';

export interface TableColumnConfig {
  readonly id?: string;
  readonly field: string;
  readonly header: string;
  readonly sortable?: boolean;
  readonly filterable?: boolean;
  readonly width?: number;
  readonly minWidth?: number;
  readonly pin?: ColumnPin;
  readonly align?: 'start' | 'center' | 'end';
  readonly accessor?: (row: TableRowRecord) => unknown;
  readonly formatter?: (value: unknown, row: TableRowRecord) => string;
}

interface InternalColumnDef extends TableColumnDef<TableRowRecord> {
  readonly align: 'start' | 'center' | 'end';
  readonly formatter?: (value: unknown, row: TableRowRecord) => string;
}

type ColumnLikeElement = HTMLElement & {
  field?: string;
  header?: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | null;
  minWidth?: number | null;
  pin?: ColumnPin;
  align?: 'start' | 'center' | 'end';
  accessor?: (row: TableRowRecord) => unknown;
  formatter?: (value: unknown, row: TableRowRecord) => string;
};

function isColumnElement(el: Element): el is ColumnLikeElement {
  return el instanceof HTMLElement && el.localName.endsWith('column');
}

/**
 * `<mth-table>`: accessible data table uniting declarative `<mth-column>` children,
 * `.columns`/`.rows` properties, and async `DataSource<T>` via `TableCore`,
 * `SelectionController`, `SlotCollectionController`, `DataController`, and `RovingFocusController`.
 */
export class MthTable extends UIElement {
  static override messages = tableMessages;
  static override styles = tableStyles;

  @property({ attribute: false })
  rows: ReadonlyArray<TableRowRecord> = [];

  @property({ attribute: false })
  columns: ReadonlyArray<TableColumnConfig> | null = null;

  @property({ attribute: false })
  dataSource: DataSource<TableRowRecord, string> | null = null;

  @property({ type: String, reflect: true })
  selectable: MthTableSelectable = 'none';

  @property({ attribute: false })
  selectedIds: ReadonlyArray<string> = [];

  @property({ type: String })
  filter = '';

  @property({ type: String })
  caption = '';

  @property({ type: String })
  label = '';

  @property({ type: String, attribute: 'row-key' })
  rowKey = 'id';

  @property({ type: Boolean, reflect: true })
  striped = false;

  @property({ type: Boolean, attribute: 'sticky-header', reflect: true })
  stickyHeader = false;

  private readonly tableCore: TableCore<TableRowRecord>;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly slotCtrl: SlotCollectionController<ColumnLikeElement>;
  private readonly dataCtrl: DataController<TableRowRecord, string>;
  private readonly rovingCtrl: RovingFocusController;
  private colSheet: CSSStyleSheet | null = null;
  private suppressingSelectionSync = false;
  private hydratingFirstPass = false;
  private hydrationTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();

    this.tableCore = new TableCore<TableRowRecord>(
      {
        columns: [],
        rows: [],
        getRowId: (row, idx) => this.resolveRowId(row, idx),
      },
      this,
    );

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'single',
      allowEmpty: true,
      onChange: (selected) => {
        if (this.suppressingSelectionSync) return;
        this.suppressingSelectionSync = true;
        this.selectedIds = [...selected];
        this.suppressingSelectionSync = false;
        this.emitEvent('mth-selection-change', {
          detail: { selectedIds: this.selectedIds },
        });
      },
    });

    this.slotCtrl = new SlotCollectionController<ColumnLikeElement>(this, {
      filter: isColumnElement,
      attributeFilter: ['field', 'header', 'sortable', 'filterable', 'pin', 'align'],
      onItemsChange: () => {
        this.syncColumns();
      },
    });

    this.dataCtrl = new DataController<TableRowRecord, string>(this, {
      autoLoad: false,
      onStateChange: (status) => {
        this.syncStatusStates(status);
        this.syncRowsToCore();
        this.emitEvent('mth-data-state', {
          detail: { status, count: this.dataCtrl.items.length },
        });
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () => this.getHeaderControls(),
    });
  }

  override connectedCallback(): void {
    const isDsdHydration = Boolean(
      this.shadowRoot && this.shadowRoot.childNodes.length > 0 && !this.hasUpdated,
    );
    super.connectedCallback();
    if (isDsdHydration) {
      this.hydratingFirstPass = true;
    }
    this.setCustomState('striped', this.striped);
    this.syncStatusStates(this.dataCtrl.status);
    this.syncColumns();
    this.syncRowsToCore();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.hydrationTimer !== null) {
      clearTimeout(this.hydrationTimer);
      this.hydrationTimer = null;
    }
  }

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    if (this.hydratingFirstPass) {
      this.hydratingFirstPass = false;
      if (this.slotCtrl.slottedElements.length > 0) {
        this.hydrationTimer = setTimeout(() => {
          this.hydrationTimer = null;
          this.syncColumns();
          this.requestUpdate();
        }, 0);
      }
    }
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('striped')) {
      this.setCustomState('striped', this.striped);
    }
    if (changedProperties.has('selectable')) {
      this.selectionCtrl.mode = this.selectable === 'multiple' ? 'multiple' : 'single';
    }
    if (changedProperties.has('dataSource')) {
      this.dataCtrl.setDataSource(this.dataSource, { load: false });
      this.tableCore.setGlobalFilter(this.dataSource ? '' : this.filter);
      this.syncRowsToCore();
    }
    if (changedProperties.has('rows')) {
      this.syncRowsToCore();
    }
    if (changedProperties.has('columns')) {
      this.syncColumns();
    }
    if (changedProperties.has('filter')) {
      this.tableCore.setGlobalFilter(this.dataSource ? '' : this.filter);
    }
    if (changedProperties.has('selectedIds') && !this.suppressingSelectionSync) {
      this.suppressingSelectionSync = true;
      this.selectionCtrl.setSelection(this.selectedIds);
      this.suppressingSelectionSync = false;
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this.syncSelectAllIndeterminate();
    this.syncColumnSheet();
    this.rovingCtrl.syncTabIndices();
  }

  getHeaderControls(): HTMLElement[] {
    return Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>('[data-roving-header="true"]') ?? [],
    );
  }

  getDataStatus(): DataControllerStatus {
    return this.dataCtrl.status;
  }

  getSorting(): ReadonlyArray<TableSortRule> {
    return this.tableCore.sorting;
  }

  async query(filterText?: string): Promise<void> {
    if (filterText !== undefined) {
      this.filter = filterText;
    }
    await this.dataCtrl.setFilter(this.filter || undefined);
  }

  async refresh(): Promise<void> {
    await this.dataCtrl.refresh();
  }

  toggleSort(columnId: string): void {
    this.tableCore.toggleSort(columnId);
    this.emitEvent('mth-sort', {
      detail: { sorting: this.tableCore.sorting },
    });
  }

  toggleSelectAll(): void {
    if (this.selectable !== 'multiple') return;
    if (this.selectionCtrl.isAllSelected) {
      this.selectionCtrl.clear();
    } else {
      this.selectionCtrl.selectAll();
    }
  }

  private resolveRowId(row: TableRowRecord, index: number): string {
    const key = this.rowKey || 'id';
    if (key in row && row[key] !== undefined && row[key] !== null) {
      return String(row[key]);
    }
    return String(index);
  }

  private syncStatusStates(status: DataControllerStatus): void {
    this.setCustomState('loading', status === 'loading' || status === 'refreshing');
    this.setCustomState('empty', status === 'empty');
    this.setCustomState('error', status === 'error');
  }

  private resolveInternalColumns(): InternalColumnDef[] {
    if (this.columns !== null) {
      return this.columns.map((col, idx) => ({
        id: col.id ?? (col.field || `col-${idx}`),
        header: col.header || col.field || `Column ${idx + 1}`,
        accessor: col.accessor ?? ((row) => row[col.field]),
        sortable: col.sortable ?? false,
        filterable: col.filterable ?? true,
        ...(col.width !== undefined ? { width: col.width } : {}),
        ...(col.minWidth !== undefined ? { minWidth: col.minWidth } : {}),
        ...(col.pin !== undefined ? { pin: col.pin } : {}),
        align: col.align ?? 'start',
        ...(col.formatter ? { formatter: col.formatter } : {}),
      }));
    }

    if (this.hydratingFirstPass) {
      return [];
    }

    const slotted = this.slotCtrl.slottedElements;
    if (slotted.length > 0) {
      return slotted.map((el, idx) => {
        const field = el.field || el.getAttribute('field') || `col-${idx}`;
        const header =
          el.header ||
          el.getAttribute('header') ||
          (el.textContent ?? '').trim() ||
          field;
        const sortable = Boolean(el.sortable || el.hasAttribute('sortable'));
        const filterableAttr = el.getAttribute('filterable');
        const filterable =
          filterableAttr !== null ? filterableAttr !== 'false' : el.filterable ?? true;
        const pin = (el.pin ?? el.getAttribute('pin') ?? null) as ColumnPin;
        const align = (el.align ?? el.getAttribute('align') ?? 'start') as
          | 'start'
          | 'center'
          | 'end';
        const widthAttr = el.getAttribute('width');
        const width =
          typeof el.width === 'number'
            ? el.width
            : widthAttr !== null && Number.isFinite(Number(widthAttr))
              ? Number(widthAttr)
              : undefined;
        return {
          id: field,
          header,
          accessor: el.accessor ?? ((row) => row[field]),
          sortable,
          filterable,
          ...(width !== undefined ? { width } : {}),
          pin,
          align,
          ...(el.formatter ? { formatter: el.formatter } : {}),
        };
      });
    }

    const activeRows = this.dataSource ? this.dataCtrl.items : this.rows;
    if (activeRows.length > 0 && activeRows[0]) {
      return Object.keys(activeRows[0]).map((key) => ({
        id: key,
        header: key,
        accessor: (row) => row[key],
        sortable: true,
        filterable: true,
        align: 'start',
      }));
    }

    return [];
  }

  private syncColumns(): void {
    const cols = this.resolveInternalColumns();
    this.tableCore.setColumns(cols);
  }

  private syncRowsToCore(): void {
    const sourceRows = this.dataSource ? this.dataCtrl.items : this.rows;
    this.tableCore.setRows(sourceRows);
    this.syncColumns();
    this.selectionCtrl.setItems(
      sourceRows.map((row, idx) => ({ value: this.resolveRowId(row, idx) })),
    );
  }

  private syncSelectAllIndeterminate(): void {
    const selectAll = this.shadowRoot?.querySelector<HTMLInputElement>('[part="select-all"]');
    if (selectAll) {
      selectAll.indeterminate = this.selectionCtrl.isIndeterminate;
      selectAll.checked = this.selectionCtrl.isAllSelected;
    }
  }

  private syncColumnSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    const cols = this.tableCore.getResolvedColumns();
    const rules: string[] = [];
    for (const col of cols) {
      if (col.width !== undefined) {
        rules.push(`[data-col-id="${col.id}"] { inline-size: ${col.width}px; }`);
      }
      if (col.resolvedPin === 'left' && col.stickyOffset !== null) {
        rules.push(
          `[data-col-id="${col.id}"] { position: sticky; inset-inline-start: ${col.stickyOffset}px; z-index: 2; background-color: inherit; }`,
        );
      } else if (col.resolvedPin === 'right' && col.stickyOffset !== null) {
        rules.push(
          `[data-col-id="${col.id}"] { position: sticky; inset-inline-end: ${col.stickyOffset}px; z-index: 2; background-color: inherit; }`,
        );
      }
    }
    if (!this.colSheet) {
      this.colSheet = new CSSStyleSheet();
    }
    if (typeof this.colSheet.replaceSync === 'function') {
      this.colSheet.replaceSync(rules.join('\n'));
      if (!root.adoptedStyleSheets.includes(this.colSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.colSheet];
      }
    }
  }

  private handleRowSelect(rowId: string, shiftKey: boolean): void {
    if (this.selectable === 'single') {
      this.selectionCtrl.select(rowId, { toggle: false });
    } else if (this.selectable === 'multiple') {
      this.selectionCtrl.select(rowId, { toggle: true, range: shiftKey, additive: true });
    }
  }

  override render() {
    const cols = this.resolveInternalColumns();
    const resolvedCols = this.tableCore.getResolvedColumns();
    const displayCols = resolvedCols.length > 0 ? resolvedCols : cols;
    const internalById = new Map(cols.map((c) => [c.id, c]));

    const processedRows = this.tableCore.getProcessedRows();
    const sorting = this.tableCore.sorting;
    const status = this.dataCtrl.status;
    const showSelectCol = this.selectable !== 'none';
    const colSpan = Math.max(1, displayCols.length + (showSelectCol ? 1 : 0));
    const tableAriaLabel = this.label.trim() || this.caption.trim() || this.t('tableLabel');

    let bodyContent;
    if (this.dataSource && status === 'loading') {
      bodyContent = html`
        <tr>
          <td part="status" class="status-cell" colspan=${colSpan} data-status="loading" role="status">
            <slot name="loading">${this.t('loadingText')}</slot>
          </td>
        </tr>
      `;
    } else if (this.dataSource && status === 'error') {
      bodyContent = html`
        <tr>
          <td part="status" class="status-cell" colspan=${colSpan} data-status="error" role="alert">
            <slot name="error">${this.t('errorText')}</slot>
            <button part="retry" class="retry" type="button" @click=${() => void this.refresh()}>
              ${this.t('retryLabel')}
            </button>
          </td>
        </tr>
      `;
    } else if (processedRows.length === 0) {
      bodyContent = html`
        <tr>
          <td part="status" class="status-cell" colspan=${colSpan} data-status="empty">
            <slot name="empty">${this.t('emptyText')}</slot>
          </td>
        </tr>
      `;
    } else {
      bodyContent = processedRows.map((row, idx) => {
        const rowId = this.resolveRowId(row, idx);
        const isSelected = showSelectCol && this.selectionCtrl.isSelected(rowId);
        return html`
          <tr
            part="row"
            data-row-id=${rowId}
            aria-selected=${showSelectCol ? (isSelected ? 'true' : 'false') : nothing}
            @click=${() =>
              this.emitEvent('mth-row-click', { detail: { id: rowId, row } })}
          >
            ${showSelectCol
              ? html`
                  <td class="select-col">
                    <input
                      part="row-select"
                      class="select-input"
                      type=${this.selectable === 'multiple' ? 'checkbox' : 'radio'}
                      name="mth-table-row-select"
                      .checked=${isSelected}
                      aria-label=${this.t('selectRow', { id: rowId })}
                      @click=${(e: MouseEvent) => e.stopPropagation()}
                      @change=${(e: Event) =>
                        this.handleRowSelect(rowId, (e as MouseEvent).shiftKey ?? false)}
                    />
                  </td>
                `
              : nothing}
            ${displayCols.map((col) => {
              const meta = internalById.get(col.id);
              const rawVal = col.accessor(row);
              const text = meta?.formatter
                ? meta.formatter(rawVal, row)
                : rawVal === null || rawVal === undefined
                  ? ''
                  : String(rawVal);
              return html`
                <td
                  part="cell"
                  data-col-id=${col.id}
                  data-align=${meta?.align ?? 'start'}
                >
                  ${text}
                </td>
              `;
            })}
          </tr>
        `;
      });
    }

    return html`
      <div part="base" class="base">
        <div class="slot-host" aria-hidden="true">
          <slot></slot>
        </div>
        <table part="table" aria-label=${this.caption ? nothing : tableAriaLabel}>
          ${this.caption ? html`<caption>${this.caption}</caption>` : nothing}
          <thead part="thead">
            <tr>
              ${showSelectCol
                ? html`
                    <th scope="col" class="select-col">
                      ${this.selectable === 'multiple'
                        ? html`
                            <input
                              part="select-all"
                              class="select-input"
                              type="checkbox"
                              aria-label=${this.t('selectAll')}
                              @change=${() => this.toggleSelectAll()}
                            />
                          `
                        : nothing}
                    </th>
                  `
                : nothing}
              ${displayCols.map((col) => {
                const meta = internalById.get(col.id);
                const sortRule = sorting.find((s) => s.columnId === col.id);
                const ariaSort = col.sortable
                  ? sortRule?.direction === 'asc'
                    ? 'ascending'
                    : sortRule?.direction === 'desc'
                      ? 'descending'
                      : 'none'
                  : nothing;

                return html`
                  <th
                    part="header-cell"
                    scope="col"
                    data-col-id=${col.id}
                    data-align=${meta?.align ?? 'start'}
                    aria-sort=${ariaSort}
                  >
                    ${col.sortable
                      ? html`
                          <button
                            part="sort-button"
                            class="sort-button"
                            type="button"
                            data-roving-header="true"
                            aria-label=${this.t('sortColumn', { header: col.header })}
                            @click=${() => this.toggleSort(col.id)}
                          >
                            <span>${col.header}</span>
                            <span class="sort-indicator" aria-hidden="true">
                              ${sortRule?.direction === 'asc'
                                ? '▲'
                                : sortRule?.direction === 'desc'
                                  ? '▼'
                                  : '⇅'}
                            </span>
                          </button>
                        `
                      : html`<span data-roving-header="true" tabindex="-1">${col.header}</span>`}
                  </th>
                `;
              })}
            </tr>
          </thead>
          <tbody part="tbody">
            ${bodyContent}
          </tbody>
        </table>
      </div>
    `;
  }
}
