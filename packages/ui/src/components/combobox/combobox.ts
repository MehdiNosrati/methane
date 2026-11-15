import { UIElement, type PropertyValues } from '@methane/core';
import type {
  DataControllerStatus,
  DataSource,
  OverlayCloseReason,
  Placement,
  PositioningResult,
} from '@methane/primitives';
import { property, query, state } from 'lit/decorators.js';
import { comboboxMessages } from './combobox.messages.js';
import { comboboxStyles } from './combobox.styles.js';
import {
  createComboboxControllers,
  syncComboboxWillUpdate,
  type ComboboxControllersBundle,
} from './combobox-controllers.js';
import { handleComboboxInputKeyDown } from './combobox-keyboard.js';
import {
  syncLightOptionStates,
  type ComboboxOption,
  type ResolvedComboboxOption,
} from './combobox-options.js';
import { ComboboxViewportController, renderComboboxView } from './combobox-popup.js';
import {
  clearComboboxSelection,
  commitComboboxUserText,
  handleComboboxListboxSelection,
  queryComboboxOptions,
  reconcileComboboxOptions,
  selectComboboxValue,
  syncComboboxSelectedFromValue,
  type ComboboxSelectionDeps,
  type ComboboxSelectionStatePatch,
} from './combobox-selection.js';

