import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  FormControlController,
  RovingFocusController,
  SelectionController,
  SlotCollectionController,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { toggleGroupMessages } from './toggle-group.messages.js';
import { toggleGroupStyles } from './toggle-group.styles.js';

export interface ToggleGroupOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export type ToggleGroupOrientation = 'horizontal' | 'vertical';
export type ToggleGroupSize = 'sm' | 'md' | 'lg';

/**
 * `<mth-toggle-group>`: form-associated single or multi-select toggle group
 * combining `FormControlController`, `SelectionController`, and `RovingFocusController`.
 */
export class MthToggleGroup extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = toggleGroupMessages;
  static override styles = toggleGroupStyles;

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

  @property({ type: Boolean, reflect: true })
  multiple = false;

  @property({ type: String, reflect: true })
  orientation: ToggleGroupOrientation = 'horizontal';

  @property({ type: String, reflect: true })
  size: ToggleGroupSize = 'md';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ attribute: false })
  options: ReadonlyArray<ToggleGroupOption> | null = null;

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  @state()
  private resolvedItems: Array<ToggleGroupOption> = [];

  @state()
  private selectedValues: Array<string> = [];

  private readonly formCtrl: FormControlController;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingCtrl: RovingFocusController;
  private readonly slotCtrl: SlotCollectionController<HTMLElement, ToggleGroupOption>;
  private syncingFromSelection = false;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: toggleGroupMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.applyValueToSelection(nextValue);
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: () => {
        const err = this.error || this.slottedErrorText || this.formCtrl.fieldContext?.error || '';
        if (err.length > 0) {
          return { flags: { customError: true }, message: err };
        }
        return null;
      },
    });

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'single',
      allowEmpty: true,
      onChange: (selected) => {
        if (this.syncingFromSelection) return;
        this.selectedValues = [...selected];
        const joined = this.multiple ? selected.join(',') : (selected[0] ?? '');
        this.value = joined;
        this.formCtrl.setValue(joined);
        this.formCtrl.markDirty();
        this.emitEvent('mth-change', {
          detail: { value: joined, values: [...selected] },
        });
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? []),
      orientation: this.orientation,
      loop: true,
    });

    this.slotCtrl = new SlotCollectionController<HTMLElement, ToggleGroupOption>(this, {
      observeSubtree: true,
      attributeFilter: ['value', 'label', 'disabled'],
      onItemsChange: () => {
        this.syncSlotTexts();
        if (this.options === null) {
          this.reconcileItems();
        }
      },
    });
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage || this.internals?.validationMessage || '';
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? null;
  }

  override get labels(): NodeList {
    return this.internals?.labels ?? ([] as unknown as NodeList);
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.formCtrl.disabled;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.value && this.defaultValue) {
      this.value = this.defaultValue;
    }
    this.formCtrl.setDefaultValue(this.defaultValue || this.value);
    this.syncSlotTexts();
    this.reconcileItems();
    this.applyValueToSelection(this.value);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('multiple')) {
      this.selectionCtrl.mode = this.multiple ? 'multiple' : 'single';
    }
    if (changed.has('orientation')) {
      this.rovingCtrl.updateOptions({ orientation: this.orientation });
    }
    if (changed.has('options')) {
      this.reconcileItems();
    }
    if (changed.has('defaultValue')) {
      this.formCtrl.setDefaultValue(this.defaultValue);
    }
    if (changed.has('value')) {
      this.applyValueToSelection(this.value);
      this.formCtrl.setValue(this.value);
    }
    if (changed.has('disabled') || changed.has('required') || changed.has('error')) {
      this.formCtrl.hostDisabled = this.disabled;
      this.formCtrl.required = this.required;
      this.formCtrl.validate();
    }
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

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  setCustomValidity(message: string): void {
    this.error = message;
    this.formCtrl.validate();
  }

  private syncSlotTexts(): void {
    let lbl = '';
    let hnt = '';
    let err = '';
    for (const child of Array.from(this.children ?? [])) {
      if (!(child instanceof HTMLElement)) continue;
      const slotName = child.getAttribute('slot');
      const txt = child.textContent?.trim() ?? '';
      if (slotName === 'label' && txt) lbl = txt;
      else if (slotName === 'hint' && txt) hnt = txt;
      else if (slotName === 'error' && txt) err = txt;
    }
    this.slottedLabelText = lbl;
    this.slottedHintText = hnt;
    this.slottedErrorText = err;
  }

  private reconcileItems(): void {
    const next: Array<ToggleGroupOption> = [];
    if (this.options !== null) {
      for (const opt of this.options) {
        next.push(opt);
      }
    } else {
      let idx = 0;
      for (const child of Array.from(this.children ?? [])) {
        if (!(child instanceof HTMLElement)) continue;
        if (child.hasAttribute('slot')) continue;
        const val =
          child.getAttribute('value') ??
          child.getAttribute('data-value') ??
          child.textContent?.trim() ??
          `item-${idx}`;
        const lbl =
          child.getAttribute('label') ?? child.textContent?.trim() ?? val;
        const dis = child.hasAttribute('disabled');
        next.push({ value: val, label: lbl, ...(dis ? { disabled: true } : {}) });
        idx += 1;
      }
    }
    this.resolvedItems = next;
    this.selectionCtrl.setItems(next);
    void this.slotCtrl;
  }

  private applyValueToSelection(rawValue: string): void {
    const parsed = this.multiple
      ? rawValue
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      : rawValue.length > 0
        ? [rawValue]
        : [];
    this.syncingFromSelection = true;
    this.selectionCtrl.setSelection(parsed);
    this.selectedValues = parsed;
    this.syncingFromSelection = false;
  }

  private readonly handleItemClick = (item: ToggleGroupOption, index: number): void => {
    if (this.isEffectivelyDisabled || item.disabled) return;
    this.rovingCtrl.setActiveIndex(index, true);
    this.formCtrl.markTouched();
    this.selectionCtrl.select(item.value, { toggle: true });
  };

  override render() {
    const ctx = this.formCtrl.fieldContext;
    const effLabel = this.label || this.slottedLabelText || ctx?.label || '';
    const effHint = this.hint || this.slottedHintText || ctx?.hint || '';
    const rawError = this.error || this.slottedErrorText || ctx?.error || '';
    const validationMsg =
      rawError || (this.hasCustomState('user-invalid') ? this.formCtrl.validationMessage : '');
    const effDisabled = this.isEffectivelyDisabled;

    const describedBy: string[] = [];
    if (effHint) describedBy.push('mth-tg-hint');
    if (validationMsg) describedBy.push('mth-tg-error');

    return html`
      <div part="base" @focusout=${() => this.formCtrl.markTouched()}>
        ${effLabel
          ? html`<div id="mth-tg-label" part="label">${effLabel}</div>`
          : nothing}
        <div
          id="mth-tg-group"
          part="group"
          role="group"
          aria-labelledby=${ifDefined(effLabel ? 'mth-tg-label' : undefined)}
          aria-label=${ifDefined(effLabel ? undefined : this.t('groupLabel'))}
          aria-describedby=${ifDefined(describedBy.length > 0 ? describedBy.join(' ') : undefined)}
          aria-disabled=${effDisabled ? 'true' : 'false'}
        >
          ${this.resolvedItems.map((item, idx) => {
            const pressed = this.selectedValues.includes(item.value);
            const itemDisabled = effDisabled || Boolean(item.disabled);
            return html`
              <button
                type="button"
                part="item"
                aria-pressed=${pressed ? 'true' : 'false'}
                ?disabled=${itemDisabled}
                @click=${() => this.handleItemClick(item, idx)}
              >
                ${item.label}
              </button>
            `;
          })}
        </div>
        ${effHint ? html`<p id="mth-tg-hint" part="hint">${effHint}</p>` : nothing}
        ${validationMsg
          ? html`<p id="mth-tg-error" part="error" role="alert">${validationMsg}</p>`
          : nothing}
        <div class="sr-hidden" aria-hidden="true">
          <slot @slotchange=${() => {
            this.syncSlotTexts();
            if (this.options === null) this.reconcileItems();
          }}></slot>
          <slot name="label" @slotchange=${() => this.syncSlotTexts()}></slot>
          <slot name="hint" @slotchange=${() => this.syncSlotTexts()}></slot>
          <slot name="error" @slotchange=${() => this.syncSlotTexts()}></slot>
        </div>
      </div>
    `;
  }
}
