import { ContextConsumer } from '@lit/context';
import {
  FIELD_CONTEXT,
  FORM_CONTEXT,
  translateMessage,
  type FieldContextValue,
  type FormContextValue,
  type MessageCatalog,
} from '@methane-ui/core';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type FormControlHost = ReactiveControllerHost & HTMLElement;

export interface FormControlValidatorContext {
  readonly value: File | string | FormData | null;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
}

export type FormControlValidator = (
  ctx: FormControlValidatorContext,
) => { flags: ValidityStateFlags; message: string } | null;

export interface FormControlControllerOptions {
  internals?: ElementInternals | null;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  consumeContexts?: boolean;
  locale?: string;
  messages?: MessageCatalog;
  validator?: FormControlValidator;
  onValueSync?: (value: string, source: 'autofill' | 'reset' | 'restore') => void;
  onDisabledChange?: (disabled: boolean) => void;
  onSetCustomState?: (name: string, active: boolean) => void;
}

/**
 * Shared form-control lifecycle, constraint validation, `:state(...)` tracking,
 * Field/Form context consumption, and Light-DOM slotted `<input>` autofill bridge.
 */
export class FormControlController implements ReactiveController {
  private readonly host: FormControlHost;
  private readonly internals: ElementInternals | null;
  private readonly consumeContexts: boolean;
  private fieldConsumer: ContextConsumer<typeof FIELD_CONTEXT, FormControlHost> | null = null;
  private formConsumer: ContextConsumer<typeof FORM_CONTEXT, FormControlHost> | null = null;

  private fieldCtx: FieldContextValue | undefined;
  private formCtx: FormContextValue | undefined;

  private _defaultValue: string;
  private _value: File | string | FormData | null;
  private _state: File | string | FormData | null = null;
  private _dirty = false;
  private _touched = false;
  private _submitted = false;
  private _invalid = false;
  private _validationMessage = '';
  private _validityFlags: ValidityStateFlags = {};
  private _hostDisabled: boolean;
  private _formDisabled = false;
  private _hostReadOnly: boolean;
  private _required: boolean;
  private validator: FormControlValidator | undefined;
  private readonly onValueSync:
    | ((value: string, source: 'autofill' | 'reset' | 'restore') => void)
    | undefined;
  private readonly onDisabledChange: ((disabled: boolean) => void) | undefined;
  private readonly onSetCustomState:
    | ((name: string, active: boolean) => void)
    | undefined;
  private readonly optionsLocale: string | undefined;
  private readonly messages: MessageCatalog | undefined;

  private boundForm: HTMLFormElement | null = null;
  private boundFieldsets: HTMLFieldSetElement[] = [];
  private fieldsetObserver: MutationObserver | null = null;
  private bridgedInput: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null;
  private lastBridgedValue = '';
  private slotObserver: MutationObserver | null = null;

  constructor(host: FormControlHost, options: FormControlControllerOptions = {}) {
    this.host = host;
    this.internals = options.internals ?? null;
    this.consumeContexts = options.consumeContexts ?? true;
    this._defaultValue = options.defaultValue ?? '';
    this._value = this._defaultValue;
    this._required = options.required ?? false;
    this._hostDisabled = options.disabled ?? false;
    this._hostReadOnly = options.readOnly ?? false;
    this.validator = options.validator;
    this.onValueSync = options.onValueSync;
    this.onDisabledChange = options.onDisabledChange;
    this.onSetCustomState = options.onSetCustomState;
    this.optionsLocale = options.locale;
    this.messages = options.messages;
    this.host.addController(this);
  }

  get dirty(): boolean {
    return this._dirty;
  }

  get touched(): boolean {
    return this._touched;
  }

  get invalid(): boolean {
    return this._invalid;
  }

  get userInvalid(): boolean {
    return this._invalid && (this._touched || this.submitted);
  }

  get validationMessage(): string {
    return this._validationMessage;
  }

