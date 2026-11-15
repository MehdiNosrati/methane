import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  FormControlController,
  RovingFocusController,
  SelectionController,
  SlotCollectionController,
  type RovingOrientation,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { radioGroupMessages } from './radio-group.messages.js';
import { radioGroupStyles } from './radio-group.styles.js';

type RadioLikeElement = HTMLElement & {
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  groupDisabled?: boolean;
};

function isRadioElement(el: Element): el is RadioLikeElement {
  return (
    el instanceof HTMLElement &&
    (el.localName === 'mth-radio' ||
      el.localName.endsWith('-radio') ||
      el.getAttribute('role') === 'radio')
  );
}

function getRadioValue(el: RadioLikeElement): string {
  if (typeof el.value === 'string' && el.value.length > 0) return el.value;
  return el.getAttribute('value') ?? '';
}

function isRadioOwnDisabled(el: RadioLikeElement): boolean {
  return el.hasAttribute('disabled') || Boolean(el.disabled);
}

/**
 * `<mth-radio-group>`: form-associated radio group coordinating slotted `<mth-radio>`
 * children via public DOM attributes/properties, `RovingFocusController`,
 * `SelectionController`, `SlotCollectionController`, `FormControlController`, and `FieldContext`.
 */
export class MthRadioGroup extends UIElement {
  static formAssociated = true;
  static override messages = radioGroupMessages;
  static override styles = radioGroupStyles;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: String, reflect: true })
  orientation: Exclude<RovingOrientation, 'both'> = 'vertical';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  private readonly formCtrl: FormControlController;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly slotCtrl: SlotCollectionController<RadioLikeElement>;
  private readonly rovingCtrl: RovingFocusController;

  private isProgrammaticRoving = false;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: radioGroupMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.syncSelectionFromValue(nextValue);
      },
      onDisabledChange: () => {
        this.syncRadios();
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: () => {
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        return null;
      },
    });

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'single',
      allowEmpty: true,
    });

    this.slotCtrl = new SlotCollectionController<RadioLikeElement>(this, {
      filter: isRadioElement,
      attributeFilter: ['value', 'disabled'],
      onItemsChange: () => {
        this.syncRadios();
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.getRadioElements(),
      orientation: this.orientation,
      loop: true,
      dir: 'auto',
      onActiveChange: (item) => {
        if (this.isProgrammaticRoving || !item || this.formCtrl.disabled) return;
        const radio = item as RadioLikeElement;
        if (isRadioOwnDisabled(radio)) return;
        const nextVal = getRadioValue(radio);
        if (nextVal !== this.value) {
          this.commitUserSelection(nextVal);
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
    return this.internals?.form ?? this.closest('form');
  }

  get dirty(): boolean {
    return this.formCtrl.dirty;
  }

  get touched(): boolean {
    return this.formCtrl.touched;
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  override focus(options?: FocusOptions): void {
    const target =
      this.rovingCtrl.currentItem ??
      this.getRadioElements().find((el) => !isRadioOwnDisabled(el)) ??
      null;
    target?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('mth-radio-select', this.handleRadioSelect as EventListener);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('mth-radio-select', this.handleRadioSelect as EventListener);
    super.disconnectedCallback();
  }

  protected override onFirstConnect(): void {
    const initialDefault = this.getAttribute('value') ?? this.value ?? '';
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
    this.syncRadios();
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.syncRadios();
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
  }

  protected override onFormStateRestore(
    stateValue: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(stateValue, mode);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changedProperties.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changedProperties.has('orientation')) {
      this.rovingCtrl.updateOptions({ orientation: this.orientation });
    }
    if (changedProperties.has('value')) {
      if (this.formCtrl.value !== this.value) {
        this.formCtrl.setValue(this.value, { markDirty: false });
      }
      this.syncSelectionFromValue(this.value);
    }
    if (changedProperties.has('error')) {
      this.formCtrl.validate();
    }
    if (changedProperties.has('value') || changedProperties.has('disabled')) {
      this.syncRadios();
    }

    this.setCustomState('required', this.formCtrl.required);
  }

  private getRadioElements(): ReadonlyArray<RadioLikeElement> {
    return this.slotCtrl.slottedElements.length > 0
      ? this.slotCtrl.slottedElements
      : Array.from(this.children ?? []).filter(isRadioElement);
  }

  private syncSelectionFromValue(nextValue: string): void {
    if (nextValue.length > 0) {
      this.selectionCtrl.setSelection([nextValue]);
    } else {
      this.selectionCtrl.clear();
    }
    this.syncRadios();
  }

  private syncRadios(): void {
    const radios = this.getRadioElements();
    const isGroupDisabled = this.formCtrl.disabled;

    this.selectionCtrl.setItems(
      radios.map((radio) => ({
        value: getRadioValue(radio),
        disabled: isGroupDisabled || isRadioOwnDisabled(radio),
      })),
    );

    let selectedIndex = -1;
    radios.forEach((radio, idx) => {
      const val = getRadioValue(radio);
      const isChecked = this.value.length > 0 && val === this.value;
      if (isChecked) {
        selectedIndex = idx;
      }
      if (radio.checked !== isChecked) {
        radio.checked = isChecked;
      }
      if ('groupDisabled' in radio && radio.groupDisabled !== isGroupDisabled) {
        radio.groupDisabled = isGroupDisabled;
      }
    });

    if (selectedIndex >= 0 && this.rovingCtrl.currentIndex !== selectedIndex) {
      this.isProgrammaticRoving = true;
      this.rovingCtrl.setActiveIndex(selectedIndex, false);
      this.isProgrammaticRoving = false;
    } else {
      this.rovingCtrl.syncTabIndices();
    }
  }

  private commitUserSelection(nextValue: string): void {
    if (this.formCtrl.disabled) return;
    this.value = nextValue;
    this.selectionCtrl.select(nextValue);
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.formCtrl.markTouched();
    this.syncRadios();
    this.emitEvent('mth-change', { detail: { value: nextValue } });
  }

  private readonly handleRadioSelect = (event: CustomEvent<{ value: string }>): void => {
    if (this.formCtrl.disabled) return;
    const target = event.target;
    const radios = this.getRadioElements();
    const idx = radios.findIndex((r) => r === target);
    if (idx === -1) return;

    event.stopPropagation();
    const radio = radios[idx]!;
    if (isRadioOwnDisabled(radio)) return;

    this.isProgrammaticRoving = true;
    this.rovingCtrl.setActiveIndex(idx, true);
    this.isProgrammaticRoving = false;

    const val = event.detail?.value ?? getRadioValue(radio);
    this.commitUserSelection(val);
  };

  private handleTextSlotChange(slotName: 'label' | 'hint' | 'error', event: Event): void {
    const slot = event.target as HTMLSlotElement;
    const text = slot
      .assignedNodes({ flatten: true })
      .map((node) => node.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (slotName === 'label') {
      this.slottedLabelText = text;
    } else if (slotName === 'hint') {
      this.slottedHintText = text;
    } else {
      this.slottedErrorText = text;
    }
  }

  override render() {
    const ctx = this.formCtrl.fieldContext;
    const hasFieldContext = Boolean(ctx);
    const effectiveLabel = this.slottedLabelText || this.label || ctx?.label || '';
    const effectiveHint = this.slottedHintText || this.hint || ctx?.hint || '';
    const explicitError = this.slottedErrorText || this.error || ctx?.error || '';
    const validityError = this.formCtrl.userInvalid ? this.formCtrl.validationMessage : '';
    const effectiveError = explicitError || validityError;

    const hasLabel = effectiveLabel.length > 0;
    const hasHint = effectiveHint.length > 0;
    const hasError = effectiveError.length > 0;
    const isRequired = this.formCtrl.required;
    const isDisabled = this.formCtrl.disabled;
    const isInvalid = this.formCtrl.userInvalid || explicitError.length > 0;

    return html`
      <div part="base" class="base">
        <div
          id="mth-rg-label"
          part="label"
          class=${hasFieldContext ? 'label sr-only' : 'label'}
          ?hidden=${!hasLabel}
        >
          <slot
            name="label"
            @slotchange=${(ev: Event) => this.handleTextSlotChange('label', ev)}
          >${effectiveLabel}</slot>
          ${isRequired && !hasFieldContext
            ? html`<span class="required-mark" aria-hidden="true">${this.t('requiredIndicator')}</span>`
            : nothing}
        </div>
        <div
          part="group"
          class="group"
          role="radiogroup"
          data-orientation=${this.orientation}
          aria-labelledby=${hasLabel ? 'mth-rg-label' : nothing}
          aria-label=${!hasLabel ? this.t('radioGroupLabel') : nothing}
          aria-describedby=${hasHint && !hasError ? 'mth-rg-hint' : nothing}
          aria-errormessage=${isInvalid && hasError ? 'mth-rg-error' : nothing}
          aria-required=${isRequired ? 'true' : nothing}
          aria-invalid=${isInvalid ? 'true' : 'false'}
          aria-disabled=${isDisabled ? 'true' : nothing}
        >
          <slot></slot>
        </div>
        <p
          id="mth-rg-hint"
          part="hint"
          class=${hasFieldContext ? 'hint sr-only' : 'hint'}
          ?hidden=${!hasHint || hasError}
        >
          <slot
            name="hint"
            @slotchange=${(ev: Event) => this.handleTextSlotChange('hint', ev)}
          >${effectiveHint}</slot>
        </p>
        <p
          id="mth-rg-error"
          part="error"
          class=${hasFieldContext ? 'error sr-only' : 'error'}
          role=${hasError ? 'alert' : nothing}
          ?hidden=${!hasError}
        >
          <slot
            name="error"
            @slotchange=${(ev: Event) => this.handleTextSlotChange('error', ev)}
          >${effectiveError}</slot>
        </p>
      </div>
    `;
  }
}
