import { UIElement, type PropertyValues } from '@methane/core';
import { RovingFocusController, SelectionController, TableCore } from '@methane/primitives';
import type { ColumnDef, ExpandedState, Row, Table } from '@tanstack/table-core';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import {
  attachDynamicSheet,
  captureThemeSnapshot,
  createDynamicSheet,
  createTanStackTableInstance,
  HeadlessVirtualizer,
  readCssToken,
  type BaseSatelliteEngine,
} from '../../shared/engine.js';
import { treeTableMessages } from './tree-table.messages.js';
import { treeTableStyles } from './tree-table.styles.js';

export interface TreeTableRow extends Record<string, unknown> {
  readonly id?: string;
  readonly children?: ReadonlyArray<TreeTableRow>;
}

export interface TreeTableColumn {
  readonly id: string;
  readonly header: string;
  readonly accessorKey?: string;
}

export interface MthTreeTableEngine extends BaseSatelliteEngine {
  readonly table: Table<TreeTableRow>;
  readonly virtualizer: HeadlessVirtualizer;
  readonly tableCore: TableCore<TreeTableRow>;
  getVisibleRows(): ReadonlyArray<{ row: Row<TreeTableRow>; id: string; depth: number; canExpand: boolean }>;
  toggleRowExpanded(rowId: string, force?: boolean): void;
}

/**
 * `<mth-tree-table>`: hierarchical expandable treegrid wrapping `@tanstack/table-core`
 * `getExpandedRowModel()` and `@tanstack/virtual-core`.
 */
export class MthTreeTable extends UIElement {
  static override messages = treeTableMessages;
  static override styles = treeTableStyles;

  @property({ attribute: false })
  rows: ReadonlyArray<TreeTableRow> = [];

  @property({ attribute: false })
  columns: ReadonlyArray<TreeTableColumn> = [];

  @property({ type: String, attribute: 'sub-rows-key' })
  subRowsKey = 'children';

  @property({ attribute: false })
  expandedIds: ReadonlyArray<string> = [];

  @property({ type: Boolean, reflect: true })
  selectable = false;

  @property({ type: Number, attribute: 'row-height' })
  rowHeight = 38;

  @property({ type: String })
  label = '';

  @query('.viewport')
  private viewportEl!: HTMLElement | null;

  private readonly tableCore: TableCore<TreeTableRow>;
  private readonly selectionCtrl: SelectionController;
  private readonly rovingFocus: RovingFocusController;
  private readonly dynamicSheet: CSSStyleSheet | null = createDynamicSheet();

  private _engine: MthTreeTableEngine | null = null;
  private expandedState: Record<string, boolean> = {};

