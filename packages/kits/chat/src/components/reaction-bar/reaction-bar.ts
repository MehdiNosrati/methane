import { UIElement, type PropertyValues } from '@methane/core';
import { RovingFocusController, SelectionController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { resolveEffectiveDir } from '../../shared/dir.js';
import { reactionBarMessages } from './reaction-bar.messages.js';
import { reactionBarStyles } from './reaction-bar.styles.js';

export interface ReactionItem {
  readonly emoji: string;
  readonly count: number;
  readonly active?: boolean;
  readonly label?: string;
  readonly disabled?: boolean;
}

/**
 * `<mth-reaction-bar>`: interactive emoji reaction bar composing `SelectionController`
 * and RTL-aware `RovingFocusController`.
 */
export class MthReactionBar extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = reactionBarMessages;
  static override styles = reactionBarStyles;

  @property({ attribute: false })
  reactions: ReadonlyArray<ReactionItem> = [];

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: Boolean })
  multiple = true;

  @property({ type: Boolean, attribute: 'allow-add' })
  allowAdd = true;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  private syncingSelection = false;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'multiple',
      allowEmpty: true,
      onChange: (selected) => {
        if (this.syncingSelection) return;
        this.value = selected.join(',');
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[data-roving-item]') ?? []),
      orientation: 'horizontal',
      loop: true,
      dir: 'auto',
    });
  }

  get selectedValues(): ReadonlyArray<string> {
    return this.selectionCtrl.selectedValues;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSelectionFromProps();
    this.setCustomState('disabled', this.disabled);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    this.rovingCtrl.updateOptions({
      dir: resolveEffectiveDir(this, this.resolvedDir),
    });
    if (changed.has('multiple')) {
      this.selectionCtrl.mode = this.multiple ? 'multiple' : 'single';
    }
    if (changed.has('reactions') || changed.has('value')) {
      this.syncSelectionFromProps();
    }
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    this.rovingCtrl.syncTabIndices();
  }

  private syncSelectionFromProps(): void {
    const items = (this.reactions ?? []).map((item) => ({
      value: item.emoji,
      disabled: Boolean(item.disabled),
    }));
    this.syncingSelection = true;
    try {
      this.selectionCtrl.setItems(items);
      const fromAttr = this.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const fromItems = (this.reactions ?? []).filter((r) => r.active).map((r) => r.emoji);
      const target = fromAttr.length > 0 ? fromAttr : fromItems;
      this.selectionCtrl.setSelection(target);
      const resolvedStr = this.selectionCtrl.selectedValues.join(',');
      if (this.value !== resolvedStr && fromAttr.length > 0) {
        this.value = resolvedStr;
      }
    } finally {
      this.syncingSelection = false;
    }
  }

  private toggleReaction(item: ReactionItem): void {
    if (this.disabled || item.disabled) return;
    this.syncingSelection = true;
    try {
      this.selectionCtrl.toggle(item.emoji);
      const values = [...this.selectionCtrl.selectedValues];
      const nextValue = values.join(',');
      this.value = nextValue;
      this.emitEvent('mth-change', {
        detail: {
          value: nextValue,
          values,
          emoji: item.emoji,
          selected: this.selectionCtrl.isSelected(item.emoji),
        },
      });
    } finally {
      this.syncingSelection = false;
    }
  }

  protected override render() {
    const numFmt = new Intl.NumberFormat(this.resolvedLocale);
    const items = this.reactions ?? [];

    return html`
      <div
        class="base"
        part="base"
        dir=${resolveEffectiveDir(this, this.resolvedDir)}
        role="toolbar"
        aria-label=${this.label || this.t('barLabel')}
        aria-disabled=${this.disabled ? 'true' : 'false'}
      >
        ${items.map((item) => {
          const isSelected = this.selectionCtrl.isSelected(item.emoji) || (Boolean(item.active) && !this.value);
          const countDelta =
            isSelected && !item.active ? 1 : !isSelected && item.active ? -1 : 0;
          const displayCount = Math.max(0, item.count + countDelta);
          const formattedCount = numFmt.format(displayCount);
          const labelPrefix = item.label || item.emoji;

          return html`
            <button
              type="button"
              class="pill"
              part="pill"
              data-roving-item
              aria-pressed=${isSelected ? 'true' : 'false'}
              aria-label=${this.t('reactionLabel', { emoji: labelPrefix, count: formattedCount })}
              ?disabled=${this.disabled || Boolean(item.disabled)}
              @click=${() => this.toggleReaction(item)}
            >
              <span class="emoji" part="emoji" aria-hidden="true">${item.emoji}</span>
              <span class="count" part="count">${formattedCount}</span>
            </button>
          `;
        })}

        ${this.allowAdd
          ? html`
              <button
                type="button"
                class="add-button"
                part="add-button"
                data-roving-item
                aria-label=${this.t('addReaction')}
                ?disabled=${this.disabled}
                @click=${() => this.emitEvent('mth-add-reaction')}
              >
                +
              </button>
            `
          : nothing}
      </div>
    `;
  }
}
