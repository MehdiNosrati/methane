import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { tabPanelMessages } from './tab-panel.messages.js';
import { tabPanelStyles } from './tab-panel.styles.js';

/**
 * `<mth-tab-panel>`: associated tab panel controlled by `<mth-tabs>`.
 */
export class MthTabPanel extends UIElement {
  static override messages = tabPanelMessages;
  static override styles = tabPanelStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: Boolean, reflect: true })
  active = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.internals) {
      this.internals.role = 'tabpanel';
    }
    this.syncStates();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncStates();
  }

  private syncStates(): void {
    this.setCustomState('active', this.active);
    if (this.internals) {
      this.internals.ariaHidden = this.active ? null : 'true';
    }
  }

  override render() {
    return html`<div part="base"><slot></slot></div>`;
  }
}