export type { ComboboxOption };

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

  @property({ type: String, reflect: true }) name = '';
  @property({ type: String }) value = '';
  @property({ type: String, attribute: 'default-value' }) defaultValue = '';
  @property({ type: String }) label = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: String }) placeholder = '';
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, reflect: true }) multiple = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) readonly = false;
  @property({ type: Boolean, reflect: true }) clearable = false;
  @property({ type: Boolean }) filterable = true;
  @property({ type: String, reflect: true }) placement: Placement = 'bottom-start';
  @property({ type: Boolean, attribute: 'force-fallback' }) forceFallback = false;
  @property({ attribute: false }) options: ReadonlyArray<ComboboxOption> | null = null;
  @property({ attribute: false }) dataSource: DataSource<ComboboxOption, string> | null = null;

  @state() private displayText = '';
  @state() private filterQuery = '';
  @state() private showingAllOptions = true;
  @state() private resolvedOptions: Array<ResolvedComboboxOption> = [];
  @state() private activeOptionId = '';
  @state() private selectedValues: Array<string> = [];
  @state() private dataStatus: DataControllerStatus = 'idle';

  @query('#mth-cb-input') private inputEl!: HTMLInputElement | null;
  @query('#mth-cb-control') private controlEl!: HTMLElement | null;
  @query('#mth-cb-popup') private popupEl!: HTMLElement | null;
  @query('#mth-cb-listbox') private listboxEl!: HTMLElement | null;

  private readonly ctrls: ComboboxControllersBundle;
  private readonly viewportCtrl = new ComboboxViewportController();

  private syncingOpenFromOverlay = false;
  private isHydratingSync = false;
  private pendingLazyOptionReconcile = false;
  private customValidityMessage = '';

  constructor() {
    super();
    this.ctrls = createComboboxControllers({
      element: this,
      internals: this.internals,
      placement: this.placement,
      forceFallback: this.forceFallback,
      getError: () => this.error,
      shouldSkipSlotReconcile: () =>
        (this.pendingLazyOptionReconcile && !this.open) ||
        Boolean(this.dataSource) ||
        this.options !== null,
      getCustomValidityMessage: () => this.customValidityMessage,
      getControlElement: () => this.controlEl,
      getPopupElement: () => this.popupEl,
      getListboxElement: () => this.listboxEl,
      getOptionElements: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.syncSelectedFromValue(nextValue);
      },
      onUserTextCommit: (nextValue) => this.handleUserTextCommit(nextValue),
      onActiveOptionChange: (activeId) => {
        this.activeOptionId = activeId;
        syncLightOptionStates(this.resolvedOptions, this.selectedValues, this.activeOptionId);
      },
      onListboxSelection: (values) => this.handleListboxSelection(values),
      onReconcileOptions: () => this.reconcileOptions(),
      onDataStateChange: (status) => {
        this.dataStatus = status;
        this.setCustomState('loading', status === 'loading' || status === 'refreshing');
        this.setCustomState('empty', status === 'empty');
        this.setCustomState('error', status === 'error');
        this.reconcileOptions();
        this.requestUpdate();
      },
      onOverlayOpenChange: (nextOpen) => {
        this.syncingOpenFromOverlay = true;
        this.open = nextOpen;
        this.syncingOpenFromOverlay = false;
        this.setCustomState('open', nextOpen);
        this.requestUpdate();
      },
      setCustomState: (name, active) => this.setCustomState(name, active),
    });
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.ctrls.formCtrl.validationMessage || this.internals?.validationMessage || '';
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.closest('form');
  }

  get dataState(): DataControllerStatus {
    return this.ctrls.dataCtrl.status;
  }

  get lastPositioningResult(): PositioningResult | null {
    return this.ctrls.positioningCtrl.lastResult;
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.ctrls.formCtrl.disabled;
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
    this.ctrls.formCtrl.setDefaultValue(initialDefault);
    this.ctrls.formCtrl.setValue(this.value, { markDirty: false });
    this.viewportCtrl.attach(() => this.shadowRoot);
    this.syncSelectedFromValue(this.value);
    if (!this.pendingLazyOptionReconcile) {
      this.reconcileOptions();
    }
    this.isHydratingSync = false;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.viewportCtrl.detach();
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.ctrls.formCtrl.handleFormDisabled(disabled);
    this.requestUpdate();
  }

  protected override onFormReset(): void {
    this.ctrls.formCtrl.handleFormReset();
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
    this.ctrls.formCtrl.handleFormStateRestore(stateValue, mode);
  }

  protected override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);
    syncComboboxWillUpdate(
      this,
      {
        pendingLazyOptionReconcile: this.pendingLazyOptionReconcile,
        setPendingLazyOptionReconcile: (next) => {
          this.pendingLazyOptionReconcile = next;
        },
        setCustomState: (name, active) => this.setCustomState(name, active),
        syncSelectedFromValue: (rawValue) => this.syncSelectedFromValue(rawValue),
        reconcileOptions: () => this.reconcileOptions(),
      },
      this.ctrls,
      changedProperties,
    );
  }

  protected override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (this.inputEl) this.ctrls.inputCtrl.bind(this.inputEl);

    if (changedProperties.has('open') && !this.syncingOpenFromOverlay && !this.isHydratingSync) {
      if (this.open) void this.ctrls.overlayCtrl.show();
      else void this.ctrls.overlayCtrl.hide('programmatic');
    }

    if (
      this.open &&
      (changedProperties.has('open') ||
        changedProperties.has('placement') ||
        changedProperties.has('forceFallback'))
    ) {
      this.ctrls.positioningCtrl.start();
    }
  }

  checkValidity(): boolean {
    if (this.ctrls.formCtrl.value !== this.value) {
      this.ctrls.formCtrl.setValue(this.value, { markDirty: false });
    }
    return this.ctrls.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    if (this.ctrls.formCtrl.value !== this.value) {
      this.ctrls.formCtrl.setValue(this.value, { markDirty: false });
    }
    const valid = this.ctrls.formCtrl.reportValidity();
    if (!valid && this.internals) {
      this.emitEvent('mth-invalid', { detail: { validity: this.internals.validity } });
    }
    return valid;
  }

  setCustomValidity(message: string): void {
    this.customValidityMessage = message;
    if (message.length > 0) this.ctrls.formCtrl.setValidity({ customError: true }, message);
    else this.ctrls.formCtrl.validate();
  }

  async show(): Promise<void> {
    if (this.isEffectivelyDisabled) return;
    this.pendingLazyOptionReconcile = false;
    this.showingAllOptions = true;
    this.reconcileOptions();
    await this.ctrls.overlayCtrl.show();
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<void> {
    await this.ctrls.overlayCtrl.hide(reason);
  }

  async query(filterText: string): Promise<void> {
    await queryComboboxOptions(this.getSelectionDeps(), filterText);
  }

  clear(): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    clearComboboxSelection(this.getSelectionDeps());
  }

  selectValue(value: string): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    selectComboboxValue(this.getSelectionDeps(), value);
  }

  private getSelectionDeps(): ComboboxSelectionDeps {
    return {
      element: this,
      ctrls: this.ctrls,
      multiple: this.multiple,
      filterable: this.filterable,
      open: this.open,
      options: this.options,
      dataSource: this.dataSource,
      value: this.value,
      displayText: this.displayText,
      filterQuery: this.filterQuery,
      showingAllOptions: this.showingAllOptions,
      resolvedOptions: this.resolvedOptions,
      selectedValues: this.selectedValues,
      activeOptionId: this.activeOptionId,
      applyState: (patch: ComboboxSelectionStatePatch) => Object.assign(this, patch),
      emitEvent: (name, options) => this.emitEvent(name, options),
      show: () => this.show(),
      hide: (reason) => this.hide(reason),
    };
  }

  private handleListboxSelection(values: ReadonlyArray<string>): void {
    handleComboboxListboxSelection(this.getSelectionDeps(), values);
  }

  private syncSelectedFromValue(rawValue: string): void {
    syncComboboxSelectedFromValue(this.getSelectionDeps(), rawValue);
  }

  private reconcileOptions(): void {
    reconcileComboboxOptions(this.getSelectionDeps());
  }

  private handleUserTextCommit(nextText: string): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    commitComboboxUserText(this.getSelectionDeps(), nextText);
  }

  private readonly handleInputFocus = (): void => {
    if (this.pendingLazyOptionReconcile) {
      this.pendingLazyOptionReconcile = false;
      this.reconcileOptions();
    }
  };

  private readonly handleInputKeyDown = (event: KeyboardEvent): void => {
    handleComboboxInputKeyDown(
      {
        isEffectivelyDisabled: this.isEffectivelyDisabled,
        readonly: this.readonly,
        open: this.open,
        isComposing: this.ctrls.inputCtrl.isComposing,
        resolvedOptions: this.resolvedOptions,
        activeIndex: this.ctrls.listboxCtrl.activeIndex,
        hasActiveOption: Boolean(this.ctrls.listboxCtrl.activeOption),
        show: () => this.show(),
        hide: (reason) => this.hide(reason),
        setActiveIndex: (index) => this.ctrls.listboxCtrl.setActiveIndex(index),
        selectActive: () => this.ctrls.listboxCtrl.selectActive(),
      },
      event,
    );
  };

  private readonly handleOptionClick = (opt: ResolvedComboboxOption, index: number): void => {
    if (this.isEffectivelyDisabled || this.readonly || opt.disabled) return;
    this.ctrls.listboxCtrl.setActiveIndex(index);
    this.selectValue(opt.value);
    this.inputEl?.focus();
  };

  private readonly handleToggleClick = (): void => {
    if (this.isEffectivelyDisabled || this.readonly) return;
    if (this.open) void this.hide('invoker');
    else void this.show();
    this.inputEl?.focus();
  };

  override render() {
    return renderComboboxView(this, {
      displayText: this.displayText,
      activeOptionId: this.activeOptionId,
      dataStatus: this.dataStatus,
      resolvedOptions: this.resolvedOptions,
      selectedValues: this.selectedValues,
      fieldContext: this.ctrls.formCtrl.fieldContext,
      userInvalid: this.ctrls.formCtrl.userInvalid,
      validationMessage: this.ctrls.formCtrl.validationMessage,
      formRequired: this.ctrls.formCtrl.required,
      formReadOnly: this.ctrls.formCtrl.readOnly,
      t: (key) => this.t(key),
      onInputFocus: this.handleInputFocus,
      onInputKeyDown: this.handleInputKeyDown,
      onClearClick: () => this.clear(),
      onToggleClick: this.handleToggleClick,
      onOptionClick: this.handleOptionClick,
    });
  }
}
