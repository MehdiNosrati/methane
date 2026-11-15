import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { radioMessages } from './radio.messages.js';
import { radioStyles } from './radio.styles.js';

/**
 * `<mth-radio>`: host-focusable radio option controlled by a parent `<mth-radio-group>`
 * via `ElementInternals` ARIA (`role="radio"`), custom states, and DOM events.
 */
export class MthRadio extends UIElement {
  static override messages = radioMessages;
  static override styles = radioStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  private _groupDisabled = false;

  get groupDisabled(): boolean {
    return this._groupDisabled;
  }

  set groupDisabled(val: boolean) {
    if (this._groupDisabled === val) return;
    this._groupDisabled = val;
    this.syncStates();
    this.requestUpdate();
  }

  get effectivelyDisabled(): boolean {
    return this.disabled || this._groupDisabled;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.internals) {
      this.internals.role = 'radio';
    }
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'radio');
    }
    this.addEventListener('click', this.handleHostClick);
    this.addEventListener('keydown', this.handleHostKeyDown);
    this.syncStates();
  }

  override disconnectedCallback(): void {
    this.removeEventListener('click', this.handleHostClick);
    this.removeEventListener('keydown', this.handleHostKeyDown);
    super.disconnectedCallback();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this.syncStates();
  }

  private syncStates(): void {
    const isDisabled = this.effectivelyDisabled;
    this.setCustomState('checked', this.checked);
    this.setCustomState('disabled', isDisabled);

    if (this.internals) {
      this.internals.ariaChecked = this.checked ? 'true' : 'false';
      this.internals.ariaDisabled = isDisabled ? 'true' : null;
    }
  }

  private readonly handleHostClick = (): void => {
    if (this.effectivelyDisabled) return;
    this.emitEvent('mth-radio-select', { detail: { value: this.value } });
  };

  private readonly handleHostKeyDown = (event: KeyboardEvent): void => {
    if (event.key === ' ') {
      event.preventDefault();
      if (!this.effectivelyDisabled) {
        this.emitEvent('mth-radio-select', { detail: { value: this.value } });
      }
    }
  };

  override render() {
    return html`
      <div part="base" class="base">
        <span part="control" class="control" aria-hidden="true">
          <span part="indicator" class="indicator"></span>
        </span>
        <span part="label" class="label">
          <slot>${this.label}</slot>
        </span>
      </div>
    `;
  }
}
