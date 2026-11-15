import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { optionGroupStyles } from './option-group.styles.js';

/**
 * `<mth-option-group>` — Semantic group wrapper for `<mth-option>` items.
 */
export class MthOptionGroup extends UIElement {
  static override styles = optionGroupStyles;

  @property({ type: String, reflect: true })
  label = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.internals) {
      this.internals.role = 'group';
    }
    this.syncStates();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncStates();
  }

  private syncStates(): void {
    this.setCustomState('disabled', this.disabled);
    if (this.internals) {
      this.internals.ariaLabel = this.label || null;
      this.internals.ariaDisabled = this.disabled ? 'true' : null;
    }
  }

  override render() {
    return html`
      <div part="base">
        <div part="label" id="group-label">
          <slot name="label">${this.label}</slot>
        </div>
        <div part="options">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
