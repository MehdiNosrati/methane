import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { optionStyles } from './option.styles.js';

/**
 * `<mth-option>` — Declarative option item for `<mth-combobox>`.
 */
export class MthOption extends UIElement {
  static override styles = optionStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String, reflect: true })
  label = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  selected = false;

  @property({ type: Boolean, reflect: true })
  active = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.internals) {
      this.internals.role = 'option';
    }
    this.syncStates();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncStates();
  }

  /**
   * Returns the display label resolved from `label` property or text content.
   */
  getResolvedLabel(): string {
    if (this.label.trim().length > 0) {
      return this.label.trim();
    }
    return this.textContent?.trim() ?? '';
  }

  private syncStates(): void {
    this.setCustomState('selected', this.selected);
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('active', this.active);

    if (this.internals) {
      this.internals.ariaSelected = this.selected ? 'true' : 'false';
      this.internals.ariaDisabled = this.disabled ? 'true' : null;
    }
  }

  override render() {
    return html`
      <div part="base">
        <span part="check" aria-hidden="true">${this.selected ? '✓' : nothing}</span>
        <slot name="prefix"></slot>
        <span part="label"><slot>${this.label}</slot></span>
        <slot name="suffix"></slot>
      </div>
    `;
  }
}
