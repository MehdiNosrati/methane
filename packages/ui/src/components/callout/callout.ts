import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { calloutMessages } from './callout.messages.js';
import { calloutStyles } from './callout.styles.js';

export type CalloutVariant = 'info' | 'note' | 'tip' | 'warning' | 'danger';

/**
 * `<mth-callout>`: editorial/documentation callout block with semantic variants
 * and optional collapsible body.
 */
export class MthCallout extends UIElement {
  static override messages = calloutMessages;
  static override styles = calloutStyles;

  @property({ type: String, reflect: true })
  variant: CalloutVariant = 'note';

  @property({ type: String })
  heading = '';

  @property({ type: Boolean, reflect: true })
  collapsible = false;

  @property({ type: Boolean, reflect: true })
  open = true;

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('open')) {
      this.setCustomState('collapsed', !this.open);
    }
  }

  public toggle(): void {
    if (!this.collapsible) {
      return;
    }
    this.open = !this.open;
    this.setCustomState('collapsed', !this.open);
    this.emitEvent('mth-toggle', { detail: { open: this.open } });
  }

  private resolveDefaultHeading(): string {
    switch (this.variant) {
      case 'tip':
        return this.t('tipLabel');
      case 'info':
        return this.t('infoLabel');
      case 'warning':
        return this.t('warningLabel');
      case 'danger':
        return this.t('dangerLabel');
      default:
        return this.t('noteLabel');
    }
  }

  protected override render() {
    const resolvedHeading = this.heading || this.resolveDefaultHeading();
    const isExpanded = !this.collapsible || this.open;

    return html`
      <aside class="base" part="base" role="note" aria-label=${resolvedHeading}>
        <header class="header" part="header">
          <div class="title-wrap">
            <span class="icon" part="icon"><slot name="icon"></slot></span>
            <h3 class="heading" part="heading">${resolvedHeading}</h3>
          </div>
          ${this.collapsible
            ? html`
                <button
                  type="button"
                  class="toggle-btn"
                  part="toggle-button"
                  aria-label=${this.t('toggleLabel')}
                  aria-expanded=${String(this.open)}
                  @click=${() => this.toggle()}
                >
                  ${this.open ? '▾' : '▸'}
                </button>
              `
            : nothing}
        </header>
        <div class="body" part="body" ?hidden=${!isExpanded}>
          <slot></slot>
        </div>
        <div class="actions" part="actions">
          <slot name="actions"></slot>
        </div>
      </aside>
    `;
  }
}
