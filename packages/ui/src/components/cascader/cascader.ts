import { UIElement, type PropertyValues } from '@methane/core';
import {
  FormControlController,
  OverlayController,
  PositioningController,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { cascaderMessages } from './cascader.messages.js';
import { cascaderStyles } from './cascader.styles.js';

export interface CascaderOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly children?: ReadonlyArray<CascaderOption>;
}

export interface CascaderChangeDetail {
  readonly value: string;
  readonly path: ReadonlyArray<string>;
  readonly selectedOptions: ReadonlyArray<CascaderOption>;
}

let cascaderIdCounter = 0;

/**
 * `<mth-cascader>`: form-associated hierarchical multi-column cascader picker
 * with keyboard navigation and top-layer popover overlay.
 */
export class MthCascader extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = cascaderMessages;
  static override styles = cascaderStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  @property({ type: String })
  separator = '/';

  @property({ attribute: false })
  options: ReadonlyArray<CascaderOption> | null = null;

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder: string = cascaderMessages.placeholder;

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean })
  clearable = true;

  @property({ type: Boolean, attribute: 'change-on-select' })
  changeOnSelect = false;

  @property({ type: String, attribute: 'expand-trigger' })
  expandTrigger: 'click' | 'hover' = 'click';

  @state()
  private activePath: ReadonlyArray<string> = [];

  @state()
  private focusedColumn = 0;

  @state()
  private focusedRow = 0;

  @state()
  private formDisabled = false;

  @query('.trigger')
  private triggerEl!: HTMLButtonElement;

  @query('.popup')
  private popupEl!: HTMLElement;

  private readonly uid = `mth-cascader-${++cascaderIdCounter}`;
  private syncingValue = false;
  private syncingOpen = false;
  private readonly formCtrl: FormControlController;
  private readonly overlayCtrl: OverlayController;
  private readonly positionCtrl: PositioningController;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: this.defaultValue,
      required: this.required,
      disabled: this.disabled,
      messages: {
        required: cascaderMessages.requiredError,
      },
      onValueSync: (val) => {
        const next = val ?? '';
        if (this.value !== next) {
          this.syncingValue = true;
          this.value = next;
          this.syncingValue = false;
        }
        this.activePath = this.parsePath(next);
      },
      onDisabledChange: (isDisabled) => {
        this.formDisabled = isDisabled;
      },
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.popupEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      onOpenChange: (nextOpen) => {
        if (this.syncingOpen) return;
        this.syncingOpen = true;
        this.open = nextOpen;
        this.syncingOpen = false;
        if (nextOpen) {
          this.prepareOpenState();
          void this.updateComplete.then(() => {
            this.positionCtrl.reposition();
          });
        }
      },
    });

    this.positionCtrl = new PositioningController(this, {
      anchor: () => this.triggerEl,
      floating: () => this.popupEl,
      placement: 'bottom-start',
      offset: 6,
      flip: true,
      shift: true,
    });
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  get selectedOptions(): ReadonlyArray<CascaderOption> {
    return this.resolveOptionsForPath(this.parsePath(this.value));
  }

  get dirty(): boolean {
    return this.formCtrl.dirty;
  }

  get touched(): boolean {
    return this.formCtrl.touched;
  }

  get invalid(): boolean {
    return this.formCtrl.invalid;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage;
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  async show(): Promise<void> {
    if (this.isEffectivelyDisabled) return;
    await this.syncOverlay(true);
    await this.updateComplete;
  }

  async hide(): Promise<void> {
    await this.syncOverlay(false);
    await this.updateComplete;
  }

  clear(): void {
    if (this.isEffectivelyDisabled) return;
    this.activePath = [];
    this.commitValue('');
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    if (disabled && this.open) {
      this.open = false;
    }
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
  }

  protected override onFormStateRestore(state: string | File | FormData | null, mode: 'restore' | 'autocomplete'): void {
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  protected override firstUpdated(): void {
    this.formCtrl.setDefaultValue(this.defaultValue || this.value);
    if (this.value) {
      this.formCtrl.setValue(this.value, { markDirty: false });
      this.activePath = this.parsePath(this.value);
    }
    if (this.open && !this.isEffectivelyDisabled) {
      void this.syncOverlay(true);
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('defaultValue')) {
      this.formCtrl.setDefaultValue(this.defaultValue);
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changed.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
      if (this.disabled && this.open) {
        this.open = false;
      }
    }
    if (changed.has('error')) {
      this.formCtrl.setValidity(this.error ? { customError: true } : {}, this.error);
    }
    if (changed.has('value') && !this.syncingValue) {
      this.formCtrl.setValue(this.value, { markDirty: false });
      this.activePath = this.parsePath(this.value);
    }
    if (changed.has('open') && !this.syncingOpen) {
      void this.syncOverlay(this.open);
    }
  }

  private async syncOverlay(nextOpen: boolean): Promise<void> {
    this.syncingOpen = true;
    try {
      if (nextOpen) {
        if (this.isEffectivelyDisabled) {
          this.open = false;
          return;
        }
        this.prepareOpenState();
        const opened = await this.overlayCtrl.show();
        this.open = opened;
        if (opened) {
          this.positionCtrl.reposition();
        }
      } else {
        const closed = await this.overlayCtrl.hide();
        this.open = !closed;
      }
    } finally {
      this.syncingOpen = false;
    }
  }

  private prepareOpenState(): void {
    const parsed = this.parsePath(this.value);
    this.activePath = parsed;
    const cols = this.computeColumns();
    const colIndex = Math.max(0, cols.length - 1);
    const currentVal = parsed[colIndex];
    const items = cols[colIndex] ?? [];
    const foundRow = currentVal ? items.findIndex((o) => o.value === currentVal) : -1;
    this.focusedColumn = colIndex;
    this.focusedRow = foundRow >= 0 ? foundRow : 0;
  }

  private parsePath(val: string): ReadonlyArray<string> {
    if (!val) return [];
    const sep = this.separator || '/';
    return val.split(sep).filter(Boolean);
  }

  private resolveOptionsForPath(path: ReadonlyArray<string>): ReadonlyArray<CascaderOption> {
    const result: CascaderOption[] = [];
    let current = this.options ?? [];
    for (const seg of path) {
      const match = current.find((opt) => opt.value === seg);
      if (!match) break;
      result.push(match);
      current = match.children ?? [];
    }
    return result;
  }

  private computeColumns(): ReadonlyArray<ReadonlyArray<CascaderOption>> {
    const root = this.options ?? [];
    if (root.length === 0) return [];
    const columns: ReadonlyArray<CascaderOption>[] = [root];
    let current = root;
    for (const seg of this.activePath) {
      const match = current.find((opt) => opt.value === seg);
      if (!match?.children || match.children.length === 0) break;
      columns.push(match.children);
      current = match.children;
    }
    return columns;
  }

  private commitValue(nextValue: string): void {
    const path = this.parsePath(nextValue);
    const selectedOptions = this.resolveOptionsForPath(path);
    this.syncingValue = true;
    this.value = nextValue;
    this.syncingValue = false;
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.formCtrl.validate();
    this.dispatchEvent(
      new CustomEvent<CascaderChangeDetail>('mth-change', {
        bubbles: true,
        composed: true,
        detail: {
          value: nextValue,
          path,
          selectedOptions,
        },
      }),
    );
  }

  private handleTriggerClick = (): void => {
    if (this.isEffectivelyDisabled) return;
    this.open = !this.open;
  };

  private handleTriggerKeyDown = (e: KeyboardEvent): void => {
    if (this.isEffectivelyDisabled) return;
    if (!this.open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      this.open = true;
    }
  };

  private handleClearClick = (e: MouseEvent): void => {
    e.stopPropagation();
    this.clear();
    this.triggerEl?.focus();
  };

  private selectOrExpandOption(colIndex: number, rowIndex: number, option: CascaderOption, commit: boolean): void {
    if (option.disabled) return;
    const nextPath = [...this.activePath.slice(0, colIndex), option.value];
    this.activePath = nextPath;
    this.focusedColumn = colIndex;
    this.focusedRow = rowIndex;

    const hasChildren = Boolean(option.children && option.children.length > 0);
    if (!hasChildren) {
      if (commit) {
        this.commitValue(nextPath.join(this.separator || '/'));
        this.open = false;
      }
      return;
    }

    if (commit && this.changeOnSelect) {
      this.commitValue(nextPath.join(this.separator || '/'));
    }
  }

  private handlePopupKeyDown = (e: KeyboardEvent): void => {
    const columns = this.computeColumns();
    if (columns.length === 0) return;

    const colIdx = Math.min(this.focusedColumn, columns.length - 1);
    const colItems = columns[colIdx] ?? [];
    if (colItems.length === 0) return;

    const isRtl = typeof window !== 'undefined' && getComputedStyle(this).direction === 'rtl';
    const drillKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.focusedRow = (this.focusedRow + 1) % colItems.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.focusedRow = (this.focusedRow - 1 + colItems.length) % colItems.length;
    } else if (e.key === drillKey) {
      e.preventDefault();
      const active = colItems[this.focusedRow];
      if (active && !active.disabled && active.children && active.children.length > 0) {
        this.selectOrExpandOption(colIdx, this.focusedRow, active, false);
        this.focusedColumn = colIdx + 1;
        this.focusedRow = 0;
      }
    } else if (e.key === backKey) {
      e.preventDefault();
      if (colIdx > 0) {
        const parentCol = columns[colIdx - 1] ?? [];
        const parentVal = this.activePath[colIdx - 1];
        const parentRow = parentVal ? parentCol.findIndex((o) => o.value === parentVal) : 0;
        this.activePath = this.activePath.slice(0, colIdx - 1);
        this.focusedColumn = colIdx - 1;
        this.focusedRow = parentRow >= 0 ? parentRow : 0;
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const active = colItems[this.focusedRow];
      if (active && !active.disabled) {
        this.selectOrExpandOption(colIdx, this.focusedRow, active, true);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.open = false;
    }
  };

  private handleBlur = (): void => {
    this.formCtrl.markTouched();
  };

  private renderDisplayValue(): string {
    const selected = this.selectedOptions;
    if (selected.length > 0) {
      return selected.map((opt) => opt.label).join(` ${this.separator || '/'} `);
    }
    return this.value;
  }

  protected override render() {
    const labelId = `${this.uid}-label`;
    const popupId = `${this.uid}-popup`;
    const hintId = `${this.uid}-hint`;
    const errorId = `${this.uid}-error`;
    const effectiveError = this.error || (this.invalid ? this.validationMessage : '');
    const describedBy = [this.hint ? hintId : '', effectiveError ? errorId : ''].filter(Boolean).join(' ') || undefined;

    const displayText = this.renderDisplayValue();
    const columns = this.computeColumns();
    const isRtl = typeof document !== 'undefined' && (this.dir === 'rtl' || document.documentElement.dir === 'rtl');
    const arrowGlyph = isRtl ? '‹' : '›';

    return html`
      <div class="base" part="base">
        ${this.label
          ? html`<label class="label" part="label" id=${labelId}>
              <slot name="label">${this.label}</slot>
            </label>`
          : html`<slot name="label"></slot>`}

        <div class="control" part="control">
          <button
            type="button"
            class="trigger"
            part="trigger"
            aria-haspopup="dialog"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls=${popupId}
            aria-labelledby=${this.label ? labelId : nothing}
            aria-label=${!this.label ? this.placeholder : nothing}
            aria-describedby=${describedBy ?? nothing}
            ?disabled=${this.isEffectivelyDisabled}
            @click=${this.handleTriggerClick}
            @keydown=${this.handleTriggerKeyDown}
            @blur=${this.handleBlur}
          >
            <span class="value-text ${displayText ? '' : 'placeholder'}" part="value">
              ${displayText || this.placeholder}
            </span>
            <span class="caret" part="caret" aria-hidden="true">${this.open ? '▴' : '▾'}</span>
          </button>

          ${this.clearable && this.value && !this.isEffectivelyDisabled
            ? html`
                <button
                  type="button"
                  class="clear"
                  part="clear"
                  aria-label=${cascaderMessages.clearLabel}
                  @click=${this.handleClearClick}
                >
                  ✕
                </button>
              `
            : nothing}
        </div>

        <div
          id=${popupId}
          class="popup"
          part="popup"
          role="dialog"
          aria-label=${this.label || cascaderMessages.placeholder}
          ?hidden=${!this.open}
          @keydown=${this.handlePopupKeyDown}
        >
          ${columns.length === 0
            ? html`<div class="empty">${cascaderMessages.noOptions}</div>`
            : html`
                <div class="columns" part="columns">
                  ${columns.map((items, colIndex) => html`
                    <ul
                      class="column"
                      part="column"
                      role="listbox"
                      aria-label=${`${cascaderMessages.levelLabel} ${colIndex + 1}`}
                    >
                      ${items.map((opt, rowIndex) => {
                        const isSelected = this.activePath[colIndex] === opt.value;
                        const isActive = this.focusedColumn === colIndex && this.focusedRow === rowIndex;
                        const hasChildren = Boolean(opt.children && opt.children.length > 0);
                        return html`
                          <li
                            class="option"
                            part="option"
                            role="option"
                            aria-selected=${isSelected ? 'true' : 'false'}
                            aria-disabled=${opt.disabled ? 'true' : 'false'}
                            data-active=${isActive ? 'true' : 'false'}
                            data-value=${opt.value}
                            @click=${() => this.selectOrExpandOption(colIndex, rowIndex, opt, true)}
                            @mouseenter=${() => {
                              if (this.expandTrigger === 'hover' && hasChildren) {
                                this.selectOrExpandOption(colIndex, rowIndex, opt, false);
                              }
                            }}
                          >
                            <span>${opt.label}</span>
                            ${hasChildren ? html`<span aria-hidden="true">${arrowGlyph}</span>` : nothing}
                          </li>
                        `;
                      })}
                    </ul>
                  `)}
                </div>
              `}
        </div>

        ${this.hint
          ? html`<div class="hint" part="hint" id=${hintId}>
              <slot name="hint">${this.hint}</slot>
            </div>`
          : html`<slot name="hint"></slot>`}

        ${effectiveError
          ? html`<div class="error" part="error" id=${errorId} role="alert">
              <slot name="error">${effectiveError}</slot>
            </div>`
          : html`<slot name="error"></slot>`}
      </div>
    `;
  }
}
