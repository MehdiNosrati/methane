import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { FORM_CONTEXT, UIElement, type FormContextValue } from '@methane/core';
import { FormContextProviderController } from '@methane/primitives';
import { fieldsetMessages } from './fieldset.messages.js';
import { fieldsetStyles } from './fieldset.styles.js';

/**
 * Semantic `<fieldset>` and `<legend>` grouping container with FormContext
 * `disabled` propagation to enclosed Methane form controls.
 */
export class MthFieldset extends UIElement {
  static override styles = [fieldsetStyles];
  static override messages = fieldsetMessages;

  @property({ type: String })
  legend = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @state()
  private hasLegendSlot = false;

  @state()
  private hasHintSlot = false;

  @state()
  private hasErrorSlot = false;

  @state()
  private ancestorFormContext: FormContextValue | undefined = undefined;

  private readonly formContextCtrl: FormContextProviderController;
  private ancestorUnsubscribe: (() => void) | undefined = undefined;

  constructor() {
    super();
    this.formContextCtrl = new FormContextProviderController(this, {
      disabled: false,
    });
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || Boolean(this.ancestorFormContext?.disabled);
  }

  protected override onFirstConnect(): void {
    this.subscribeToAncestorFormContext();
    this.syncContextAndStates();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.ancestorUnsubscribe?.();
    this.ancestorUnsubscribe = undefined;
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (
      changedProperties.has('disabled') ||
      changedProperties.has('ancestorFormContext') ||
      changedProperties.has('error') ||
      changedProperties.has('hasErrorSlot')
    ) {
      this.syncContextAndStates();
    }
  }

  private subscribeToAncestorFormContext(): void {
    this.ancestorUnsubscribe?.();
    this.ancestorUnsubscribe = undefined;

    const parent = this.parentNode;
    if (!parent) return;

    const event = Object.assign(
      new Event('context-request', { bubbles: true, composed: true }),
      {
        context: FORM_CONTEXT,
        subscribe: true,
        callback: (value: FormContextValue, unsubscribe?: () => void) => {
          this.ancestorUnsubscribe = unsubscribe;
          this.ancestorFormContext = value;
        },
      },
    );
    parent.dispatchEvent(event);
  }

  private syncContextAndStates(): void {
    const ancestor = this.ancestorFormContext;
    const effectiveDisabled = this.disabled || Boolean(ancestor?.disabled);
    const hasInvalid = Boolean(this.error) || this.hasErrorSlot;

    this.setCustomState('disabled', effectiveDisabled);
    this.setCustomState('invalid', hasInvalid);

    this.formContextCtrl.update({
      ...(ancestor?.readonly !== undefined ? { readonly: ancestor.readonly } : {}),
      ...(ancestor?.density !== undefined ? { density: ancestor.density } : {}),
      ...(ancestor?.submitAttempted !== undefined
        ? { submitAttempted: ancestor.submitAttempted }
        : {}),
      disabled: effectiveDisabled,
    });
  }

  private hasSlottedContent(event: Event): boolean {
    const slot = event.target as HTMLSlotElement | null;
    if (!slot || typeof slot.assignedNodes !== 'function') return false;
    return slot
      .assignedNodes({ flatten: true })
      .some(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE ||
          (node.nodeType === Node.TEXT_NODE && (node.textContent?.trim().length ?? 0) > 0),
      );
  }

  private handleLegendSlotChange(event: Event): void {
    this.hasLegendSlot = this.hasSlottedContent(event);
  }

  private handleHintSlotChange(event: Event): void {
    this.hasHintSlot = this.hasSlottedContent(event);
  }

  private handleErrorSlotChange(event: Event): void {
    this.hasErrorSlot = this.hasSlottedContent(event);
  }

  protected override render() {
    const effectiveDisabled = this.isEffectivelyDisabled;
    const showLegend = Boolean(this.legend) || this.hasLegendSlot;
    const showHint = Boolean(this.hint) || this.hasHintSlot;
    const showError = Boolean(this.error) || this.hasErrorSlot;

    return html`
      <fieldset
        part="fieldset"
        ?disabled=${effectiveDisabled}
        aria-describedby=${showHint ? 'mth-fieldset-hint' : nothing}
        aria-errormessage=${showError ? 'mth-fieldset-error' : nothing}
        aria-invalid=${showError ? 'true' : nothing}
      >
        <legend id="mth-fieldset-legend" part="legend" ?hidden=${!showLegend}>
          <slot name="legend" @slotchange=${this.handleLegendSlotChange}>${this.legend}</slot>
        </legend>

        <div part="body">
          <slot></slot>
        </div>

        <div id="mth-fieldset-hint" part="hint" ?hidden=${!showHint}>
          <slot name="hint" @slotchange=${this.handleHintSlotChange}>${this.hint}</slot>
        </div>

        <div id="mth-fieldset-error" part="error" role="alert" ?hidden=${!showError}>
          <slot name="error" @slotchange=${this.handleErrorSlotChange}>${this.error}</slot>
        </div>
      </fieldset>
    `;
  }
}
