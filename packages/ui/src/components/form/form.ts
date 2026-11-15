import { html, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { UIElement } from '@methane/core';
import { FormContextProviderController } from '@methane/primitives';
import { formMessages } from './form.messages.js';
import { formStyles } from './form.styles.js';

export interface FormValidationError {
  readonly id: string;
  readonly name: string;
  readonly message: string;
  readonly label?: string;
}

export type FormValues = Record<string, string | ReadonlyArray<string>>;

interface FormControlCandidate extends HTMLElement {
  name?: string;
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  isEffectivelyDisabled?: boolean;
  effectivelyDisabled?: boolean;
  validationMessage?: string;
  label?: string;
  checkValidity?: () => boolean;
  reportValidity?: () => boolean;
  formResetCallback?: () => void;
}

function isControlElement(node: Element): node is FormControlCandidate {
  if (!(node instanceof HTMLElement)) return false;
  const tag = node.tagName.toLowerCase();
  if (tag === 'button' || tag === 'mth-button' || tag === 'fieldset' || tag === 'mth-fieldset') {
    return false;
  }
  return (
    typeof (node as FormControlCandidate).checkValidity === 'function' ||
    tag === 'input' ||
    tag === 'select' ||
    tag === 'textarea'
  );
}

function isControlDisabled(el: FormControlCandidate): boolean {
  return Boolean(
    el.disabled ||
      el.isEffectivelyDisabled ||
      el.effectivelyDisabled ||
      el.closest('fieldset[disabled], mth-fieldset[disabled]'),
  );
}

/**
 * Form coordinator providing `FORM_CONTEXT`, coordinating child FACE validation,
 * and emitting `mth-submit` `{ values }` or `mth-invalid` `{ errors }`.
 */
export class MthForm extends UIElement {
  static override styles = [formStyles];
  static override messages = formMessages;

  @property({ type: Boolean, reflect: true })
  novalidate = false;

  @property({ type: Boolean, reflect: true })
  submitting = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  private readonly formContextCtrl: FormContextProviderController;
  private submitAttempted = false;

  constructor() {
    super();
    this.formContextCtrl = new FormContextProviderController(this, {
      disabled: false,
      readonly: false,
      submitAttempted: false,
    });
  }

  protected override onFirstConnect(): void {
    this.addEventListener('click', this.handleDelegatedClick);
    this.syncContextAndStates();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleDelegatedClick);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (
      changedProperties.has('disabled') ||
      changedProperties.has('submitting') ||
      changedProperties.has('readonly')
    ) {
      this.syncContextAndStates();
    }
  }

  getValues(): FormValues {
    const values: Record<string, string | Array<string>> = {};
    for (const ctrl of this.getControls()) {
      const name = ctrl.name ?? ctrl.getAttribute('name') ?? '';
      if (!name || isControlDisabled(ctrl)) continue;

      if (typeof ctrl.checked === 'boolean') {
        if (!ctrl.checked) continue;
        const checkedValue =
          typeof ctrl.value === 'string' && ctrl.value.length > 0 ? ctrl.value : 'on';
        this.appendValue(values, name, checkedValue);
        continue;
      }

      const rawValue = typeof ctrl.value === 'string' ? ctrl.value : (ctrl.getAttribute('value') ?? '');
      this.appendValue(values, name, rawValue);
    }
    return values;
  }

  collectErrors(): Array<FormValidationError> {
    const errors: Array<FormValidationError> = [];
    for (const ctrl of this.getControls()) {
      if (isControlDisabled(ctrl)) continue;
      if (typeof ctrl.checkValidity !== 'function') continue;

      const valid = ctrl.checkValidity();
      if (!valid) {
        const message = ctrl.validationMessage || this.t('invalidFallback');
        const labelText =
          ctrl.label || ctrl.closest('mth-field')?.getAttribute('label') || undefined;
        errors.push({
          id: ctrl.id || '',
          name: ctrl.name ?? ctrl.getAttribute('name') ?? '',
          message,
          ...(labelText ? { label: labelText } : {}),
        });
      }
    }
    return errors;
  }

  checkValidity(): boolean {
    return this.collectErrors().length === 0;
  }

  reportValidity(): boolean {
    let allValid = true;
    for (const ctrl of this.getControls()) {
      if (isControlDisabled(ctrl)) continue;
      if (typeof ctrl.reportValidity === 'function') {
        if (!ctrl.reportValidity()) {
          allValid = false;
        }
      } else if (typeof ctrl.checkValidity === 'function') {
        if (!ctrl.checkValidity()) {
          allValid = false;
        }
      }
    }
    this.setCustomState('invalid', !allValid);
    return allValid;
  }

  submit(): boolean {
    return this.requestSubmit();
  }

  requestSubmit(): boolean {
    if (this.disabled || this.submitting) {
      return false;
    }

    this.submitAttempted = true;
    this.syncContextAndStates();

    if (!this.novalidate) {
      const errors = this.collectErrors();
      if (errors.length > 0) {
        this.setCustomState('invalid', true);
        const firstInvalid = this.getControls().find(
          (ctrl) => !isControlDisabled(ctrl) && ctrl.checkValidity?.() === false,
        );
        firstInvalid?.focus();
        this.emitEvent('mth-invalid', {
          detail: { errors },
        });
        return false;
      }
    }

    this.setCustomState('invalid', false);
    const values = this.getValues();
    return this.emitEvent('mth-submit', {
      cancelable: true,
      detail: { values },
    });
  }

  reset(): void {
    this.submitAttempted = false;
    this.setCustomState('invalid', false);
    this.syncContextAndStates();

    for (const ctrl of this.getControls()) {
      if (typeof ctrl.formResetCallback === 'function') {
        ctrl.formResetCallback();
      } else if (
        ctrl instanceof HTMLInputElement ||
        ctrl instanceof HTMLTextAreaElement ||
        ctrl instanceof HTMLSelectElement
      ) {
        if (ctrl instanceof HTMLInputElement && (ctrl.type === 'checkbox' || ctrl.type === 'radio')) {
          ctrl.checked = ctrl.defaultChecked;
        } else {
          ctrl.value = ctrl instanceof HTMLSelectElement ? '' : ctrl.defaultValue;
        }
      }
    }
  }

  private getControls(): Array<FormControlCandidate> {
    const candidates: Array<FormControlCandidate> = [];
    const walk = (root: Element) => {
      for (const child of Array.from(root.children)) {
        if (isControlElement(child)) {
          candidates.push(child);
        }
        if (child.tagName.toLowerCase() !== 'mth-form') {
          walk(child);
        }
      }
    };
    walk(this);
    return candidates;
  }

  private appendValue(target: Record<string, string | Array<string>>, key: string, value: string): void {
    const existing = target[key];
    if (existing === undefined) {
      target[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      target[key] = [existing, value];
    }
  }

  private syncContextAndStates(): void {
    const effectiveDisabled = this.disabled || this.submitting;
    this.setCustomState('submitting', this.submitting);
    this.setCustomState('disabled', effectiveDisabled);
    this.setCustomState('readonly', this.readonly);

    this.formContextCtrl.update({
      disabled: effectiveDisabled,
      readonly: this.readonly,
      submitAttempted: this.submitAttempted,
    });
  }

  private readonly handleDelegatedClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const actionBtn = target.closest(
      'button[type="submit"], input[type="submit"], mth-button[type="submit"], button[type="reset"], input[type="reset"], mth-button[type="reset"]',
    );
    if (!actionBtn || !this.contains(actionBtn)) return;

    const btnType = actionBtn.getAttribute('type');
    if (btnType === 'submit') {
      event.preventDefault();
      this.requestSubmit();
    } else if (btnType === 'reset') {
      event.preventDefault();
      this.reset();
    }
  };

  private handleNativeSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.requestSubmit();
  }

  private handleNativeReset(event: Event): void {
    event.preventDefault();
    this.reset();
  }

  protected override render() {
    return html`
      <form
        part="form"
        ?novalidate=${this.novalidate}
        @submit=${this.handleNativeSubmit}
        @reset=${this.handleNativeReset}
      >
        <slot></slot>
      </form>
    `;
  }
}
