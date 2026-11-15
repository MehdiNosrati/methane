import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { tabMessages } from './tab.messages.js';
import { tabStyles } from './tab.styles.js';

/**
 * `<mth-tab>`: selectable tab trigger inside `<mth-tabs>`.
 */
export class MthTab extends UIElement {
  static override messages = tabMessages;
  static override styles = tabStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: Boolean, reflect: true })
  selected = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.internals) {
      this.internals.role = 'tab';
    }
    const reflectedRole = (this as HTMLElement & { role?: string | null }).role;
    if (reflectedRole !== 'tab' && !this.hasAttribute('role')) {
      this.setAttribute('role', 'tab');
    }
    this.syncStates();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncStates();
  }

  private syncStates(): void {
    this.setCustomState('selected', this.selected);
    this.setCustomState('disabled', this.disabled);
    if (this.internals) {
      this.internals.ariaSelected = this.selected ? 'true' : 'false';
      this.internals.ariaDisabled = this.disabled ? 'true' : null;
    }
  }

  override render() {
    return html`
      <span part="base">
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
      </span>
    `;
  }
}