  get validityFlags(): Readonly<ValidityStateFlags> {
    return this._validityFlags;
  }

  get hostDisabled(): boolean {
    return this._hostDisabled;
  }

  set hostDisabled(value: boolean) {
    if (this._hostDisabled === value) return;
    const prev = this.disabled;
    this._hostDisabled = value;
    this.syncDisabledState(prev);
  }

  get formDisabled(): boolean {
    return this._formDisabled;
  }

  get disabled(): boolean {
    return (
      this._hostDisabled ||
      this._formDisabled ||
      Boolean(this.fieldCtx?.disabled) ||
      Boolean(this.formCtx?.disabled)
    );
  }

  get readOnly(): boolean {
    return this._hostReadOnly || Boolean(this.formCtx?.readonly);
  }

  get submitted(): boolean {
    return this._submitted || Boolean(this.formCtx?.submitAttempted);
  }

  set hostReadOnly(value: boolean) {
    if (this._hostReadOnly === value) return;
    this._hostReadOnly = value;
    this.host.requestUpdate();
  }

  get required(): boolean {
    return this._required || Boolean(this.fieldCtx?.required);
  }

  set required(value: boolean) {
    if (this._required === value) return;
    this._required = value;
    this.validate();
  }

  get fieldContext(): FieldContextValue | undefined {
    return this.fieldCtx;
  }

  get formContext(): FormContextValue | undefined {
    return this.formCtx;
  }

  get value(): File | string | FormData | null {
    return this._value;
  }

  setDefaultValue(value: string): void {
    this._defaultValue = value;
  }

  setValidator(validator: FormControlValidator | undefined): void {
    this.validator = validator;
    this.validate();
  }

  hostConnected(): void {
    if (this.consumeContexts && !this.fieldConsumer) {
      this.fieldConsumer = new ContextConsumer(this.host, {
        context: FIELD_CONTEXT,
        subscribe: true,
        callback: (value) => {
          const prev = this.disabled;
          this.fieldCtx = value;
          this.syncDisabledState(prev);
          this.validate();
          this.host.requestUpdate();
        },
      });
    }
    if (this.consumeContexts && !this.formConsumer) {
      this.formConsumer = new ContextConsumer(this.host, {
        context: FORM_CONTEXT,
        subscribe: true,
        callback: (value) => {
          const prev = this.disabled;
          this.formCtx = value;
          this.syncDisabledState(prev);
          this.host.requestUpdate();
        },
      });
    }

    this.host.addEventListener('focusout', this.handleFocusOut);
    this.attachFormListener();
    this.discoverSlottedAutofillBridge();
    this.syncCustomStates();
  }

  hostDisconnected(): void {
    this.host.removeEventListener('focusout', this.handleFocusOut);
    this.detachFormListener();
    this.detachAutofillBridge();
    this.slotObserver?.disconnect();
    this.slotObserver = null;
  }

  hostUpdated(): void {
    this.attachFormListener();
  }

  /**
   * Synchronizes form-associated disabled state without mutating the host `disabled` attribute (ADR-014).
   */
  handleFormDisabled(disabled: boolean): void {
    if (this._formDisabled === disabled) return;
    const prev = this.disabled;
    this._formDisabled = disabled;
    this.syncDisabledState(prev);
  }

  handleFormReset(): void {
    this._dirty = false;
    this._touched = false;
    this._submitted = false;
    this._value = this._defaultValue;
    this._state = this._defaultValue;
    this.setFormValue(this._defaultValue, this._defaultValue);
    if (this.bridgedInput && 'value' in this.bridgedInput) {
      this.bridgedInput.value = this._defaultValue;
      this.lastBridgedValue = this._defaultValue;
    }
    this.validate();
    this.syncCustomStates();
    this.onValueSync?.(this._defaultValue, 'reset');
    this.host.requestUpdate();
  }

  handleFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    this._value = state;
    this._state = state;
    this.setFormValue(state, state);
    if (typeof state === 'string') {
      this._dirty = state !== this._defaultValue;
      if (this.bridgedInput && 'value' in this.bridgedInput) {
        this.bridgedInput.value = state;
        this.lastBridgedValue = state;
      }
      this.onValueSync?.(state, 'restore');
    }
    this.validate();
    this.syncCustomStates();
    this.host.requestUpdate();
  }

  setValue(
    value: File | string | FormData | null,
    options: { markDirty?: boolean; state?: File | string | FormData | null } = {},
  ): void {
    this._value = value;
    this._state = options.state ?? value;
    if (options.markDirty ?? true) {
      this._dirty = true;
    }
    this.setFormValue(value, this._state);
    if (typeof value === 'string' && this.bridgedInput && 'value' in this.bridgedInput) {
      if (this.bridgedInput.value !== value) {
        this.bridgedInput.value = value;
      }
      this.lastBridgedValue = value;
    }
    this.validate();
    this.syncCustomStates();
    this.host.requestUpdate();
  }

  markTouched(): void {
    if (this._touched) return;
    this._touched = true;
    this.syncCustomStates();
    this.host.requestUpdate();
  }

  markDirty(): void {
    if (this._dirty) return;
    this._dirty = true;
    this.syncCustomStates();
    this.host.requestUpdate();
  }

  markSubmitted(): void {
    this._submitted = true;
    this.validate();
    this.syncCustomStates();
    this.host.requestUpdate();
  }

  setFormValue(
    value: File | string | FormData | null,
    state?: File | string | FormData | null,
  ): void {
    this._value = value;
    this._state = state ?? value;
    this.internals?.setFormValue?.(value, state ?? null);
  }

  setValidity(
    flags: ValidityStateFlags = {},
    message = '',
    anchor?: HTMLElement,
  ): void {
    this._validityFlags = flags;
    this._invalid = hasAnyValidityError(flags);
    this._validationMessage = this._invalid ? message : '';
    this.internals?.setValidity?.(flags, message, anchor);
    this.syncCustomStates();
  }

  validate(anchor?: HTMLElement): boolean {
    if (this.disabled) {
      this.setValidity({}, '');
      return true;
    }
    if (this.required && isValueEmpty(this._value)) {
      const resolvedLocale =
        this.optionsLocale ??
        this.host.getAttribute('lang') ??
        (typeof this.host.closest === 'function'
          ? this.host.closest('[lang]')?.getAttribute('lang')
          : undefined) ??
        (typeof document !== 'undefined' ? document.documentElement?.lang : '') ??
        'en';
      const message = translateMessage('mth-form-control', 'valueMissing', {
        locale: resolvedLocale || 'en',
        defaults: {
          valueMissing: 'Please fill out this field.',
          ...this.messages,
        },
      });
      this.setValidity({ valueMissing: true }, message, anchor);
      return false;
    }
    if (this.validator) {
      const result = this.validator({
        value: this._value,
        required: this.required,
        disabled: this.disabled,
        readOnly: this.readOnly,
      });
      if (result && hasAnyValidityError(result.flags)) {
        this.setValidity(result.flags, result.message, anchor);
        return false;
      }
    }
    this.setValidity({}, '');
    return true;
  }

  checkValidity(anchor?: HTMLElement): boolean {
    const valid = this.validate(anchor);
    if (!valid) {
      this.host.dispatchEvent(new Event('invalid', { cancelable: true }));
    }
    return valid;
  }

  reportValidity(anchor?: HTMLElement): boolean {
    this._touched = true;
    const valid = this.checkValidity(anchor);
    if (this.internals && typeof this.internals.reportValidity === 'function') {
      this.internals.reportValidity();
    }
    this.syncCustomStates();
    this.host.requestUpdate();
    return valid;
  }

  /**
   * Connects a Light-DOM native `<input>`, `<textarea>`, or `<select>` so browser
   * autofill events synchronize back into the Shadow DOM host without leaking Shadow internals.
   */
  attachAutofillBridge(
    input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null,
  ): void {
    if (this.bridgedInput === input) return;
    this.detachAutofillBridge();
    this.bridgedInput = input;
    if (!input) return;

    this.lastBridgedValue = input.value;
    input.addEventListener('input', this.handleBridgedInput);
    input.addEventListener('change', this.handleBridgedInput);
    input.addEventListener('animationstart', this.handleAutofillAnimation);

    if (input.value && input.value !== this._value) {
      this.syncFromAutofill(input.value);
    }
  }

  private discoverSlottedAutofillBridge(): void {
    const candidate = this.host.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >('[data-mth-autofill], input[slot], textarea[slot], select[slot]');
    if (candidate) {
      this.attachAutofillBridge(candidate);
    }

    if (!this.slotObserver && typeof MutationObserver !== 'undefined') {
      this.slotObserver = new MutationObserver(() => {
        const next = this.host.querySelector<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >('[data-mth-autofill], input[slot], textarea[slot], select[slot]');
        this.attachAutofillBridge(next);
      });
      this.slotObserver.observe(this.host, { childList: true });
    }
  }

  private detachAutofillBridge(): void {
    if (!this.bridgedInput) return;
    this.bridgedInput.removeEventListener('input', this.handleBridgedInput);
    this.bridgedInput.removeEventListener('change', this.handleBridgedInput);
    this.bridgedInput.removeEventListener('animationstart', this.handleAutofillAnimation);
    this.bridgedInput = null;
  }

  private readonly handleBridgedInput = (): void => {
    if (!this.bridgedInput) return;
    const nextValue = this.bridgedInput.value;
    if (nextValue === this.lastBridgedValue) return;
    this.syncFromAutofill(nextValue);
  };

  private readonly handleAutofillAnimation = (event: Event): void => {
    const animName = (event as AnimationEvent).animationName ?? '';
    if (
      animName.includes('autofill') ||
      animName.includes('AutoFill') ||
      (this.bridgedInput && this.bridgedInput.value !== this.lastBridgedValue)
    ) {
      if (this.bridgedInput) {
        this.syncFromAutofill(this.bridgedInput.value);
      }
    }
  };

  private syncFromAutofill(nextValue: string): void {
    this.lastBridgedValue = nextValue;
    this._value = nextValue;
    this._state = nextValue;
    this._dirty = nextValue !== this._defaultValue;
    this.setFormValue(nextValue, nextValue);
    this.validate();
    this.syncCustomStates();
    this.onValueSync?.(nextValue, 'autofill');
    this.host.dispatchEvent(
      new CustomEvent<{ value: string }>('mth-autofill', {
        bubbles: true,
        composed: true,
        detail: { value: nextValue },
      }),
    );
    this.host.requestUpdate();
  }

  private readonly handleFocusOut = (): void => {
    if (!this._touched) {
      this._touched = true;
      this.validate();
      this.syncCustomStates();
      this.host.requestUpdate();
    }
  };

  private get hasNativeFace(): boolean {
    return typeof this.internals?.setFormValue === 'function';
  }

  private readonly handleFormSubmit = (): void => {
    this._submitted = true;
    this.validate();
    this.syncCustomStates();
    this.host.requestUpdate();
  };

  private readonly handleFormResetEvent = (): void => {
    this.handleFormReset();
  };

  private readonly handleFormDataEvent = (event: FormDataEvent): void => {
    if (this.disabled) return;
    const name = this.host.getAttribute('name');
    if (!name || this._value === null) return;
    if (typeof FormData !== 'undefined' && this._value instanceof FormData) {
      for (const [key, entry] of this._value.entries()) {
        event.formData.append(key, entry);
      }
      return;
    }
    if (typeof this._value === 'string') {
      event.formData.append(name, this._value);
    } else if (typeof File !== 'undefined' && this._value instanceof File) {
      event.formData.append(name, this._value);
    }
  };

  private attachFormListener(): void {
    const nextForm = this.internals?.form ?? this.host.closest('form');
    if (nextForm !== this.boundForm) {
      this.detachFormListener();
      this.boundForm = nextForm;
      if (this.boundForm) {
        this.boundForm.addEventListener('submit', this.handleFormSubmit);
        if (!this.hasNativeFace) {
          this.boundForm.addEventListener('reset', this.handleFormResetEvent);
          this.boundForm.addEventListener('formdata', this.handleFormDataEvent);
        }
      }
    }
    if (!this.hasNativeFace) {
      this.syncFieldsetObserver();
    }
  }

  private detachFormListener(): void {
    if (this.boundForm) {
      this.boundForm.removeEventListener('submit', this.handleFormSubmit);
      this.boundForm.removeEventListener('reset', this.handleFormResetEvent);
      this.boundForm.removeEventListener('formdata', this.handleFormDataEvent);
      this.boundForm = null;
    }
    this.fieldsetObserver?.disconnect();
    this.fieldsetObserver = null;
    this.boundFieldsets = [];
  }

  private syncFieldsetObserver(): void {
    const fieldsets: HTMLFieldSetElement[] = [];
    let current: HTMLElement | null = this.host.parentElement;
    while (current) {
      if (current.tagName === 'FIELDSET') {
        fieldsets.push(current as HTMLFieldSetElement);
      }
      current = current.parentElement;
    }
    const same =
      fieldsets.length === this.boundFieldsets.length &&
      fieldsets.every((fs, i) => fs === this.boundFieldsets[i]);
    if (same) return;

    this.fieldsetObserver?.disconnect();
    this.boundFieldsets = fieldsets;
    if (fieldsets.length > 0 && typeof MutationObserver !== 'undefined') {
      this.fieldsetObserver = new MutationObserver(() => {
        this.handleFormDisabled(this.boundFieldsets.some((fs) => fs.disabled));
      });
      for (const fs of fieldsets) {
        this.fieldsetObserver.observe(fs, {
          attributes: true,
          attributeFilter: ['disabled'],
        });
      }
      this.handleFormDisabled(fieldsets.some((fs) => fs.disabled));
    }
  }

  private syncDisabledState(previousDisabled: boolean): void {
    this.syncCustomStates();
    if (previousDisabled !== this.disabled) {
      this.onDisabledChange?.(this.disabled);
    }
    this.host.requestUpdate();
  }

  private syncCustomStates(): void {
    this.applyState('dirty', this._dirty);
    this.applyState('touched', this._touched);
    this.applyState('invalid', this._invalid);
    this.applyState('user-invalid', this.userInvalid);
    this.applyState('disabled', this.disabled);
  }

  private applyState(name: string, active: boolean): void {
    if (this.onSetCustomState) {
      this.onSetCustomState(name, active);
      return;
    }
    if (this.internals?.states) {
      if (active) {
        this.internals.states.add(name);
      } else {
        this.internals.states.delete(name);
      }
    }
  }
}

function hasAnyValidityError(flags: ValidityStateFlags): boolean {
  return Boolean(
    flags.badInput ||
      flags.customError ||
      flags.patternMismatch ||
      flags.rangeOverflow ||
      flags.rangeUnderflow ||
      flags.stepMismatch ||
      flags.tooLong ||
      flags.tooShort ||
      flags.typeMismatch ||
      flags.valueMissing,
  );
}

function isValueEmpty(value: File | string | FormData | null): boolean {
  if (value === null) return true;
  if (typeof value === 'string') return value.length === 0;
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    for (const _entry of value.entries()) {
      return false;
    }
    return true;
  }
  return false;
}
