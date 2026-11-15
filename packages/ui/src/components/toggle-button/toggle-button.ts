import { UIElement, html, nothing, property } from '@methane-ui/core';
import { toggleButtonMessages } from './toggle-button.messages.js';
import { toggleButtonStyles } from './toggle-button.styles.js';

export type MthToggleButtonVariant = 'solid' | 'soft' | 'outline' | 'outlined' | 'ghost';
export type MthToggleButtonSize = 'sm' | 'md' | 'lg';

/**
 * Toggleable button component exposing `aria-pressed` and `:state(pressed)`.
 */
export class MthToggleButton extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = toggleButtonStyles;
  static override messages = toggleButtonMessages;

  private _variant: MthToggleButtonVariant = 'outline';

  @property({ type: Boolean, reflect: true })
  pressed = false;

  @property({ type: String, reflect: true })
  get variant(): MthToggleButtonVariant {
    return this._variant === 'outlined' ? 'outline' : this._variant;
  }

  set variant(value: MthToggleButtonVariant) {
    const normalized = value === 'outlined' ? 'outline' : value;
    const old = this._variant;
    this._variant = normalized;
    this.requestUpdate('variant', old);
  }

  @property({ type: String, reflect: true })
  size: MthToggleButtonSize = 'md';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  value = '';

  @property({ type: String })
  label = '';

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);
    if (changed.has('pressed')) {
      this.setCustomState('pressed', this.pressed);
    }
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
  }

  private handleClick = (event: MouseEvent): void => {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const nextPressed = !this.pressed;
    const pressAllowed = this.emitEvent('mth-press', {
      cancelable: true,
      detail: { originalEvent: event, pressed: nextPressed },
    });
    if (!pressAllowed) return;

    const changeAllowed = this.emitEvent('mth-change', {
      cancelable: true,
      detail: { pressed: nextPressed, value: this.value },
    });
    if (!changeAllowed) return;

    this.pressed = nextPressed;
  };

  override render() {
    return html`
      <button
        part="base"
        type="button"
        aria-pressed=${this.pressed ? 'true' : 'false'}
        aria-label=${this.label || nothing}
        ?disabled=${this.disabled}
        @click=${this.handleClick}
      >
        <slot name="start"></slot>
        <slot></slot>
        <slot name="end"></slot>
      </button>
    `;
  }
}
