import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { UIElement } from '@methane/core';
import {
  FormControlController,
  ListboxController,
  OverlayController,
  PositioningController,
  SlotCollectionController,
  type ListboxOptionItem,
  type OverlayCloseReason,
  type Placement,
  type PositioningResult,
} from '@methane/primitives';
import { selectMessages } from './select.messages.js';
import { selectStyles } from './select.styles.js';

export interface SelectOption {
  readonly id?: string;
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly group?: string;
}

interface ResolvedSelectOption {
  readonly id: string;
  readonly value: string;
  readonly label: string;
  readonly disabled: boolean;
  readonly group?: string;
  readonly lightElement?: HTMLElement;
}

export function supportsCustomizableSelect(): boolean {
  return (
    typeof globalThis.CSS !== 'undefined' &&
    typeof globalThis.CSS.supports === 'function' &&
    globalThis.CSS.supports('appearance', 'base-select') &&
    typeof globalThis.HTMLSelectElement !== 'undefined' &&
    typeof globalThis.HTMLSelectElement.prototype.showPicker === 'function'
  );
}

/**
 * Form-associated select control with progressive customizable `appearance: base-select`
 * detection and `[popover]` + positioned shadow listbox fallback.
 */
export class MthSelect extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override styles = [selectStyles];
  static override messages = selectMessages;

  @property({ type: String })
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

  @property({ type: String })
  placeholder = '';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  multiple = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean })
  clearable = false;

  @property({ type: String })
  placement: Placement = 'bottom-start';

  @property({ type: Boolean, attribute: 'force-fallback' })
  forceFallback = false;

  @property({ attribute: false })
  options: ReadonlyArray<SelectOption> | null = null;

  @state()
  private selectedValues: ReadonlyArray<string> = [];

  @state()
  private activeOptionId = '';

  @state()
  private resolvedOptions: ReadonlyArray<ResolvedSelectOption> = [];

  @query('#mth-select-control')
  private controlEl!: HTMLElement | null;

  @query('#mth-select-trigger')
  private triggerEl!: HTMLButtonElement | null;

  @query('#mth-select-native')
  private nativeSelectEl!: HTMLSelectElement | null;

  @query('#mth-select-popup')
  private popupEl!: HTMLElement | null;

  @query('#mth-select-listbox')
  private listboxEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly listboxCtrl: ListboxController;
  readonly slotCtrl: SlotCollectionController<HTMLElement, SelectOption>;
  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;

  private syncingOpenFromOverlay = false;
  private isHydratingSync = false;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: selectMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.syncSelectedFromValue(nextValue);
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: () => {
        const ctxError = this.error || this.formCtrl.fieldContext?.error || '';
        if (ctxError.length > 0) {
          return { flags: { customError: true }, message: ctxError };
        }
        return null;
      },
    });

    this.listboxCtrl = new ListboxController(this, {
      focusMode: 'activedescendant',
      getListboxElement: () => this.listboxEl,
      getOptionElements: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
      onActiveChange: (opt) => {
        this.activeOptionId = opt?.id ?? '';
        this.syncLightOptionStates();
      },
      onSelectionChange: (values) => {
        this.handleListboxSelection(values);
      },
    });

    this.slotCtrl = new SlotCollectionController<HTMLElement, SelectOption>(this, {
      observeSubtree: true,
      attributeFilter: ['value', 'label', 'disabled'],
      onItemsChange: () => {
        if (this.options === null) {
          this.reconcileOptions();
        }
      },
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.popupEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingOpenFromOverlay = true;
        this.open = nextOpen;
        this.syncingOpenFromOverlay = false;
        this.setCustomState('open', nextOpen);
        if (!nextOpen) {
          this.positioningCtrl.stop();
        }
        this.requestUpdate();
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.controlEl ?? this,
      floating: () => this.popupEl,
      placement: this.placement,
      offset: 4,
      flip: true,
      shift: true,
      forceFallback: this.forceFallback,
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

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.formCtrl.disabled;
  }

  get isEffectivelyReadOnly(): boolean {
    return this.readonly || this.formCtrl.readOnly;
  }

  get isUsingNativeBaseSelect(): boolean {
    return !this.forceFallback && supportsCustomizableSelect();
  }

  get renderMode(): 'base-select' | 'fallback' {
    return this.isUsingNativeBaseSelect ? 'base-select' : 'fallback';
  }

  get lastPositioningResult(): PositioningResult | null {
    return this.positioningCtrl.lastResult;
  }

  get isUsingNativeTopLayer(): boolean {
    return this.overlayCtrl.isUsingNativeTopLayer;
  }

  override focus(options?: FocusOptions): void {
    if (this.isUsingNativeBaseSelect) {
      this.nativeSelectEl?.focus(options);
      return;
    }
    this.triggerEl?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  async show(): Promise<boolean> {
    if (this.isEffectivelyDisabled || this.isEffectivelyReadOnly) return false;

    if (this.isUsingNativeBaseSelect && this.nativeSelectEl) {
      const pickerEl = this.nativeSelectEl as HTMLSelectElement & { showPicker?: () => void };
      try {
        pickerEl.showPicker?.();
      } catch {
        // showPicker may require transient user activation in browsers.
      }
      return true;
    }

    await this.updateComplete;
    this.reconcileOptions();
    const opened = await this.overlayCtrl.show();
    if (opened) {
      this.syncingOpenFromOverlay = true;
      this.open = true;
      this.syncingOpenFromOverlay = false;
      this.activateInitialOption();
      this.positioningCtrl.updateOptions({
        placement: this.placement,
        forceFallback: this.forceFallback,
      });
      await this.positioningCtrl.start();
    }
    return opened;
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    if (this.isUsingNativeBaseSelect) {
      return true;
    }
    const closed = await this.overlayCtrl.hide(reason);
    if (closed) {
      this.syncingOpenFromOverlay = true;
      this.open = false;
      this.syncingOpenFromOverlay = false;
      this.positioningCtrl.stop();
    }
    return closed;
  }

  selectValue(value: string): void {
    if (this.isEffectivelyDisabled || this.isEffectivelyReadOnly) return;
    const match = this.resolvedOptions.find((o) => o.value === value && !o.disabled);
    if (!match) return;

    const nextSelected = this.computeNextSelectedValues(value);
    this.applySelection(nextSelected, { emitChange: true, closeSingle: true });
  }

  clear(): void {
    if (this.isEffectivelyDisabled || this.isEffectivelyReadOnly) return;
    this.selectedValues = [];
    this.value = '';
    this.activeOptionId = '';
    this.listboxCtrl.setSelectedValues([]);
    this.syncLightOptionStates();
    this.formCtrl.setValue('', { markDirty: true });
    this.emitEvent('mth-clear');
    this.emitEvent('mth-change', {
      detail: { value: '', selectedValues: [] },
    });
  }

  protected override onFirstConnect(): void {
    this.isHydratingSync = true;
    const initialDefault = this.defaultValue || this.getAttribute('value') || this.value || '';
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
    this.syncSelectedFromValue(this.value);
    this.reconcileOptions();
    this.isHydratingSync = false;
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
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

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changedProperties.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changedProperties.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
    }
    if (changedProperties.has('defaultValue')) {
      this.formCtrl.setDefaultValue(this.defaultValue);
    }
    if (
      changedProperties.has('defaultValue') ||
      changedProperties.has('required') ||
      changedProperties.has('disabled') ||
      changedProperties.has('readonly') ||
      changedProperties.has('error')
    ) {
      this.formCtrl.validate();
    }

    this.setCustomState('required', this.formCtrl.required);
    this.setCustomState('readonly', this.formCtrl.readOnly);

    if (changedProperties.has('value') && !this.isHydratingSync) {
      this.formCtrl.setValue(this.value, { markDirty: false });
      this.syncSelectedFromValue(this.value);
    }

    if (changedProperties.has('options') && !this.isHydratingSync) {
      this.reconcileOptions();
    }

    if (changedProperties.has('forceFallback') || changedProperties.has('placement')) {
      this.overlayCtrl.updateOptions({
        forceFallback: this.forceFallback,
      });
      this.positioningCtrl.updateOptions({
        placement: this.placement,
        forceFallback: this.forceFallback,
      });
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (
      changedProperties.has('open') &&
      !this.syncingOpenFromOverlay &&
      !this.isHydratingSync &&
      !this.isUsingNativeBaseSelect
    ) {
      if (this.open) {
        void this.show();
      } else {
        void this.hide('programmatic');
      }
    }
  }

  private computeNextSelectedValues(value: string): Array<string> {
    if (!this.multiple) {
      return [value];
    }
    return this.selectedValues.includes(value)
      ? this.selectedValues.filter((v) => v !== value)
      : [...this.selectedValues, value];
  }

  private syncSelectedFromValue(rawValue: string): void {
    if (this.multiple) {
      this.selectedValues = rawValue
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    } else {
      this.selectedValues = rawValue.length > 0 ? [rawValue] : [];
    }
    this.listboxCtrl.setSelectedValues(this.selectedValues);
    this.syncLightOptionStates();
  }

  private collectLightDomOptions(): Array<ResolvedSelectOption> {
    const collected: Array<ResolvedSelectOption> = [];
    let index = 0;

    const pushOptionEl = (optEl: HTMLElement, groupName?: string, groupDisabled = false) => {
      const valueAttr = optEl.getAttribute('value');
      const propValue = (optEl as unknown as { value?: string }).value;
      const value =
        typeof propValue === 'string' && propValue.length > 0 ? propValue : (valueAttr ?? '');
      const explicitLabel =
        optEl.getAttribute('label') ?? (optEl as unknown as { label?: string }).label ?? '';
      const resolvedLabel =
        explicitLabel.trim().length > 0
          ? explicitLabel.trim()
          : (optEl.textContent?.trim() ?? value);
      const optDisabled =
        groupDisabled ||
        optEl.hasAttribute('disabled') ||
        Boolean((optEl as unknown as { disabled?: boolean }).disabled);

      const finalValue = value || resolvedLabel || `opt-${index}`;
      collected.push({
        id: optEl.id || `mth-select-opt-${index++}`,
        value: finalValue,
        label: resolvedLabel || finalValue,
        disabled: optDisabled,
        ...(groupName !== undefined ? { group: groupName } : {}),
        lightElement: optEl,
      });
    };

    for (const child of Array.from(this.children ?? [])) {
      if (!(child instanceof HTMLElement)) continue;
      const tag = child.tagName.toLowerCase();
      if (tag === 'mth-option') {
        pushOptionEl(child);
      } else if (tag === 'mth-option-group') {
        const groupLabel =
          child.getAttribute('label') ?? (child as unknown as { label?: string }).label ?? '';
        const groupDisabled =
          child.hasAttribute('disabled') ||
          Boolean((child as unknown as { disabled?: boolean }).disabled);
        for (const nested of Array.from(child.children ?? [])) {
          if (nested instanceof HTMLElement && nested.tagName.toLowerCase() === 'mth-option') {
            pushOptionEl(nested, groupLabel, groupDisabled);
          }
        }
      }
    }

    return collected;
  }

  private reconcileOptions(): void {
    const sourceList: Array<ResolvedSelectOption> =
      this.options !== null
        ? this.options.map((raw, idx) => {
            const value = String(raw.value ?? raw.id ?? raw.label ?? idx);
            const label = String(raw.label ?? raw.value ?? raw.id ?? value);
            return {
              id: raw.id ? `mth-select-opt-${raw.id}` : `mth-select-opt-${idx}`,
              value,
              label,
              disabled: Boolean(raw.disabled),
              ...(raw.group !== undefined ? { group: raw.group } : {}),
            };
          })
        : this.collectLightDomOptions();

    // Group ungrouped items before named groups to match option-group layout consistently.
    const ungrouped: Array<ResolvedSelectOption> = [];
    const groupedMap = new Map<string, Array<ResolvedSelectOption>>();
    for (const item of sourceList) {
      if (item.group) {
        const list = groupedMap.get(item.group) ?? [];
        list.push(item);
        groupedMap.set(item.group, list);
      } else {
        ungrouped.push(item);
      }
    }
    const ordered = [...ungrouped, ...Array.from(groupedMap.values()).flat()];

    this.resolvedOptions = ordered;
    const listboxItems: Array<ListboxOptionItem> = ordered.map((opt) => ({
      id: opt.id,
      value: opt.value,
      label: opt.label,
      disabled: opt.disabled,
      ...(opt.group !== undefined ? { group: opt.group } : {}),
    }));
    this.listboxCtrl.setOptions(listboxItems);
    this.listboxCtrl.setSelectedValues(this.selectedValues);
    this.syncLightOptionStates();
  }

  private syncLightOptionStates(): void {
    const selectedSet = new Set(this.selectedValues);
    for (const opt of this.resolvedOptions) {
      if (!opt.lightElement) continue;
      const target = opt.lightElement as HTMLElement & {
        selected?: boolean;
        active?: boolean;
      };
      const nextSelected = selectedSet.has(opt.value);
      const nextActive = opt.id === this.activeOptionId;
      if ('selected' in target) {
        target.selected = nextSelected;
      }
      if ('active' in target) {
        target.active = nextActive;
      }
    }
  }

  private activateInitialOption(): void {
    if (this.resolvedOptions.length === 0) return;
    if (this.selectedValues.length > 0) {
      const selectedIdx = this.resolvedOptions.findIndex(
        (opt) => !opt.disabled && this.selectedValues.includes(opt.value),
      );
      if (selectedIdx >= 0) {
        this.listboxCtrl.setActiveIndex(selectedIdx);
        return;
      }
    }
    const firstEnabled = this.resolvedOptions.findIndex((opt) => !opt.disabled);
    if (firstEnabled >= 0) {
      this.listboxCtrl.setActiveIndex(firstEnabled);
    }
  }

  private applySelection(
    nextSelected: ReadonlyArray<string>,
    options: { emitChange: boolean; closeSingle: boolean },
  ): void {
    this.selectedValues = [...nextSelected];
    this.value = this.multiple ? nextSelected.join(',') : (nextSelected[0] ?? '');
    this.listboxCtrl.setSelectedValues(this.selectedValues);
    this.syncLightOptionStates();
    this.formCtrl.setValue(this.value, { markDirty: true });

    if (options.emitChange) {
      this.emitEvent('mth-change', {
        detail: { value: this.value, selectedValues: this.selectedValues },
      });
    }

    if (options.closeSingle && !this.multiple && this.open) {
      void this.hide('programmatic');
    }
  }

  private handleListboxSelection(values: ReadonlyArray<string>): void {
    if (this.isEffectivelyDisabled || this.isEffectivelyReadOnly) return;
    const latest = values[values.length - 1];
    if (!this.multiple) {
      const next = latest !== undefined ? [latest] : [];
      this.applySelection(next, { emitChange: true, closeSingle: true });
      return;
    }

    const validSet = new Set(this.resolvedOptions.filter((o) => !o.disabled).map((o) => o.value));
    const filtered = values.filter((v) => validSet.has(v));
    this.applySelection(filtered, { emitChange: true, closeSingle: false });
  }

  private handleTriggerClick(): void {
    if (this.isEffectivelyDisabled || this.isEffectivelyReadOnly) return;
    if (this.open) {
      void this.hide('invoker');
    } else {
      void this.show();
    }
  }

  private handleTriggerBlur(): void {
    this.formCtrl.markTouched();
  }

  private handleTriggerKeyDown(event: KeyboardEvent): void {
    if (this.isEffectivelyDisabled || this.isEffectivelyReadOnly) return;

    if (!this.open) {
      if (
        event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp'
      ) {
        event.preventDefault();
        void this.show();
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      void this.hide('escape');
      return;
    }

    if (event.key === 'Tab') {
      void this.hide('programmatic');
      return;
    }

    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      this.forwardListboxKeyDown(event);
    }
  }

  private forwardListboxKeyDown(sourceEvent: KeyboardEvent): void {
    if (!this.listboxEl) return;
    this.listboxEl.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: sourceEvent.key,
        bubbles: false,
        cancelable: true,
      }),
    );
  }

  private handleNativeSelectChange(event: Event): void {
    if (this.isEffectivelyDisabled || this.isEffectivelyReadOnly) return;
    const selectEl = event.currentTarget as HTMLSelectElement;
    const nextSelected = this.multiple
      ? Array.from(selectEl.selectedOptions).map((opt) => opt.value)
      : selectEl.value
        ? [selectEl.value]
        : [];
    this.applySelection(nextSelected, { emitChange: true, closeSingle: false });
  }

  private handleOptionClick(opt: ResolvedSelectOption): void {
    if (opt.disabled || this.isEffectivelyDisabled || this.isEffectivelyReadOnly) return;
    const idx = this.resolvedOptions.findIndex((item) => item.id === opt.id);
    if (idx >= 0) {
      this.listboxCtrl.setActiveIndex(idx);
    }
    this.selectValue(opt.value);
  }

  private getDisplaySummary(): { text: string; isPlaceholder: boolean } {
    const placeholderText = this.placeholder || this.t('placeholder');
    if (this.selectedValues.length === 0) {
      return { text: placeholderText, isPlaceholder: true };
    }
    if (!this.multiple) {
      const selectedValue = this.selectedValues[0] ?? '';
      const match = this.resolvedOptions.find((opt) => opt.value === selectedValue);
      return { text: match?.label ?? selectedValue, isPlaceholder: false };
    }
    const labels = this.selectedValues.map(
      (val) => this.resolvedOptions.find((opt) => opt.value === val)?.label ?? val,
    );
    return { text: labels.join(', '), isPlaceholder: false };
  }

  private renderOptionList(): Array<TemplateResult> {
    const selectedSet = new Set(this.selectedValues);
    const ungrouped = this.resolvedOptions.filter((o) => !o.group);
    const groups = new Map<string, Array<ResolvedSelectOption>>();
    for (const opt of this.resolvedOptions) {
      if (opt.group) {
        const list = groups.get(opt.group) ?? [];
        list.push(opt);
        groups.set(opt.group, list);
      }
    }

    const renderOpt = (opt: ResolvedSelectOption): TemplateResult => {
      const isSelected = selectedSet.has(opt.value);
      const isActive = opt.id === this.activeOptionId;
      return html`
        <div
          id=${opt.id}
          part="option"
          role="option"
          data-value=${opt.value}
          data-active=${isActive ? 'true' : nothing}
          aria-selected=${isSelected ? 'true' : 'false'}
          aria-disabled=${opt.disabled ? 'true' : nothing}
          @click=${() => this.handleOptionClick(opt)}
        >
          <span>${opt.label}</span>
          ${isSelected ? html`<span aria-hidden="true">✓</span>` : nothing}
        </div>
      `;
    };

    const output: Array<TemplateResult> = [];
    for (const opt of ungrouped) {
      output.push(renderOpt(opt));
    }

    let groupIndex = 0;
    for (const [groupName, items] of groups.entries()) {
      const groupLabelId = `mth-select-group-${groupIndex++}`;
      output.push(html`
        <div role="group" aria-labelledby=${groupLabelId}>
          <div id=${groupLabelId} part="group-label">${groupName}</div>
          ${items.map((opt) => renderOpt(opt))}
        </div>
      `);
    }

    return output;
  }

  private renderNativeSelectOptions(): Array<TemplateResult> {
    const selectedSet = new Set(this.selectedValues);
    const ungrouped = this.resolvedOptions.filter((o) => !o.group);
    const groups = new Map<string, Array<ResolvedSelectOption>>();
    for (const opt of this.resolvedOptions) {
      if (opt.group) {
        const list = groups.get(opt.group) ?? [];
        list.push(opt);
        groups.set(opt.group, list);
      }
    }

    const renderOpt = (opt: ResolvedSelectOption): TemplateResult => html`
      <option
        value=${opt.value}
        ?selected=${selectedSet.has(opt.value)}
        ?disabled=${opt.disabled}
      >
        ${opt.label}
      </option>
    `;

    const output: Array<TemplateResult> = [];
    const placeholderText = this.placeholder || this.t('placeholder');
    if (!this.multiple) {
      output.push(html`
        <option value="" ?selected=${selectedSet.size === 0}>${placeholderText}</option>
      `);
    }

    for (const opt of ungrouped) {
      output.push(renderOpt(opt));
    }
    for (const [groupName, items] of groups.entries()) {
      output.push(html`
        <optgroup label=${groupName}>
          ${items.map((opt) => renderOpt(opt))}
        </optgroup>
      `);
    }
    return output;
  }

  protected override render() {
    const ctx = this.formCtrl.fieldContext;
    const hasFieldContext = Boolean(ctx);
    const resolvedLabel = this.label || ctx?.label || '';
    const resolvedHint = this.hint || ctx?.hint || '';
    const resolvedError = this.error || ctx?.error || '';
    const isInvalid = Boolean(resolvedError) || Boolean(ctx?.invalid) || this.formCtrl.invalid;
    const isDisabled = this.isEffectivelyDisabled;
    const isReadOnly = this.isEffectivelyReadOnly;
    const isRequired = this.required || Boolean(ctx?.required);

    const describedByParts: Array<string> = [];
    if (resolvedHint) describedByParts.push('mth-select-hint');
    const describedBy = describedByParts.length > 0 ? describedByParts.join(' ') : nothing;
    const errorMessageId = resolvedError ? 'mth-select-error' : nothing;

    const showClear =
      this.clearable && !isDisabled && !isReadOnly && this.selectedValues.length > 0;
    const display = this.getDisplaySummary();
    const useBaseSelect = this.isUsingNativeBaseSelect;

    return html`
      ${resolvedLabel
        ? html`
            <label
              id="mth-select-label"
              part="label"
              class=${hasFieldContext ? 'sr-only' : ''}
              for=${useBaseSelect ? 'mth-select-native' : 'mth-select-trigger'}
            >
              ${resolvedLabel}
            </label>
          `
        : nothing}

      <div id="mth-select-control" part="control">
        <slot name="prefix"></slot>

        ${useBaseSelect
          ? html`
              <select
                id="mth-select-native"
                part="native-select"
                ?multiple=${this.multiple}
                ?disabled=${isDisabled}
                ?required=${isRequired}
                aria-labelledby=${resolvedLabel ? 'mth-select-label' : nothing}
                aria-describedby=${describedBy}
                aria-invalid=${isInvalid ? 'true' : nothing}
                aria-errormessage=${errorMessageId}
                @change=${this.handleNativeSelectChange}
                @blur=${this.handleTriggerBlur}
              >
                ${this.renderNativeSelectOptions()}
              </select>
            `
          : html`
              <button
                id="mth-select-trigger"
                part="trigger"
                type="button"
                role="combobox"
                ?disabled=${isDisabled}
                aria-haspopup="listbox"
                aria-expanded=${this.open ? 'true' : 'false'}
                aria-controls="mth-select-listbox"
                aria-labelledby=${resolvedLabel ? 'mth-select-label' : nothing}
                aria-describedby=${describedBy}
                aria-required=${isRequired ? 'true' : nothing}
                aria-readonly=${isReadOnly ? 'true' : nothing}
                aria-invalid=${isInvalid ? 'true' : nothing}
                aria-errormessage=${errorMessageId}
                @click=${this.handleTriggerClick}
                @keydown=${this.handleTriggerKeyDown}
                @blur=${this.handleTriggerBlur}
              >
                <span part="value" data-placeholder=${display.isPlaceholder ? 'true' : 'false'}>
                  ${display.text}
                </span>
                <span part="caret" aria-hidden="true">▾</span>
              </button>
            `}

        ${showClear
          ? html`
              <button
                part="clear-button"
                type="button"
                aria-label=${this.t('clearSelection')}
                @click=${() => this.clear()}
              >
                ×
              </button>
            `
          : nothing}
      </div>

      ${useBaseSelect
        ? nothing
        : html`
            <div id="mth-select-popup" part="popup" popover="manual" ?hidden=${!this.open}>
              <div
                id="mth-select-listbox"
                part="listbox"
                role="listbox"
                tabindex="-1"
                aria-labelledby=${resolvedLabel ? 'mth-select-label' : nothing}
                aria-multiselectable=${this.multiple ? 'true' : nothing}
                aria-activedescendant=${this.activeOptionId || nothing}
              >
                ${this.resolvedOptions.length === 0
                  ? html`
                      <div part="empty">
                        <slot name="empty">${this.t('empty')}</slot>
                      </div>
                    `
                  : this.renderOptionList()}
              </div>
            </div>
          `}

      <div class="slot-source" aria-hidden="true">
        <slot></slot>
      </div>

      ${resolvedHint
        ? html`
            <div id="mth-select-hint" part="hint" class=${hasFieldContext ? 'sr-only' : ''}>
              ${resolvedHint}
            </div>
          `
        : nothing}
      ${resolvedError
        ? html`
            <div
              id="mth-select-error"
              part="error"
              role="alert"
              class=${hasFieldContext ? 'sr-only' : ''}
            >
              ${resolvedError}
            </div>
          `
        : nothing}
    `;
  }
}
