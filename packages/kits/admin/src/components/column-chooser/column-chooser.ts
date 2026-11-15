import { UIElement, type PropertyValues } from '@methane/core';
import {
  DragSortController,
  RovingFocusController,
  SelectionController,
} from '@methane/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { columnChooserMessages } from './column-chooser.messages.js';
import { columnChooserStyles } from './column-chooser.styles.js';

export interface ColumnChooserItem {
  readonly id: string;
  readonly label: string;
  readonly visible: boolean;
  readonly locked?: boolean;
}

/**
 * `<mth-column-chooser>`: Column visibility and drag/keyboard reorder panel.
 */
export class MthColumnChooser extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = columnChooserMessages;
  static override styles = columnChooserStyles;

  @property({ attribute: false })
  columns: ReadonlyArray<ColumnChooserItem> = [];

  @property({ type: Boolean, attribute: 'allow-reorder' })
  allowReorder = true;

  @property({ type: Boolean, attribute: 'allow-reset' })
  allowReset = true;

  private defaultSnapshot: ReadonlyArray<ColumnChooserItem> = [];
  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingFocus: RovingFocusController;
  private readonly dragSort: DragSortController;

  constructor() {
    super();
    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'multiple',
      allowEmpty: true,
      onChange: (selected) => {
        const selectedSet = new Set(selected);
        const next = this.columns.map((col) =>
          col.locked ? col : { ...col, visible: selectedSet.has(col.id) },
        );
        this.columns = next;
        this.emitEvent('mth-change', { detail: { columns: next } });
      },
    });
    this.rovingFocus = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[data-col-row]') ?? []),
    });
    this.dragSort = new DragSortController(this, {
      orientation: 'vertical',
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[data-col-row]') ?? []),
      onReorder: ({ fromIndex, toIndex }) => {
        if (!this.allowReorder) return;
        this.moveColumn(fromIndex, toIndex);
      },
    });
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.rovingFocus.updateOptions({ dir: this.resolvedDir });
    if (changed.has('columns')) {
      if (this.defaultSnapshot.length === 0 && this.columns.length > 0) {
        this.defaultSnapshot = this.columns.map((col) => ({ ...col }));
      }
      this.selectionCtrl.setItems(
        this.columns.map((c) => ({ value: c.id, ...(c.locked ? { disabled: true } : {}) })),
      );
      for (const col of this.columns) {
        if (col.visible && !this.selectionCtrl.isSelected(col.id)) {
          this.selectionCtrl.select(col.id, { additive: true });
        }
      }
    }
    this.setCustomState('empty', this.columns.length === 0);
  }

  toggleColumn(id: string): void {
    const col = this.columns.find((c) => c.id === id);
    if (!col || col.locked) return;
    const next = this.columns.map((c) =>
      c.id === id ? { ...c, visible: !c.visible } : c,
    );
    this.columns = next;
    this.emitEvent('mth-change', { detail: { columns: next } });
  }

  moveColumn(fromIndex: number, toIndex: number): void {
    if (
      !this.allowReorder ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.columns.length ||
      toIndex >= this.columns.length
    ) {
      return;
    }
    const copy = [...this.columns];
    const [moved] = copy.splice(fromIndex, 1);
    if (!moved) return;
    copy.splice(toIndex, 0, moved);
    this.columns = copy;
    this.emitEvent('mth-change', { detail: { columns: copy } });
  }

  resetDefaults(): void {
    if (this.defaultSnapshot.length > 0) {
      this.columns = this.defaultSnapshot.map((c) => ({ ...c }));
      this.emitEvent('mth-change', { detail: { columns: this.columns } });
    }
    this.emitEvent('mth-reset', { detail: {} });
  }

  get activeDragIndex(): number {
    return this.dragSort.activeDragIndex;
  }

  override render() {
    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.t('regionLabel')}
        dir=${this.resolvedDir}
      >
        <div part="header" class="header">
          <h3 class="title">${this.t('heading')}</h3>
          <button
            type="button"
            ?hidden=${!this.allowReset}
            @click=${() => this.resetDefaults()}
          >
            ${this.t('resetDefaults')}
          </button>
        </div>

        <ul part="list" class="list" role="list">
          ${this.columns.map(
            (col, index) => html`
              <li
                part="item"
                class="item"
                data-col-row
                data-column-id=${col.id}
              >
                <label class="label-wrap">
                  <input
                    type="checkbox"
                    .checked=${col.visible}
                    ?disabled=${Boolean(col.locked)}
                    aria-label=${`${this.t('toggleColumn')}: ${col.label}`}
                    @change=${() => this.toggleColumn(col.id)}
                  />
                  <span>${col.label}</span>
                </label>

                <div class="controls" ?hidden=${!this.allowReorder}>
                  <button
                    type="button"
                    aria-label=${`${this.t('moveUp')}: ${col.label}`}
                    ?disabled=${index === 0}
                    @click=${() => this.moveColumn(index, index - 1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label=${`${this.t('moveDown')}: ${col.label}`}
                    ?disabled=${index === this.columns.length - 1}
                    @click=${() => this.moveColumn(index, index + 1)}
                  >
                    ↓
                  </button>
                </div>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }
}
