import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { columnMessages } from './column.messages.js';
import { columnStyles } from './column.styles.js';

export type MthColumnPin = 'left' | 'right' | null;
export type MthColumnAlign = 'start' | 'center' | 'end';

/**
 * `<mth-column>`: declarative column schema child element for `<mth-table>`.
 */
export class MthColumn extends UIElement {
  static override messages = columnMessages;
  static override styles = columnStyles;

  @property({ type: String, reflect: true })
  field = '';

  @property({ type: String, reflect: true })
  header = '';

  @property({ type: Boolean, reflect: true })
  sortable = false;

  @property({ type: Boolean, reflect: true })
  filterable = true;

  @property({ type: Number })
  width: number | null = null;

  @property({ type: Number, attribute: 'min-width' })
  minWidth: number | null = null;

  @property({ type: String, reflect: true })
  pin: MthColumnPin = null;

  @property({ type: String, reflect: true })
  align: MthColumnAlign = 'start';

  @property({ attribute: false })
  accessor?: (row: Record<string, unknown>) => unknown;

  @property({ attribute: false })
  formatter?: (value: unknown, row: Record<string, unknown>) => string;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStates();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('sortable') || changedProperties.has('pin')) {
      this.syncStates();
    }
  }

  private syncStates(): void {
    this.setCustomState('sortable', this.sortable);
    this.setCustomState('pinned', this.pin === 'left' || this.pin === 'right');
  }

  override render() {
    return html`<span part="base"><slot></slot></span>`;
  }
}