  constructor() {
    super();
    this.tableCore = new TableCore<TreeTableRow>({ columns: [], rows: [] }, null);
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

  get engine(): MthTreeTableEngine | null {
    return this._engine;
  }

  private resolveRowId(row: TreeTableRow, index: number, parentRow?: Row<TreeTableRow>): string {
    if (typeof row.id === 'string' && row.id.length > 0) return row.id;
    return parentRow ? `${parentRow.id}.${index}` : String(index);
  }

  private buildTanStackColumns(): ColumnDef<TreeTableRow, unknown>[] {
    return this.columns.map((col) => ({
      id: col.id,
      header: col.header,
      accessorFn: (row) => row[col.accessorKey ?? col.id],
    }));
  }

  private getSubRowsFor = (row: TreeTableRow): TreeTableRow[] | undefined => {
    const key = this.subRowsKey || 'children';
    const raw = row[key];
    return Array.isArray(raw) && raw.length > 0 ? (raw as TreeTableRow[]) : undefined;
  };

  private createEngine(): MthTreeTableEngine {
    const wrapper = createTanStackTableInstance<TreeTableRow>({
      data: [...this.rows],
      columns: this.buildTanStackColumns(),
      getRowId: (row, idx, parent) => this.resolveRowId(row, idx, parent),
      getSubRows: this.getSubRowsFor,
      initialExpanded: this.expandedState,
    });

    const virtualizer = new HeadlessVirtualizer({
      count: this.rows.length,
      estimateSize: Number.isFinite(this.rowHeight) && this.rowHeight > 0 ? this.rowHeight : 38,
      getScrollElement: () => this.viewportEl,
      onChange: () => {
        if (this.isConnected) {
          this.requestUpdate();
        }
      },
    });
    virtualizer.mount();

    let theme = captureThemeSnapshot(this);

    const engine: MthTreeTableEngine = {
      table: wrapper.table,
      virtualizer,
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
      getVisibleRows: () =>
        wrapper.table.getRowModel().rows.map((row) => ({
          row,
          id: row.id,
          depth: row.depth,
          canExpand: row.getCanExpand(),
        })),
      toggleRowExpanded: (rowId: string, force?: boolean) => {
        this.toggleRowExpanded(rowId, force);
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
    this.syncExpandedFromProp();
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

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    attachDynamicSheet(this, this.dynamicSheet);
    this._engine?.virtualizer.attachElement(this.viewportEl);
    this.syncDynamicSheet();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('expandedIds')) {
      this.syncExpandedFromProp();
    }
    if (
      changed.has('rows') ||
      changed.has('columns') ||
      changed.has('subRowsKey') ||
      changed.has('expandedIds') ||
      changed.has('rowHeight')
    ) {
      this.syncEngineData();
    }
    this.setCustomState('empty', this.rows.length === 0);
    this.setCustomState('selectable', this.selectable);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this._engine?.virtualizer.attachElement(this.viewportEl);
    this.syncDynamicSheet();
  }

  private syncExpandedFromProp(): void {
    const next: Record<string, boolean> = {};
    for (const id of this.expandedIds) {
      next[id] = true;
    }
    this.expandedState = next;
  }

  private syncEngineData(): void {
    const activeRows = [...this.rows];
    this.tableCore.setRows(activeRows);
    if (this._engine) {
      this._engine.table.setOptions((prev) => ({
        ...prev,
        data: activeRows,
        columns: this.buildTanStackColumns(),
        getSubRows: this.getSubRowsFor,
        state: {
          ...prev.state,
          expanded: this.expandedState as ExpandedState,
        },
      }));
      const count = this._engine.table.getRowModel().rows.length;
      this._engine.virtualizer.updateCount(count, this.rowHeight);
      this._engine.syncTokens(this);
    }
  }

  private syncDynamicSheet(): void {
    if (!this.dynamicSheet) return;
    const safeHeight =
      Number.isFinite(this.rowHeight) && this.rowHeight > 0 ? Math.round(this.rowHeight) : 38;
    const maxDepth = Math.max(
      1,
      ...(this._engine?.table.getRowModel().rows.map((r) => r.depth) ?? [0]),
    );
    const rules: string[] = [`:host { --_tt-row-height: ${safeHeight}px; }`];
    for (let d = 0; d <= maxDepth; d++) {
      rules.push(`.row[data-depth="${d}"] .tree-indent { padding-inline-start: ${d * 1.25}rem; }`);
    }
    this.dynamicSheet.replaceSync(rules.join('\n'));
  }

  toggleRowExpanded(rowId: string, force?: boolean): void {
    const current = Boolean(this.expandedState[rowId]);
    const next = force !== undefined ? force : !current;
    if (next === current) return;
    const updatedMap: Record<string, boolean> = { ...this.expandedState };
    if (next) {
      updatedMap[rowId] = true;
    } else {
      delete updatedMap[rowId];
    }
    this.expandedState = updatedMap;
    this.syncEngineData();
    this.syncDynamicSheet();
    this.requestUpdate();
    this.emitEvent('mth-expand-change', {
      detail: {
        rowId,
        expanded: next,
        expandedIds: Object.keys(this.expandedState),
      },
    });
  }

  private handleRowKeyDown(ev: KeyboardEvent, row: Row<TreeTableRow>, visibleIndex: number): void {
    const canExpand = row.getCanExpand();
    const isExpanded = Boolean(this.expandedState[row.id]);
    const isExpandKey = this.resolvedDir === 'rtl' ? ev.key === 'ArrowLeft' : ev.key === 'ArrowRight';
    const isCollapseKey = this.resolvedDir === 'rtl' ? ev.key === 'ArrowRight' : ev.key === 'ArrowLeft';

    if (isExpandKey && canExpand && !isExpanded) {
      ev.preventDefault();
      this.toggleRowExpanded(row.id, true);
      return;
    }
    if (isCollapseKey && canExpand && isExpanded) {
      ev.preventDefault();
      this.toggleRowExpanded(row.id, false);
      return;
    }
    this.rovingFocus.setActiveIndex(visibleIndex, false);
  }

  override render() {
    const modelRows = this._engine?.table.getRowModel().rows ?? [];
    return html`
      <div part="base" class="base">
        <div part="viewport" class="viewport">
          <div
            part="grid"
            class="grid"
            role="treegrid"
            aria-label=${this.label || this.t('gridLabel')}
          >
            <div part="header" class="row header-row" role="row">
              ${this.selectable
                ? html`<div class="header-cell select-cell" role="columnheader"></div>`
                : nothing}
              ${this.columns.map(
                (col) => html`<div class="header-cell" role="columnheader">${col.header}</div>`,
              )}
            </div>
            ${modelRows.length === 0
              ? html`
                  <div part="status" class="status" role="status">
                    ${this.t('emptyLabel')}
                    <slot name="fallback"></slot>
                  </div>
                `
              : modelRows.map((row, idx) => {
                  const canExpand = row.getCanExpand();
                  const isExpanded = Boolean(this.expandedState[row.id]);
                  const isSelected = this.selectionCtrl.isSelected(row.id);
                  const firstColKey = this.columns[0]?.accessorKey ?? this.columns[0]?.id ?? 'id';
                  const rowLabel = String(row.original[firstColKey] ?? row.id);

                  return html`
                    <div
                      part="row"
                      class="row body-row"
                      role="row"
                      data-row-id=${row.id}
                      data-depth=${String(row.depth)}
                      data-selected=${isSelected ? 'true' : 'false'}
                      aria-level=${String(row.depth + 1)}
                      aria-expanded=${canExpand ? (isExpanded ? 'true' : 'false') : nothing}
                      aria-selected=${this.selectable ? (isSelected ? 'true' : 'false') : nothing}
                      tabindex=${idx === this.rovingFocus.currentIndex ? '0' : '-1'}
                      @keydown=${(ev: KeyboardEvent) => this.handleRowKeyDown(ev, row, idx)}
                    >
                      ${this.selectable
                        ? html`
                            <div class="cell select-cell" role="gridcell">
                              <input
                                type="checkbox"
                                aria-label=${this.t('selectRowLabel', { id: row.id })}
                                .checked=${isSelected}
                                @change=${() => {
                                  this.selectionCtrl.select(row.id, {
                                    toggle: true,
                                    additive: true,
                                  });
                                  this.requestUpdate();
                                }}
                              />
                            </div>
                          `
                        : nothing}
                      ${this.columns.map((col, colIdx) => {
                        const val = row.original[col.accessorKey ?? col.id];
                        const textVal = val === undefined || val === null ? '' : String(val);
                        return html`
                          <div part="cell" class="cell ${colIdx === 0 ? 'tree-indent' : ''}" role="gridcell">
                            ${colIdx === 0 && canExpand
                              ? html`
                                  <button
                                    part="toggle"
                                    type="button"
                                    class="tree-toggle"
                                    aria-label=${isExpanded
                                      ? this.t('collapseRowLabel', { name: rowLabel })
                                      : this.t('expandRowLabel', { name: rowLabel })}
                                    @click=${(ev: Event) => {
                                      ev.stopPropagation();
                                      this.toggleRowExpanded(row.id);
                                    }}
                                  >
                                    ${isExpanded ? '▾' : '▸'}
                                  </button>
                                `
                              : nothing}
                            <span>${textVal}</span>
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
