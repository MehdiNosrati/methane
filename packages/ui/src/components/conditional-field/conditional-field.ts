import { ContextConsumer } from '@lit/context';
import { UIElement, type FormContextValue, type PropertyValues } from '@methane/core';
import { FORM_CONTEXT, FormContextProviderController } from '@methane/primitives';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { conditionalFieldMessages } from './conditional-field.messages.js';
import { conditionalFieldStyles } from './conditional-field.styles.js';

export type ConditionOperator = 'eq' | 'neq' | 'truthy' | 'empty' | 'in';
export type ConditionMode = 'hide' | 'disable';
export type ConditionPredicate = (
  values: Record<string, unknown>,
  formContext: FormContextValue,
) => boolean;

/**
 * `<mth-conditional-field>`: reactive `FORM_CONTEXT` condition gate toggling
 * descendant visibility and propagated `FORM_CONTEXT.disabled` state.
 */
export class MthConditionalField extends UIElement {
  static override messages = conditionalFieldMessages;
  static override styles = conditionalFieldStyles;

  @property({ type: Boolean })
  when: boolean | undefined = undefined;

  @property({ type: String })
  field = '';

  @property({ type: String })
  equals = '';

  @property({ type: String })
  operator: ConditionOperator = 'eq';

  @property({ type: String, reflect: true })
  mode: ConditionMode = 'hide';

  @property({ type: Boolean, attribute: 'disable-when-hidden', reflect: true })
  disableWhenHidden = true;

  @property({ attribute: false })
  values: Record<string, unknown> | undefined = undefined;

  @property({ attribute: false })
  predicate: ConditionPredicate | undefined = undefined;

  @state()
  private parentFormContext: FormContextValue = { version: 1 };

  private readonly formProvider: FormContextProviderController;
  private observedForm: HTMLFormElement | null = null;
  private lastMatched: boolean | null = null;

  constructor() {
    super();
    this.formProvider = new FormContextProviderController(this, {});
    new ContextConsumer(this, {
      context: FORM_CONTEXT,
      subscribe: true,
      callback: (val) => {
        if (val) {
          this.parentFormContext = val;
        }
      },
    });
  }

  get matched(): boolean {
    return this.evaluateCondition();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.attachFormListeners();
  }

  override disconnectedCallback(): void {
    this.detachFormListeners();
    super.disconnectedCallback();
  }

  refresh(): void {
    this.requestUpdate();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    const isMatched = this.evaluateCondition();

    const shouldDisableDescendants =
      Boolean(this.parentFormContext.disabled) ||
      (!isMatched && (this.mode === 'disable' || this.disableWhenHidden));

    const nextDisabled = shouldDisableDescendants;
    const nextReadonly = Boolean(this.parentFormContext.readonly);
    const nextSubmitAttempted = Boolean(this.parentFormContext.submitAttempted);

    if (
      this.formProvider.current.disabled !== nextDisabled ||
      this.formProvider.current.readonly !== nextReadonly ||
      this.formProvider.current.submitAttempted !== nextSubmitAttempted
    ) {
      this.formProvider.update({
        ...this.parentFormContext,
        disabled: nextDisabled,
        readonly: nextReadonly,
        submitAttempted: nextSubmitAttempted,
      });
    }

    this.setCustomState('matched', isMatched);
    this.setCustomState('hidden-branch', !isMatched && this.mode === 'hide');

    if (this.lastMatched !== null && this.lastMatched !== isMatched && this.hasUpdated) {
      this.emitEvent('mth-condition-change', { detail: { matched: isMatched } });
    }
    this.lastMatched = isMatched;
  }

  private attachFormListeners(): void {
    if (typeof this.closest !== 'function') return;
    const owningForm = this.closest('form');
    if (owningForm === this.observedForm) return;
    this.detachFormListeners();
    if (owningForm) {
      this.observedForm = owningForm;
      owningForm.addEventListener('input', this.handleFormActivity);
      owningForm.addEventListener('change', this.handleFormActivity);
      owningForm.addEventListener('reset', this.handleFormReset);
    }
  }

  private detachFormListeners(): void {
    if (!this.observedForm) return;
    this.observedForm.removeEventListener('input', this.handleFormActivity);
    this.observedForm.removeEventListener('change', this.handleFormActivity);
    this.observedForm.removeEventListener('reset', this.handleFormReset);
    this.observedForm = null;
  }

  private readonly handleFormActivity = (): void => {
    this.requestUpdate();
  };

  private readonly handleFormReset = (): void => {
    queueMicrotask(() => this.requestUpdate());
  };

  private collectValues(): Record<string, unknown> {
    if (this.values) return this.values;
    const collected: Record<string, unknown> = {};
    const form = typeof this.closest === 'function' ? this.closest('form') : null;
    if (form) {
      if (typeof FormData !== 'undefined') {
        try {
          const fd = new FormData(form);
          for (const [key, val] of fd.entries()) {
            collected[key] = val;
          }
        } catch {
          // Fallback to scanning controls directly below.
        }
      }
      for (const el of Array.from(form.querySelectorAll('[name]'))) {
        const key = el.getAttribute('name');
        if (!key) continue;
        const anyEl = el as unknown as {
          type?: string;
          checked?: boolean;
          value?: unknown;
        };
        if (anyEl.type === 'checkbox') {
          collected[key] = Boolean(anyEl.checked);
        } else if (anyEl.value !== undefined) {
          collected[key] = anyEl.value;
        }
      }
    }
    return collected;
  }

  private evaluateCondition(): boolean {
    if (this.when !== undefined) {
      return Boolean(this.when);
    }
    const vals = this.collectValues();
    if (this.predicate) {
      return Boolean(this.predicate(vals, this.parentFormContext));
    }
    if (this.field.length === 0) {
      return true;
    }
    const actual = vals[this.field];
    const actualStr = actual === undefined || actual === null ? '' : String(actual);
    switch (this.operator) {
      case 'truthy':
        return Boolean(actual) && actualStr !== 'false' && actualStr !== '0';
      case 'empty':
        return actual === undefined || actual === null || actualStr.trim().length === 0;
      case 'neq':
        return actualStr !== this.equals;
      case 'in': {
        const allowed = this.equals
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        return allowed.includes(actualStr);
      }
      case 'eq':
      default:
        return actualStr === this.equals;
    }
  }

  override render() {
    const isMatched = this.evaluateCondition();
    const isHidden = !isMatched && this.mode === 'hide';
    const inactiveMode = !isMatched && this.mode === 'disable' ? 'disable' : 'none';

    return html`
      <div
        part="base"
        class="base"
        ?hidden=${isHidden}
        aria-hidden=${isHidden ? 'true' : 'false'}
        data-matched=${isMatched ? 'true' : 'false'}
        data-inactive-mode=${inactiveMode}
      >
        <slot></slot>
      </div>
    `;
  }
}
