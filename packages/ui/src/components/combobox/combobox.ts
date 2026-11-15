import { UIElement, type PropertyValues } from '@methane/core';
import {
  DataController,
  FormControlController,
  InputController,
  ListboxController,
  OverlayController,
  PositioningController,
  SlotCollectionController,
  type DataControllerStatus,
  type DataSource,
  type ListboxOptionItem,
  type OverlayCloseReason,
  type Placement,
  type PositioningResult,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { comboboxMessages } from './combobox.messages.js';
import { comboboxStyles } from './combobox.styles.js';

export interface ComboboxOption {
  readonly id?: string;
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly group?: string;
}

interface ResolvedComboboxOption extends ComboboxOption {
  readonly id: string;
  readonly disabled: boolean;
  readonly lightElement?: HTMLElement;
}

/**
 * `<mth-combobox>`: form-associated accessible combobox reconciling declarative
 * `<mth-option>`/`<mth-option-group>` children, imperative `.options` arrays,
 * and async `DataSource<T>` queries with same-root shadow ARIA and dual CSS Anchor / JS positioning.
 */
export class MthCombobox extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = comboboxMessages;
  static override styles = comboboxStyles;

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

  @property({ type: Boolean, reflect: true })
  clearable = false;

  @property({ type: Boolean })
  filterable = true;

  @property({ type: String, reflect: true })
  placement: Placement = 'bottom-start';

  @property({ type: Boolean, attribute: 'force-fallback' })
  forceFallback = false;

  @property({ attribute: false })
  options: ReadonlyArray<ComboboxOption> | null = null;

  @property({ attribute: false })
  dataSource: DataSource<ComboboxOption, string> | null = null;

  @state()
  private displayText = '';

  @state()
  private filterQuery = '';

  @state()
  private showingAllOptions = true;

  @state()
  private resolvedOptions: Array<ResolvedComboboxOption> = [];

  @state()
  private activeOptionId = '';

  @state()
  private selectedValues: Array<string> = [];

  @state()
  private dataStatus: DataControllerStatus = 'idle';

  @query('#mth-cb-input')
  private inputEl!: HTMLInputElement | null;

  @query('#mth-cb-control')
  private controlEl!: HTMLElement | null;

  @query('#mth-cb-popup')
  private popupEl!: HTMLElement | null;

  @query('#mth-cb-listbox')
  private listboxEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private readonly listboxCtrl: ListboxController;
  private readonly slotCtrl: SlotCollectionController<HTMLElement, ComboboxOption>;
  private readonly dataCtrl: DataController<ComboboxOption, string>;
  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;

  private syncingOpenFromOverlay = false;
  private isHydratingSync = false;
  private pendingLazyOptionReconcile = false;
  private customValidityMessage = '';
  private visualViewportCleanup: (() => void) | null = null;
  private viewportMaxHeightPx: number | null = null;
  private viewportSheet: CSSStyleSheet | null = null;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: comboboxMessages,
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
        if (this.customValidityMessage.length > 0) {
          return { flags: { customError: true }, message: this.customValidityMessage };
        }
        const ctxError = this.error || this.formCtrl.fieldContext?.error || '';
        if (ctxError.length > 0) {
          return { flags: { customError: true }, message: ctxError };
        }
        return null;
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: (nextValue) => {
        this.handleUserTextCommit(nextValue);
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

    this.slotCtrl = new SlotCollectionController<HTMLElement, ComboboxOption>(this, {
      observeSubtree: true,
      attributeFilter: ['value', 'label', 'disabled'],
      onItemsChange: () => {
        if (this.pendingLazyOptionReconcile && !this.open) {
          return;
        }
        if (!this.dataSource && this.options === null) {
          this.reconcileOptions();
        }
      },
    });

    this.dataCtrl = new DataController<ComboboxOption, string>(this, {
      cacheTimeMs: 0,
      onStateChange: (status) => {
        this.dataStatus = status;
        this.setCustomState('loading', status === 'loading' || status === 'refreshing');
        this.setCustomState('empty', status === 'empty');
        this.setCustomState('error', status === 'error');
        this.reconcileOptions();
        this.requestUpdate();
      },
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.popupEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
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

  get dataState(): DataControllerStatus {
    return this.dataCtrl.status;
  }

  get lastPositioningResult(): PositioningResult | null {
    return this.positioningCtrl.lastResult;
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.formCtrl.disabled;
  }

  protected override onFirstConnect(): void {
    this.isHydratingSync = true;
    this.pendingLazyOptionReconcile =
      Boolean(this.shadowRoot) &&
      !this.hasUpdated &&
      !this.open &&
      !this.dataSource &&
      this.options === null;
    const initialDefault = this.defaultValue || this.getAttribute('value') || this.value || '';
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
    this.attachVisualViewportListener();
    this.syncSelectedFromValue(this.value);
    if (!this.pendingLazyOptionReconcile) {
      this.reconcileOptions();
    }
    this.isHydratingSync = false;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.visualViewportCleanup?.();
    this.visualViewportCleanup = null;
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.requestUpdate();
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
    this.filterQuery = '';
    this.showingAllOptions = true;
    this.pendingLazyOptionReconcile = false;
    this.syncSelectedFromValue(this.value);
    this.reconcileOptions();
  }

  protected override onFormStateRestore(
    stateValue: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(stateValue, mode);
  }

  protected override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has('defaultValue')) {
      this.formCtrl.setDefaultValue(this.defaultValue);
    }
    if (changedProperties.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
      this.setCustomState('disabled', this.isEffectivelyDisabled);
    }
    if (changedProperties.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
      this.setCustomState('readonly', this.readonly);
    }
    if (changedProperties.has('required')) {
      this.formCtrl.required = this.required;
      this.setCustomState('required', this.required);
      this.formCtrl.validate();
    }
    if (changedProperties.has('error')) {
      this.formCtrl.validate();
    }
    if (changedProperties.has('multiple')) {
      this.syncSelectedFromValue(this.value);
    }
    if (changedProperties.has('value')) {
      this.syncSelectedFromValue(this.value);
      if (this.formCtrl.value !== this.value) {
        this.formCtrl.setValue(this.value, { markDirty: false });
      }
    }
    if (changedProperties.has('options') && (this.options !== null || this.hasUpdated)) {
      this.pendingLazyOptionReconcile = false;
      this.slotCtrl.setPropertyItems(this.options);
      this.reconcileOptions();
    }
    if (changedProperties.has('dataSource') && (this.dataSource !== null || this.hasUpdated)) {
      this.pendingLazyOptionReconcile = false;
      this.dataCtrl.setDataSource(this.dataSource);
      this.reconcileOptions();
    }
    if (changedProperties.has('open') && this.open && this.pendingLazyOptionReconcile) {
      this.pendingLazyOptionReconcile = false;
      this.reconcileOptions();
    }
    if (changedProperties.has('placement') || changedProperties.has('forceFallback')) {
      this.positioningCtrl.updateOptions({
        placement: this.placement,
        forceFallback: this.forceFallback,
      });
    }
  }

  protected override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (this.inputEl) {
      this.inputCtrl.bind(this.inputEl);
    }

    if (changedProperties.has('open') && !this.syncingOpenFromOverlay && !this.isHydratingSync) {
      if (this.open) {
        void this.overlayCtrl.show();
      } else {
        void this.overlayCtrl.hide('programmatic');
      }
    }

    if (
      this.open &&
      (changedProperties.has('open') ||
        changedProperties.has('placement') ||
        changedProperties.has('forceFallback'))
    ) {
      this.positioningCtrl.start();
    }
  }

  checkValidity(): boolean {
    if (this.formCtrl.value !== this.value) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    if (this.formCtrl.value !== this.value) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
    const valid = this.formCtrl.reportValidity();
    if (!valid && this.internals) {
      this.emitEvent('mth-invalid', { detail: { validity: this.internals.validity } });
    }
    return valid;
  }

  setCustomValidity(message: string): void {
    this.customValidityMessage = message;
    if (message.length > 0) {
      this.formCtrl.setValidity({ customError: true }, message);
    } else {
      this.formCtrl.validate();
    }
  }

  async show(): Promise<void> {
    if (this.isEffectivelyDisabled) return;
    this.pendingLazyOptionReconcile = false;
    this.showingAllOptions = true;
    this.reconcileOptions();
    await this.overlayCtrl.show();
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<void> {
    await this.overlayCtrl.hide(reason);
  }

  async query(filterText: string): Promise<void> {
    this.pendingLazyOptionReconcile = false;
    this.filterQuery = filterText;
    this.displayText = filterText;
    this.showingAllOptions = false;
    if (this.dataSource) {
      await this.dataCtrl.setFilter(filterText);
    } else {
      this.reconcileOptions();
    }
  }

  clear(): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    this.pendingLazyOptionReconcile = false;
    this.value = '';
    this.displayText = '';
    this.filterQuery = '';
    this.selectedValues = [];
    this.showingAllOptions = true;
    this.listboxCtrl.setSelectedValues([]);
    this.formCtrl.setValue('', { markDirty: true });
    this.formCtrl.markTouched();
    this.reconcileOptions();
    this.emitEvent('mth-clear');
    this.emitEvent('mth-change', { detail: { value: '', selectedValues: [] } });
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  selectValue(value: string): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    const entry = this.resolvedOptions.find((o) => o.value === value);
    if (entry?.disabled) return;

    if (this.multiple) {
      const nextSet = new Set(this.selectedValues);
      if (nextSet.has(value)) {
        nextSet.delete(value);
      } else {
        nextSet.add(value);
      }
      const nextArray = Array.from(nextSet);
      this.listboxCtrl.setSelectedValues(nextArray);
      this.commitSelection(nextArray);
    } else {
      this.listboxCtrl.selectValue(value);
    }
  }

  private handleListboxSelection(values: ReadonlyArray<string>): void {
    if (this.multiple) {
      const latest = values[0];
      if (!latest) return;
      const nextSet = new Set(this.selectedValues);
      if (nextSet.has(latest)) {
        nextSet.delete(latest);
      } else {
        nextSet.add(latest);
      }
      const nextArray = Array.from(nextSet);
      this.listboxCtrl.setSelectedValues(nextArray);
      this.commitSelection(nextArray);
    } else {
      this.commitSelection(values);
    }
  }

  private attachVisualViewportListener(): void {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const updateViewport = () => {
      this.viewportMaxHeightPx = Math.max(140, Math.floor(vv.height * 0.45));
      this.applyViewportMaxHeightSheet();
    };
    vv.addEventListener('resize', updateViewport);
    this.visualViewportCleanup = () => {
      vv.removeEventListener('resize', updateViewport);
    };
  }

  private applyViewportMaxHeightSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (this.viewportMaxHeightPx === null) {
      if (this.viewportSheet) {
        root.adoptedStyleSheets = root.adoptedStyleSheets.filter((s) => s !== this.viewportSheet);
      }
      return;
    }
    if (!this.viewportSheet) {
      this.viewportSheet = new CSSStyleSheet();
    }
    if (typeof this.viewportSheet.replaceSync === 'function') {
      this.viewportSheet.replaceSync(
        `:host { --mth-combobox-max-height: ${this.viewportMaxHeightPx}px; }`,
      );
      if (!root.adoptedStyleSheets.includes(this.viewportSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.viewportSheet];
      }
    }
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

    if (!this.multiple && rawValue.length > 0) {
      const match = this.resolvedOptions.find((o) => o.value === rawValue);
      if (match) {
        this.displayText = match.label;
      } else if (this.displayText === '' || this.showingAllOptions) {
        this.displayText = rawValue;
      }
    } else if (!this.multiple && rawValue === '' && this.showingAllOptions) {
      this.displayText = '';
    }
  }

  private collectLightDomOptions(): Array<ResolvedComboboxOption> {
    const collected: Array<ResolvedComboboxOption> = [];
    let index = 0;

    const pushOptionEl = (optEl: HTMLElement, groupName?: string, groupDisabled = false) => {
      const valueAttr = optEl.getAttribute('value');
      const propValue = (optEl as unknown as { value?: string }).value;
      const value =
        typeof propValue === 'string' && propValue.length > 0
          ? propValue
          : (valueAttr ?? '');
      const explicitLabel =
        optEl.getAttribute('label') ??
        (optEl as unknown as { label?: string }).label ??
        '';
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
        id: optEl.id || `mth-cb-opt-${index++}`,
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
          child.getAttribute('label') ??
          (child as unknown as { label?: string }).label ??
          '';
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
    let sourceList: Array<ResolvedComboboxOption>;

    if (this.dataSource) {
      sourceList = this.dataCtrl.items.map((item, idx) => {
        const raw = item as ComboboxOption & { id?: string };
        const value = String(raw.value ?? raw.id ?? raw.label ?? idx);
        const label = String(raw.label ?? raw.value ?? raw.id ?? value);
        return {
          id: raw.id ? `mth-cb-opt-${raw.id}` : `mth-cb-opt-${idx}`,
          value,
          label,
          disabled: Boolean(raw.disabled),
          ...(raw.group !== undefined ? { group: raw.group } : {}),
        };
      });
    } else if (this.options !== null) {
      sourceList = this.options.map((opt, idx) => ({
        id: opt.id ?? `mth-cb-opt-${idx}`,
        value: opt.value,
        label: opt.label,
        disabled: Boolean(opt.disabled),
        ...(opt.group !== undefined ? { group: opt.group } : {}),
      }));
    } else {
      sourceList = this.collectLightDomOptions();
    }

    const queryText = this.filterQuery.trim().toLowerCase();
    const shouldFilter =
      !this.dataSource && this.filterable && queryText.length > 0 && !this.showingAllOptions;

    this.resolvedOptions = shouldFilter
      ? sourceList.filter(
          (opt) =>
            opt.label.toLowerCase().includes(queryText) ||
            opt.value.toLowerCase().includes(queryText),
        )
      : sourceList;

    if (!this.multiple && this.value.length > 0 && this.showingAllOptions) {
      const selected = sourceList.find((o) => o.value === this.value);
      if (selected) {
        this.displayText = selected.label;
      }
    }

    this.syncListboxOptions();
    this.syncLightOptionStates();
  }

  private syncListboxOptions(): void {
    const items: Array<ListboxOptionItem> = this.resolvedOptions.map((opt) => ({
      id: opt.id,
      value: opt.value,
      label: opt.label,
      disabled: opt.disabled,
      ...(opt.group !== undefined ? { group: opt.group } : {}),
    }));
    this.listboxCtrl.setOptions(items);
  }

  private syncLightOptionStates(): void {
    const selectedSet = new Set(this.selectedValues);
    for (const opt of this.resolvedOptions) {
      const el = opt.lightElement;
      if (!el) continue;
      const optState = el as unknown as { selected?: boolean; active?: boolean };
      const isSelected = selectedSet.has(opt.value);
      const isActive = opt.id === this.activeOptionId;
      if (optState.selected !== isSelected) {
        optState.selected = isSelected;
      }
      if (optState.active !== isActive) {
        optState.active = isActive;
      }
    }
  }

  private commitSelection(values: ReadonlyArray<string>): void {
    this.selectedValues = [...values];
    const nextValue = this.multiple ? this.selectedValues.join(',') : (this.selectedValues[0] ?? '');
    this.value = nextValue;
    this.showingAllOptions = true;
    this.filterQuery = '';

    if (this.multiple) {
      this.displayText = this.selectedValues
        .map((val) => this.resolvedOptions.find((o) => o.value === val)?.label ?? val)
        .join(', ');
    } else {
      const matched = this.resolvedOptions.find((o) => o.value === nextValue);
      this.displayText = matched ? matched.label : nextValue;
    }

    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.formCtrl.markTouched();
    this.syncLightOptionStates();

    this.emitEvent('mth-change', {
      detail: {
        value: nextValue,
        selectedValues: [...this.selectedValues],
      },
    });
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    if (!this.multiple && this.open) {
      void this.hide('programmatic');
    }
  }

  private handleUserTextCommit(nextText: string): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    this.pendingLazyOptionReconcile = false;
    this.displayText = nextText;
    this.filterQuery = nextText;
    this.showingAllOptions = false;

    if (!this.open) {
      void this.show();
    }

    if (this.dataSource) {
      void this.dataCtrl.setFilter(nextText);
    } else {
      this.reconcileOptions();
    }

    this.emitEvent('mth-input', { detail: { value: nextText } });
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  private readonly handleInputFocus = (): void => {
    if (this.pendingLazyOptionReconcile) {
      this.pendingLazyOptionReconcile = false;
      this.reconcileOptions();
    }
  };

  private readonly handleInputKeyDown = (event: KeyboardEvent): void => {
    if (this.isEffectivelyDisabled || this.readonly) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.open) {
        void this.show().then(() => {
          const firstEnabled = this.resolvedOptions.findIndex((o) => !o.disabled);
          if (firstEnabled >= 0) {
            this.listboxCtrl.setActiveIndex(firstEnabled);
          }
        });
      } else {
        this.stepActiveOption(1);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open) {
        void this.show().then(() => {
          const lastEnabled = [...this.resolvedOptions]
            .reverse()
            .findIndex((o) => !o.disabled);
          if (lastEnabled >= 0) {
            this.listboxCtrl.setActiveIndex(this.resolvedOptions.length - 1 - lastEnabled);
          }
        });
      } else {
        this.stepActiveOption(-1);
      }
      return;
    }

    if (event.key === 'Enter' && this.open && !this.inputCtrl.isComposing) {
      if (this.listboxCtrl.activeOption) {
        event.preventDefault();
        this.listboxCtrl.selectActive();
      }
      return;
    }

    if (event.key === 'Escape' && this.open) {
      event.preventDefault();
      event.stopPropagation();
      void this.hide('escape');
      return;
    }

    if (event.key === 'Tab' && this.open) {
      void this.hide('programmatic');
    }
  };

  private stepActiveOption(delta: 1 | -1): void {
    const len = this.resolvedOptions.length;
    if (len === 0) return;
    let idx = this.listboxCtrl.activeIndex;
    for (let step = 0; step < len; step += 1) {
      if (idx === -1) {
        idx = delta === 1 ? 0 : len - 1;
      } else {
        idx = (idx + delta + len) % len;
      }
      if (!this.resolvedOptions[idx]?.disabled) {
        this.listboxCtrl.setActiveIndex(idx);
        return;
      }
    }
  }

  private readonly handleOptionClick = (opt: ResolvedComboboxOption, index: number): void => {
    if (this.isEffectivelyDisabled || this.readonly || opt.disabled) return;
    this.listboxCtrl.setActiveIndex(index);
    this.selectValue(opt.value);
    this.inputEl?.focus();
  };

  private readonly handleToggleClick = (): void => {
    if (this.isEffectivelyDisabled || this.readonly) return;
    if (this.open) {
      void this.hide('invoker');
    } else {
      void this.show();
    }
    this.inputEl?.focus();
  };

  private renderOptionsList() {
    if (this.dataStatus === 'loading' || this.dataStatus === 'refreshing') {
      return html`
        <div part="status" role="status">
          <slot name="loading">${this.t('loadingLabel')}</slot>
        </div>
      `;
    }

    if (this.dataStatus === 'error') {
      return html`<div part="status" role="alert">${this.t('errorLabel')}</div>`;
    }

    if (this.resolvedOptions.length === 0) {
      return html`
        <div part="empty">
          <slot name="empty">${this.t('emptyLabel')}</slot>
        </div>
      `;
    }

    const selectedSet = new Set(this.selectedValues);
    const groups = new Map<string, Array<{ opt: ResolvedComboboxOption; idx: number }>>();
    const ungrouped: Array<{ opt: ResolvedComboboxOption; idx: number }> = [];

    this.resolvedOptions.forEach((opt, idx) => {
      if (opt.group && opt.group.length > 0) {
        const list = groups.get(opt.group) ?? [];
        list.push({ opt, idx });
        groups.set(opt.group, list);
      } else {
        ungrouped.push({ opt, idx });
      }
    });

    const renderOptionNode = (opt: ResolvedComboboxOption, idx: number) => {
      const isSelected = selectedSet.has(opt.value);
      const isActive = opt.id === this.activeOptionId;
      return html`
        <div
          id=${opt.id}
          part="option"
          role="option"
          data-value=${opt.value}
          data-active=${isActive ? 'true' : 'false'}
          aria-selected=${isSelected ? 'true' : 'false'}
          aria-disabled=${opt.disabled ? 'true' : nothing}
          @click=${() => this.handleOptionClick(opt, idx)}
        >
          <span aria-hidden="true">${isSelected ? '✓' : ''}</span>
          <span>${opt.label}</span>
        </div>
      `;
    };

    let groupCounter = 0;
    return html`
      ${ungrouped.map(({ opt, idx }) => renderOptionNode(opt, idx))}
      ${Array.from(groups.entries()).map(([groupLabel, entries]) => {
        const groupId = `mth-cb-grp-${groupCounter++}`;
        return html`
          <div role="group" aria-labelledby=${groupId}>
            <div id=${groupId} part="group-label">${groupLabel}</div>
            ${entries.map(({ opt, idx }) => renderOptionNode(opt, idx))}
          </div>
        `;
      })}
    `;
  }

  override render() {
    const ctx = this.formCtrl.fieldContext;
    const hasFieldContext = Boolean(ctx);
    const effectiveLabel = this.label || ctx?.label || '';
    const effectiveHint = this.hint || ctx?.hint || '';
    const explicitError = this.error || ctx?.error || '';
    const validityError = this.formCtrl.userInvalid ? this.formCtrl.validationMessage : '';
    const effectiveError = explicitError || validityError;

    const hasLabel = effectiveLabel.length > 0;
    const hasHint = effectiveHint.length > 0;
    const hasError = effectiveError.length > 0;
    const isDisabled = this.isEffectivelyDisabled;
    const isRequired = this.formCtrl.required || this.required;
    const isReadonly = this.formCtrl.readOnly || this.readonly;
    const isInvalid =
      this.formCtrl.userInvalid || explicitError.length > 0 || this.hasCustomState('invalid');

    const showClear =
      this.clearable && !isDisabled && !isReadonly && (this.value.length > 0 || this.displayText.length > 0);

    return html`
      ${hasLabel
        ? html`<label
            id="mth-cb-label"
            part="label"
            class=${hasFieldContext ? 'label sr-only' : 'label'}
            for="mth-cb-input"
            >${effectiveLabel}</label
          >`
        : nothing}

      <div id="mth-cb-control" part="control">
        <slot name="prefix"></slot>
        <input
          id="mth-cb-input"
          part="input"
          role="combobox"
          type="text"
          autocomplete="off"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="mth-cb-listbox"
          aria-activedescendant=${ifDefined(this.open && this.activeOptionId ? this.activeOptionId : undefined)}
          aria-labelledby=${hasLabel ? 'mth-cb-label' : nothing}
          aria-label=${!hasLabel ? (this.placeholder || this.t('comboboxLabel')) : nothing}
          aria-describedby=${hasHint && !hasError ? 'mth-cb-hint' : nothing}
          aria-errormessage=${isInvalid && hasError ? 'mth-cb-error' : nothing}
          aria-required=${isRequired ? 'true' : nothing}
          aria-invalid=${isInvalid ? 'true' : nothing}
          placeholder=${this.placeholder}
          .value=${this.displayText}
          ?disabled=${isDisabled}
          ?readonly=${isReadonly}
          ?required=${isRequired}
          @focus=${this.handleInputFocus}
          @keydown=${this.handleInputKeyDown}
        />
        ${showClear
          ? html`
              <button
                part="clear-button"
                type="button"
                aria-label=${this.t('clearLabel')}
                @click=${() => this.clear()}
              >
                ×
              </button>
            `
          : nothing}
        <button
          part="toggle-button"
          type="button"
          tabindex="-1"
          aria-label=${this.t('toggleLabel')}
          aria-expanded=${this.open ? 'true' : 'false'}
          ?disabled=${isDisabled}
          @click=${this.handleToggleClick}
        >
          ▾
        </button>
      </div>

      <div id="mth-cb-popup" part="popup" ?hidden=${!this.open}>
        <div
          id="mth-cb-listbox"
          part="listbox"
          role="listbox"
          tabindex="-1"
          aria-multiselectable=${this.multiple ? 'true' : nothing}
        >
          ${this.renderOptionsList()}
        </div>
      </div>

      <p
        id="mth-cb-hint"
        part="hint"
        class=${hasFieldContext ? 'hint sr-only' : 'hint'}
        ?hidden=${!hasHint || hasError}
      >
        ${effectiveHint}
      </p>
      <p
        id="mth-cb-error"
        part="error"
        class=${hasFieldContext ? 'error sr-only' : 'error'}
        role=${hasError ? 'alert' : nothing}
        ?hidden=${!hasError}
      >
        ${effectiveError}
      </p>

      <div class="mth-slot-collector" aria-hidden="true">
        <slot></slot>
      </div>
    `;
  }
}
