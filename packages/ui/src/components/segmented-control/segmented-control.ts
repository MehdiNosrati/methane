import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  FormControlController,
  RovingFocusController,
  SelectionController,
  SlotCollectionController,
} from '@methane-ui/primitives';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { segmentedControlMessages } from './segmented-control.messages.js';
import { segmentedControlStyles } from './segmented-control.styles.js';

export interface SegmentedControlOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export type SegmentedControlSize = 'sm' | 'md' | 'lg';

/**
 * `<mth-segmented-control>`: form-associated single-select segmented control
 * combining `FormControlController`, `SelectionController`, `RovingFocusController`,
 * and an RTL-aware animated CSS indicator pill.
 */
export class MthSegmentedControl extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = segmentedControlMessages;
  static override styles = segmentedControlStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: String, reflect: true })
  size: SegmentedControlSize = 'md';

  @property({ type: Boolean, reflect: true, attribute: 'full-width' })
  fullWidth = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ attribute: false })
  options: ReadonlyArray<SegmentedControlOption> | null = null;

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  @state()
  private resolvedItems: Array<SegmentedControlOption> = [];

  private readonly formCtrl: FormControlController;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingCtrl: RovingFocusController;
  private readonly slotCtrl: SlotCollectionController<HTMLElement, SegmentedControlOption>;
  private dynamicSheet: CSSStyleSheet | null = null;
  private syncingFromSelection = false;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: segmentedControlMessages,
      onValueSync: (nextVal) => {
        this.applyValueString(nextVal);
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: () => {
        const err = this.error || this.slottedErrorText || this.formCtrl.fieldContext?.error || '';
        return err.length > 0 ? { flags: { customError: true }, message: err } : null;
      },
    });

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'single',
      allowEmpty: true,
      onChange: (selected) => {
        const nextValue = selected[0] ?? '';
        this.syncingFromSelection = true;
        this.value = nextValue;
        this.formCtrl.setValue(nextValue, { markDirty: false });
        this.syncingFromSelection = false;
        this.syncIndicatorSheet();
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="segment"]') ?? []),
      orientation: 'horizontal',
      loop: true,
    });

    this.slotCtrl = new SlotCollectionController<HTMLElement, SegmentedControlOption>(this, {
      observeSubtree: true,
      attributeFilter: ['disabled'],
      onItemsChange: () => {
        if (!this.options) {
          this.syncItems();
        }
      },
    });
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.formCtrl.disabled;
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.requestUpdate();
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
  }

  protected override onFormStateRestore(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.ensureDynamicSheet();
    if (!this.shadowRoot || this.hasUpdated) {
      this.syncItems();
    } else {
      this.syncItemsFromState();
    }
    this.syncIndicatorSheet();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);

    if (changed.has('defaultValue')) {
      this.formCtrl.setDefaultValue(this.defaultValue);
    }

    if (changed.has('options')) {
      this.syncItems();
    }

    if (changed.has('value') && !this.syncingFromSelection) {
      this.applyValueString(this.value);
    }

    if (changed.has('required') || changed.has('disabled') || changed.has('error')) {
      this.formCtrl.required = this.required;
      this.formCtrl.hostDisabled = this.disabled;
      this.formCtrl.validate();
    }
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    this.syncIndicatorSheet();
  }

  override focus(options?: FocusOptions): void {
    const active =
      this.shadowRoot?.querySelector<HTMLElement>('[part="segment"][tabindex="0"]') ??
      this.shadowRoot?.querySelector<HTMLElement>('[part="segment"]');
    active?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  private ensureDynamicSheet(): void {
    if (this.dynamicSheet || !this.shadowRoot || typeof CSSStyleSheet === 'undefined') return;
    this.dynamicSheet = new CSSStyleSheet();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, this.dynamicSheet];
  }

  private syncIndicatorSheet(): void {
    this.ensureDynamicSheet();
    const count = Math.max(1, this.resolvedItems.length);
    const idx = this.resolvedItems.findIndex((item) => item.value === this.value);
    this.setCustomState('selected', idx >= 0);
    if (!this.dynamicSheet) return;
    const safeIdx = idx >= 0 ? idx : 0;
    this.dynamicSheet.replaceSync(`:host { --_seg-count: ${count}; --_seg-index: ${safeIdx}; }`);
  }

  private syncItemsFromState(): void {
    if (this.options) {
      this.resolvedItems = [...this.options];
    } else {
      const children = Array.from(this.children ?? []).filter(
        (el): el is HTMLElement => el instanceof HTMLElement && !el.hasAttribute('slot'),
      );
      this.resolvedItems = children.map((el, index) => ({
        value: el.dataset.value ?? el.getAttribute('value') ?? `segment-${index}`,
        label: el.textContent?.trim() ?? `segment-${index}`,
        disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
      }));
    }
    this.selectionCtrl.setItems(
      this.resolvedItems.map((item) => ({ value: item.value, disabled: Boolean(item.disabled) })),
    );
    void this.slotCtrl;
  }

  private syncItems(): void {
    if (this.options) {
      this.resolvedItems = [...this.options];
    } else {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
      if (slot && typeof slot.assignedElements === 'function') {
        const assigned = slot.assignedElements({ flatten: true }).filter(
          (el): el is HTMLElement => el instanceof HTMLElement,
        );
        if (assigned.length > 0) {
          this.resolvedItems = assigned.map((el, index) => ({
            value: el.dataset.value ?? el.getAttribute('value') ?? `segment-${index}`,
            label: el.textContent?.trim() ?? `segment-${index}`,
            disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
          }));
        } else {
          this.syncItemsFromState();
          return;
        }
      } else {
        this.syncItemsFromState();
        return;
      }
    }

    this.selectionCtrl.setItems(
      this.resolvedItems.map((item) => ({ value: item.value, disabled: Boolean(item.disabled) })),
    );
    void this.slotCtrl;
  }

  private applyValueString(raw: string): void {
    this.selectionCtrl.setSelection(raw ? [raw] : []);
    this.value = raw;
    this.formCtrl.setValue(raw, { markDirty: false });
    const idx = this.resolvedItems.findIndex((item) => item.value === raw);
    if (idx >= 0) {
      this.rovingCtrl.setActiveIndex(idx, false);
    }
    this.syncIndicatorSheet();
  }

  private handleSegmentClick(item: SegmentedControlOption, index: number): void {
    if (this.isEffectivelyDisabled || item.disabled) return;
    if (this.value === item.value) return;
    this.selectionCtrl.select(item.value, { toggle: false });
    this.rovingCtrl.setActiveIndex(index, false);
    this.formCtrl.markDirty();
    this.dispatchEvent(
      new CustomEvent('mth-change', {
        detail: { value: item.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleSegmentKeyDown(item: SegmentedControlOption, index: number, event: KeyboardEvent): void {
    if (this.isEffectivelyDisabled || item.disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.handleSegmentClick(item, index);
    }
  }

  private handleLabelSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this.slottedLabelText = slot.assignedNodes({ flatten: true }).map((n) => n.textContent ?? '').join('').trim();
  }

  private handleHintSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this.slottedHintText = slot.assignedNodes({ flatten: true }).map((n) => n.textContent ?? '').join('').trim();
  }

  private handleErrorSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this.slottedErrorText = slot.assignedNodes({ flatten: true }).map((n) => n.textContent ?? '').join('').trim();
  }

  override render() {
    const ctx = this.formCtrl.fieldContext;
    const effLabel = this.label || this.slottedLabelText || ctx?.label || '';
    const effHint = this.hint || this.slottedHintText || ctx?.hint || '';
    const rawError = this.error || this.slottedErrorText || ctx?.error || '';
    const hasLabel = Boolean(effLabel);
    const hasHint = Boolean(effHint);
    const hasError = Boolean(rawError);
    const describedByIds: Array<string> = [];
    if (hasHint) describedByIds.push('mth-sc-hint');
    if (hasError) describedByIds.push('mth-sc-error');

    return html`
      <div part="base" class="base">
        <span id="mth-sc-label" part="label" class="label" ?hidden=${!hasLabel}>
          <slot name="label" @slotchange=${this.handleLabelSlotChange}>${effLabel}</slot>
        </span>

        <div
          part="track"
          class="track"
          role="radiogroup"
          aria-labelledby=${ifDefined(hasLabel ? 'mth-sc-label' : undefined)}
          aria-label=${ifDefined(!hasLabel ? this.t('groupLabel') : undefined)}
          aria-describedby=${ifDefined(describedByIds.length > 0 ? describedByIds.join(' ') : undefined)}
          aria-disabled=${this.isEffectivelyDisabled ? 'true' : 'false'}
        >
          <div part="indicator" class="indicator" aria-hidden="true"></div>
          ${this.resolvedItems.map((item, index) => {
            const isChecked = this.value === item.value;
            const isDisabled = this.isEffectivelyDisabled || Boolean(item.disabled);
            return html`
              <button
                type="button"
                part="segment"
                class="segment"
                role="radio"
                aria-checked=${isChecked ? 'true' : 'false'}
                ?disabled=${isDisabled}
                aria-disabled=${isDisabled ? 'true' : 'false'}
                @click=${() => this.handleSegmentClick(item, index)}
                @keydown=${(e: KeyboardEvent) => this.handleSegmentKeyDown(item, index, e)}
              >
                ${item.label}
              </button>
            `;
          })}
        </div>

        <div class="slot-source" hidden>
          <slot @slotchange=${() => this.syncItems()}></slot>
        </div>

        <div id="mth-sc-hint" part="hint" class="hint" ?hidden=${!hasHint}>
          <slot name="hint" @slotchange=${this.handleHintSlotChange}>${effHint}</slot>
        </div>

        <div id="mth-sc-error" part="error" class="error" role="alert" ?hidden=${!hasError}>
          <slot name="error" @slotchange=${this.handleErrorSlotChange}>${rawError}</slot>
        </div>
      </div>
    `;
  }
}
