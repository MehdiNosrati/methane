import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { csvImporterMessages } from './csv-importer.messages.js';
import { csvImporterStyles } from './csv-importer.styles.js';

export interface CsvTargetField {
  readonly key: string;
  readonly label: string;
  readonly required?: boolean;
  readonly validate?: (value: string, mappedRow: Readonly<Record<string, string>>) => string | null;
}

export interface CsvValidatedRow {
  readonly rowIndex: number;
  readonly data: Record<string, string>;
  readonly errors: ReadonlyArray<string>;
}

/**
 * Parses CSV text according to RFC-4180 (quoted cells, escaped double-quotes, CRLF/LF).
 */
export function parseCsvMatrix(input: string): string[][] {
  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!normalized.trim()) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i]!;
    if (inQuotes) {
      if (ch === '"' && normalized[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(cell);
      cell = '';
    } else if (ch === '\n') {
      currentRow.push(cell);
      rows.push(currentRow);
      currentRow = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || currentRow.length > 0) {
    currentRow.push(cell);
    rows.push(currentRow);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

/**
 * `<mth-csv-importer>`: CSV file upload & paste parser with interactive column
 * mapping, validation preview, and commit event.
 */
export class MthCsvImporter extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = csvImporterMessages;
  static override styles = csvImporterStyles;

  @property({ attribute: false })
  fields: ReadonlyArray<CsvTargetField> = [];

  @property({ type: String, attribute: 'raw-csv' })
  rawCsv = '';

  @property({ type: Boolean, attribute: 'has-header' })
  hasHeader = true;

  @state()
  private headers: string[] = [];

  @state()
  private dataRows: string[][] = [];

  @state()
  private mappings: Record<number, string> = {};

  get parsedHeaders(): ReadonlyArray<string> {
    return this.headers;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('rawCsv') || changed.has('hasHeader') || changed.has('fields')) {
      this._reparseCsv(changed.has('rawCsv') || changed.has('hasHeader'));
    }
    const validated = this.getValidatedRows();
    this.setCustomState('empty', validated.length === 0);
    this.setCustomState(
      'invalid',
      validated.some((r) => r.errors.length > 0),
    );
  }

  loadCsv(text: string): void {
    this.rawCsv = text;
  }

  setColumnMapping(columnIndex: number, targetFieldKey: string): void {
    this.mappings = { ...this.mappings, [columnIndex]: targetFieldKey };
  }

  getValidatedRows(): CsvValidatedRow[] {
    return this.dataRows.map((cells, rowIndex) => {
      const mapped: Record<string, string> = {};
      for (let col = 0; col < this.headers.length; col += 1) {
        const key = this.mappings[col];
        if (key) {
          mapped[key] = (cells[col] ?? '').trim();
        }
      }

      const errors: string[] = [];
      for (const field of this.fields) {
        const val = mapped[field.key] ?? '';
        if (field.required && !val) {
          errors.push(this.t('requiredMissing', { field: field.label }));
        }
        if (field.validate) {
          const msg = field.validate(val, mapped);
          if (msg) errors.push(msg);
        }
      }

      return { rowIndex, data: mapped, errors };
    });
  }

  commitImport(): ReadonlyArray<Record<string, string>> {
    const validated = this.getValidatedRows();
    const validRows = validated.filter((r) => r.errors.length === 0).map((r) => r.data);
    const invalidCount = validated.length - validRows.length;
    this.emitEvent('mth-import', {
      detail: {
        rows: validRows,
        invalidCount,
        mappings: { ...this.mappings },
      },
    });
    return validRows;
  }

  private _reparseCsv(resetMapping: boolean): void {
    const matrix = parseCsvMatrix(this.rawCsv);
    if (matrix.length === 0) {
      this.headers = [];
      this.dataRows = [];
      this.mappings = {};
      return;
    }

    const colCount = Math.max(...matrix.map((r) => r.length));
    const nextHeaders = this.hasHeader
      ? Array.from({ length: colCount }, (_, idx) => (matrix[0]?.[idx] ?? `Column ${idx + 1}`).trim())
      : Array.from({ length: colCount }, (_, idx) => `Column ${idx + 1}`);
    const nextRows = this.hasHeader ? matrix.slice(1) : matrix;

    this.headers = nextHeaders;
    this.dataRows = nextRows;

    if (resetMapping || Object.keys(this.mappings).length === 0) {
      const autoMap: Record<number, string> = {};
      nextHeaders.forEach((header, idx) => {
        const norm = header.toLowerCase();
        const match = this.fields.find(
          (f) => f.key.toLowerCase() === norm || f.label.toLowerCase() === norm,
        );
        if (match) {
          autoMap[idx] = match.key;
        }
      });
      this.mappings = autoMap;
    }

    if (resetMapping) {
      this.emitEvent('mth-parse', {
        detail: { headers: nextHeaders, rowCount: nextRows.length },
      });
    }
  }

  private async _onFileChange(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    this.rawCsv = text;
  }

  override render() {
    const validated = this.getValidatedRows();
    const validCount = validated.filter((r) => r.errors.length === 0).length;
    const invalidCount = validated.length - validCount;
    const hasData = this.headers.length > 0;

    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.t('importerLabel')}
        dir=${this.resolvedDir}
      >
        <div part="dropzone" class="dropzone">
          <label class="field-label">
            ${this.t('uploadLabel')}
            <input
              type="file"
              accept=".csv,text/csv"
              @change=${(e: Event) => void this._onFileChange(e)}
            />
          </label>
          <label class="field-label">
            ${this.t('pasteLabel')}
            <textarea
              class="csv-input"
              rows="3"
              placeholder=${this.t('pastePlaceholder')}
              .value=${this.rawCsv}
              @input=${(e: Event) => {
                this.rawCsv = (e.target as HTMLTextAreaElement).value;
              }}
            ></textarea>
          </label>
        </div>

        <p class="hint" ?hidden=${hasData}>${this.t('emptyHint')}</p>

        <div part="mapping" class="mapping" ?hidden=${!hasData}>
          <div class="field-label">${this.t('mappingHeading')}</div>
          <div class="mapping-grid">
            ${this.headers.map(
              (header, idx) => html`
                <label class="map-card">
                  <span class="field-label">${header}</span>
                  <select
                    class="map-select"
                    aria-label=${header}
                    .value=${this.mappings[idx] ?? ''}
                    @change=${(e: Event) =>
                      this.setColumnMapping(idx, (e.target as HTMLSelectElement).value)}
                  >
                    <option value="">${this.t('skipColumn')}</option>
                    ${this.fields.map(
                      (field) => html`
                        <option value=${field.key}>${field.label}</option>
                      `,
                    )}
                  </select>
                </label>
              `,
            )}
          </div>
        </div>

        <div part="preview" class="table-wrap" ?hidden=${validated.length === 0}>
          <table>
            <thead>
              <tr>
                ${this.fields.map((f) => html`<th scope="col">${f.label}</th>`)}
                <th scope="col">${this.t('previewHeading')}</th>
              </tr>
            </thead>
            <tbody>
              ${validated.slice(0, 20).map(
                (row) => html`
                  <tr data-invalid=${row.errors.length > 0 ? 'true' : 'false'}>
                    ${this.fields.map((f) => html`<td>${row.data[f.key] ?? ''}</td>`)}
                    <td>${row.errors.join('; ')}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>

        <div part="actions" class="actions">
          <slot></slot>
          <span class="hint" aria-live="polite">
            ${hasData ? this.t('validSummary', { valid: validCount, invalid: invalidCount }) : ''}
          </span>
          <div class="btn-group">
            <button
              type="button"
              class="btn"
              ?disabled=${!hasData}
              @click=${() => {
                this.rawCsv = '';
              }}
            >
              ${this.t('clearAction')}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${validCount === 0}
              @click=${() => this.commitImport()}
            >
              ${this.t('importAction')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
