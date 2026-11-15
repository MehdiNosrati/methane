import { UIElement, type PropertyValues } from '@methane/core';
import {
  InputController,
  RovingFocusController,
  SelectionController,
  VirtualizerController,
} from '@methane/primitives';
import { html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import {
  attachDynamicSheet,
  captureThemeSnapshot,
  createDynamicSheet,
  readCssToken,
  type BaseSatelliteEngine,
} from '../../shared/engine.js';
import {
  colIndexToLetters,
  evaluateSheet,
  formatA1Address,
  formatR1C1Address,
  parseA1Address,
  type CellCoord,
  type EvaluatedCell,
} from '../../shared/formula-ast.js';
import { spreadsheetMessages } from './spreadsheet.messages.js';
import { spreadsheetStyles } from './spreadsheet.styles.js';

export type AddressMode = 'A1' | 'R1C1';

export interface MthSpreadsheetEngine extends BaseSatelliteEngine {
  readonly virtualizer: VirtualizerController;
  evaluate(): Readonly<Record<string, EvaluatedCell>>;
  getCell(address: string): EvaluatedCell;
  setCellRaw(address: string, raw: string): EvaluatedCell;
  getActiveAddress(): string;
  formatAddress(coord: CellCoord): string;
  copyRangeTsv(startAddr: string, endAddr?: string): string;
  pasteTsv(startAddr: string, tsv: string): void;
}

/**
 * `<mth-spreadsheet>`: virtualized worksheet wrapping `@methane/primitives` and a
 * clean-room MIT Formula AST evaluator supporting A1/R1C1 addressing and cycle detection.
 */
export class MthSpreadsheet extends UIElement {
  static override messages = spreadsheetMessages;
  static override styles = spreadsheetStyles;

  @property({ type: Number })
  rows = 20;

  @property({ type: Number })
  cols = 8;

  @property({ attribute: false })
  cells: Readonly<Record<string, string>> = {};

  @property({ type: String, attribute: 'address-mode', reflect: true })
  addressMode: AddressMode = 'A1';

  @property({ type: String, attribute: 'active-cell', reflect: true })
  activeCell = 'A1';

  @property({ type: Number, attribute: 'row-height' })
  rowHeight = 32;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: String })
  label = '';

  @state()
  private editingAddress: string | null = null;

  @state()
  private draftValue = '';

  @query('.viewport')
  private viewportEl!: HTMLElement | null;

  @query('.cell-editor')
  private editorEl!: HTMLInputElement | null;

  private readonly virtualizer: VirtualizerController;
  private readonly rovingFocus: RovingFocusController;
  private readonly selectionCtrl: SelectionController;
  private readonly inputCtrl: InputController;
  private readonly dynamicSheet: CSSStyleSheet | null = createDynamicSheet();

  private _engine: MthSpreadsheetEngine | null = null;
  private evaluatedMap: Readonly<Record<string, EvaluatedCell>> = {};

  constructor() {
    super();
    this.virtualizer = new VirtualizerController(this, {
      count: this.rows,
      estimateSize: this.rowHeight,
      columns: this.cols,
      estimateColumnSize: 104,
      getScrollElement: () => this.viewportEl,
    });
    this.rovingFocus = new RovingFocusController(this, {
      orientation: 'both',
      columns: this.cols,
      loop: false,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('.cell-btn') ?? []),
    });
    this.selectionCtrl = new SelectionController(this, { mode: 'multiple' });
    this.inputCtrl = new InputController(this, {
      onCommitValue: (val) => {
        this.draftValue = val;
      },
    });
  }

  get engine(): MthSpreadsheetEngine | null {
    return this._engine;
  }

  private get safeRows(): number {
    return Math.max(1, Math.min(200, Number.isFinite(this.rows) ? Math.round(this.rows) : 20));
  }

  private get safeCols(): number {
    return Math.max(1, Math.min(52, Number.isFinite(this.cols) ? Math.round(this.cols) : 8));
  }

  private normalizeAddr(rawAddr: string): string {
    const parsed = parseA1Address(rawAddr);
    return parsed ? formatA1Address(parsed) : 'A1';
  }

  private getEvaluatedCell(addr: string): EvaluatedCell {
    const key = this.normalizeAddr(addr);
    return (
      this.evaluatedMap[key] ?? {
        address: key,
        raw: this.cells[key] ?? '',
        value: this.cells[key] ?? '',
        dependencies: [],
      }
    );
  }

  private formatDisplayAddress(coord: CellCoord): string {
    return this.addressMode === 'R1C1' ? formatR1C1Address(coord) : formatA1Address(coord);
  }

  private createEngine(): MthSpreadsheetEngine {
    let theme = captureThemeSnapshot(this);
    return {
      virtualizer: this.virtualizer,
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
      evaluate: () => {
        this.recalculate();
        return this.evaluatedMap;
      },
      getCell: (address: string) => this.getEvaluatedCell(address),
      setCellRaw: (address: string, raw: string) => this.commitCellValue(address, raw),
      getActiveAddress: () => {
        const coord = parseA1Address(this.activeCell) ?? { row: 0, col: 0 };
        return this.formatDisplayAddress(coord);
      },
      formatAddress: (coord: CellCoord) => this.formatDisplayAddress(coord),
      copyRangeTsv: (startAddr: string, endAddr?: string) => this.copyRangeTsv(startAddr, endAddr),
      pasteTsv: (startAddr: string, tsv: string) => this.pasteTsv(startAddr, tsv),
      dispose: () => {
        this.editingAddress = null;
      },
    };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = this.createEngine();
    }
    this.recalculate();
    this.syncDynamicSheet();
  }

  override disconnectedCallback(): void {
    this._engine?.dispose();
    this._engine = null;
    super.disconnectedCallback();
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    attachDynamicSheet(this, this.dynamicSheet);
    this.syncDynamicSheet();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('rows')) {
      this.virtualizer.setCount(this.safeRows);
    }
    if (changed.has('cols')) {
      this.virtualizer.setColumns(this.safeCols);
      this.rovingFocus.updateOptions({ columns: this.safeCols });
    }
    if (changed.has('cells')) {
      this.recalculate();
    }
    this.setCustomState('readonly', this.readonly);
    this.setCustomState('editing', this.editingAddress !== null);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncDynamicSheet();
    if (this.editingAddress && this.editorEl) {
      this.inputCtrl.bind(this.editorEl);
    } else {
      this.inputCtrl.bind(null);
    }
  }

  private recalculate(): void {
    this.evaluatedMap = evaluateSheet(this.cells);
  }

  private syncDynamicSheet(): void {
    if (!this.dynamicSheet) return;
    const safeH =
      Number.isFinite(this.rowHeight) && this.rowHeight > 0 ? Math.round(this.rowHeight) : 32;
    this.dynamicSheet.replaceSync(`:host { --_ss-row-height: ${safeH}px; }`);
  }

  selectCell(address: string): void {
    const key = this.normalizeAddr(address);
    this.activeCell = key;
    this.selectionCtrl.select(key, { toggle: false });
    const coord = parseA1Address(key) ?? { row: 0, col: 0 };
    const evaluated = this.getEvaluatedCell(key);
    this.emitEvent('mth-cell-select', {
      detail: {
        address: key,
        displayAddress: this.formatDisplayAddress(coord),
        raw: evaluated.raw,
        value: evaluated.value,
      },
    });
  }

  commitCellValue(address: string, raw: string): EvaluatedCell {
    const key = this.normalizeAddr(address);
    this.cells = { ...this.cells, [key]: raw };
    this.recalculate();
    const evaluated = this.getEvaluatedCell(key);
    this.editingAddress = null;
    this.requestUpdate();
    this.emitEvent('mth-cell-change', {
      detail: { address: key, raw, value: evaluated.value },
    });
    return evaluated;
  }

  copyRangeTsv(startAddr: string, endAddr: string = startAddr): string {
    const s = parseA1Address(startAddr) ?? { row: 0, col: 0 };
    const e = parseA1Address(endAddr) ?? s;
    const minR = Math.min(s.row, e.row);
    const maxR = Math.max(s.row, e.row);
    const minC = Math.min(s.col, e.col);
    const maxC = Math.max(s.col, e.col);

    const lines: string[] = [];
    for (let r = minR; r <= maxR; r++) {
      const colsText: string[] = [];
      for (let c = minC; c <= maxC; c++) {
        const cell = this.getEvaluatedCell(formatA1Address({ row: r, col: c }));
        colsText.push(String(cell.value));
      }
      lines.push(colsText.join('\t'));
    }
    return lines.join('\n');
  }

  pasteTsv(startAddr: string, tsv: string): void {
    if (this.readonly) return;
    const origin = parseA1Address(startAddr) ?? { row: 0, col: 0 };
    const nextCells = { ...this.cells };
    const rowLines = tsv.replace(/\r\n/g, '\n').split('\n');
    rowLines.forEach((line, rOff) => {
      line.split('\t').forEach((val, cOff) => {
        const r = origin.row + rOff;
        const c = origin.col + cOff;
        if (r < this.safeRows && c < this.safeCols) {
          nextCells[formatA1Address({ row: r, col: c })] = val;
        }
      });
    });
    this.cells = nextCells;
    this.recalculate();
    this.requestUpdate();
  }

  private startEditing(addr: string): void {
    if (this.readonly) return;
    const key = this.normalizeAddr(addr);
    this.activeCell = key;
    this.editingAddress = key;
    this.draftValue = this.cells[key] ?? '';
  }

  private handleCellKeyDown(ev: KeyboardEvent, coord: CellCoord): void {
    const rowCount = this.safeRows;
    const colCount = this.safeCols;
    const rtl = this.resolvedDir === 'rtl';
    let nextRow = coord.row;
    let nextCol = coord.col;
    let moved = false;

    if (ev.key === 'ArrowDown') {
      nextRow = Math.min(rowCount - 1, coord.row + 1);
      moved = true;
    } else if (ev.key === 'ArrowUp') {
      nextRow = Math.max(0, coord.row - 1);
      moved = true;
    } else if (ev.key === 'ArrowRight') {
      nextCol = rtl ? Math.max(0, coord.col - 1) : Math.min(colCount - 1, coord.col + 1);
      moved = true;
    } else if (ev.key === 'ArrowLeft') {
      nextCol = rtl ? Math.min(colCount - 1, coord.col + 1) : Math.max(0, coord.col - 1);
      moved = true;
    } else if (ev.key === 'Enter' || ev.key === 'F2') {
      ev.preventDefault();
      this.startEditing(formatA1Address(coord));
      return;
    }

    if (moved) {
      ev.preventDefault();
      const targetAddr = formatA1Address({ row: nextRow, col: nextCol });
      this.selectCell(targetAddr);
    }
  }

  override render() {
    const rowCount = this.safeRows;
    const colCount = this.safeCols;
    const activeKey = this.normalizeAddr(this.activeCell);

    return html`
      <div part="base" class="base">
        <div part="viewport" class="viewport">
          <div
            part="grid"
            class="grid"
            role="grid"
            aria-label=${this.label || this.t('gridLabel')}
            aria-readonly=${this.readonly ? 'true' : 'false'}
          >
            <div part="header" class="row header-row" role="row">
              <div class="corner-header" role="columnheader" aria-label=${this.t('cornerHeaderLabel')}>
                ${this.addressMode}
              </div>
              ${Array.from({ length: colCount }, (_, c) => {
                const colLabel =
                  this.addressMode === 'R1C1' ? `C${c + 1}` : colIndexToLetters(c);
                return html`
                  <div
                    class="col-header"
                    role="columnheader"
                    aria-label=${this.t('columnHeaderLabel', { column: colLabel })}
                  >
                    ${colLabel}
                  </div>
                `;
              })}
            </div>
            ${Array.from({ length: rowCount }, (_, r) => {
              const rowLabel = this.addressMode === 'R1C1' ? `R${r + 1}` : String(r + 1);
              return html`
                <div part="row" class="row" role="row">
                  <div
                    class="row-header"
                    role="rowheader"
                    aria-label=${this.t('rowHeaderLabel', { row: rowLabel })}
                  >
                    ${rowLabel}
                  </div>
                  ${Array.from({ length: colCount }, (__, c) => {
                    const addr = formatA1Address({ row: r, col: c });
                    const evaluated = this.getEvaluatedCell(addr);
                    const isActive = addr === activeKey;
                    const isEditing = addr === this.editingAddress;
                    const displayAddr = this.formatDisplayAddress({ row: r, col: c });

                    return html`
                      <div part="cell" class="cell" role="gridcell" data-address=${addr}>
                        ${isEditing
                          ? html`
                              <input
                                part="editor"
                                type="text"
                                class="cell-editor"
                                aria-label=${this.t('cellEditorLabel', { address: displayAddr })}
                                .value=${this.draftValue}
                                @input=${(ev: Event) => {
                                  if (this.inputCtrl.isComposing) return;
                                  this.draftValue = (ev.target as HTMLInputElement).value;
                                }}
                                @keydown=${(ev: KeyboardEvent) => {
                                  if (ev.key === 'Enter' && !this.inputCtrl.isComposing) {
                                    ev.preventDefault();
                                    this.commitCellValue(addr, this.draftValue);
                                  } else if (ev.key === 'Escape') {
                                    ev.preventDefault();
                                    this.editingAddress = null;
                                  }
                                }}
                                @blur=${() => {
                                  if (this.editingAddress === addr) {
                                    this.commitCellValue(addr, this.draftValue);
                                  }
                                }}
                              />
                            `
                          : html`
                              <button
                                type="button"
                                class="cell-btn"
                                data-address=${addr}
                                data-active=${isActive ? 'true' : 'false'}
                                data-error=${evaluated.error ? 'true' : 'false'}
                                tabindex=${isActive ? '0' : '-1'}
                                aria-label=${`${displayAddr}: ${String(evaluated.value)}`}
                                @click=${() => this.selectCell(addr)}
                                @dblclick=${() => this.startEditing(addr)}
                                @keydown=${(ev: KeyboardEvent) =>
                                  this.handleCellKeyDown(ev, { row: r, col: c })}
                              >
                                ${String(evaluated.value)}
                              </button>
                            `}
                      </div>
                    `;
                  })}
                </div>
              `;
            })}
          </div>
        </div>
        <div class="fallback-slot"><slot name="fallback"></slot></div>
      </div>
    `;
  }
}
