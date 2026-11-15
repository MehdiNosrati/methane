import { UIElement, type PropertyValues } from '@methane/core';
import { FieldContextProviderController, type DensityMode } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { fieldMessages } from './field.messages.js';
import { fieldStyles } from './field.styles.js';

/**
 * `<mth-field>`: layout wrapper and Community Context Protocol (`FIELD_CONTEXT`)
 * provider that forwards label, hint, error, required, and disabled state down
 * to descendant Methane controls without cross-root ARIA IDREF bridging (ADR-003).
 */
export class MthField extends UIElement {
  static override messages = fieldMessages;
  static override styles = fieldStyles;

  @property({ type: String })
  label = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, reflect: true })
  density: DensityMode = 'default';

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  private readonly fieldContext = new FieldContextProviderController(this, {
    label: '',
    hint: '',
    error: '',
    required: false,
    disabled: false,
  });

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    const effectiveLabel = this.slottedLabelText || this.label;
    const effectiveHint = this.slottedHintText || this.hint;
    const effectiveError = this.slottedErrorText || this.error;

    this.setCustomState('required', this.required);
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('invalid', effectiveError.length > 0);

    this.fieldContext.update({
      label: effectiveLabel,
      hint: effectiveHint,
      error: effectiveError,
      required: this.required,
      disabled: this.disabled,
    });
  }

  private handleSlotChange(slotName: 'label' | 'hint' | 'error', event: Event): void {
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
    const hasLabel = this.label.length > 0 || this.slottedLabelText.length > 0;
    const hasHint = this.hint.length > 0 || this.slottedHintText.length > 0;
    const hasError = this.error.length > 0 || this.slottedErrorText.length > 0;

    return html`
      <div part="base" class="field" data-density=${this.density}>
        <div part="label" class="label" ?hidden=${!hasLabel}>
          <slot
            name="label"
            @slotchange=${(ev: Event) => this.handleSlotChange('label', ev)}
          >${this.label}</slot>
          ${this.required
            ? html`<span class="required-mark" aria-hidden="true">${this.t('requiredIndicator')}</span>`
            : nothing}
        </div>
        <div part="control" class="control">
          <slot></slot>
        </div>
        <div part="hint" class="hint" ?hidden=${!hasHint || hasError}>
          <slot
            name="hint"
            @slotchange=${(ev: Event) => this.handleSlotChange('hint', ev)}
          >${this.hint}</slot>
        </div>
        <div part="error" class="error" ?hidden=${!hasError}>
          <slot
            name="error"
            @slotchange=${(ev: Event) => this.handleSlotChange('error', ev)}
          >${this.error}</slot>
        </div>
      </div>
    `;
  }
}
