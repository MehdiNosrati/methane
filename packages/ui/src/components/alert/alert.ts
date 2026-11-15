import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import { alertMessages } from './alert.messages.js';
import { alertStyles } from './alert.styles.js';

export type MthAlertVariant = 'info' | 'success' | 'warning' | 'danger';

/**
 * `<mth-alert>`: inline notification banner with semantic live-region roles,
 * variant icon, slotted title/actions, and cancelable `mth-close`.
 */
export class MthAlert extends UIElement {
  static override messages = alertMessages;
  static override styles = alertStyles;

  @property({ type: String, reflect: true })
  variant: MthAlertVariant = 'info';

  @property({ type: String })
  override title = '';

  @property({ type: Boolean, reflect: true })
  closable = false;

  @property({ type: Boolean, reflect: true })
  open = true;

  @state()
  private hasSlottedTitle = false;

  @state()
  private hasSlottedActions = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('open', this.open);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('open')) {
      this.setCustomState('open', this.open);
    }
  }

  /**
   * Requests closing the alert; dispatches cancelable `mth-close` and sets `open = false` unless prevented.
   */
  close(reason = 'programmatic'): boolean {
    if (!this.open) return false;
    const allowed = this.emitEvent('mth-close', {
      cancelable: true,
      detail: { reason },
    });
    if (!allowed) return false;
    this.open = false;
    return true;
  }

  private readonly handleCloseClick = (): void => {
    this.close('close-button');
  };

  private readonly handleTitleSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.hasSlottedTitle = slot
      .assignedNodes({ flatten: true })
      .some((node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent?.trim().length ?? 0) > 0);
  };

  private readonly handleActionsSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.hasSlottedActions = slot.assignedElements({ flatten: true }).length > 0;
  };

  private renderVariantIcon() {
    switch (this.variant) {
      case 'success':
        return svg`<svg class="icon-svg" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8"></circle>
          <path d="M6.5 10.2l2.3 2.3 4.7-4.8"></path>
        </svg>`;
      case 'warning':
        return svg`<svg class="icon-svg" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 3L2.5 16.5h15L10 3z"></path>
          <path d="M10 8v4"></path>
          <circle cx="10" cy="14.5" r="0.6"></circle>
        </svg>`;
      case 'danger':
        return svg`<svg class="icon-svg" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8"></circle>
          <path d="M7.5 7.5l5 5"></path>
          <path d="M12.5 7.5l-5 5"></path>
        </svg>`;
      case 'info':
      default:
        return svg`<svg class="icon-svg" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8"></circle>
          <path d="M10 9v5"></path>
          <circle cx="10" cy="6.2" r="0.6"></circle>
        </svg>`;
    }
  }

  override render() {
    const semanticRole = this.variant === 'warning' || this.variant === 'danger' ? 'alert' : 'status';
    const hasTitle = this.title.length > 0 || this.hasSlottedTitle;

    return html`
      <div
        part="base"
        class="base"
        role=${semanticRole}
        data-variant=${this.variant}
        ?hidden=${!this.open}
      >
        <span part="icon" class="icon">
          <slot name="icon">${this.renderVariantIcon()}</slot>
        </span>
        <div part="content" class="content">
          <div part="title" class="title" ?hidden=${!hasTitle}>
            <slot name="title" @slotchange=${this.handleTitleSlotChange}>${this.title}</slot>
          </div>
          <div part="message" class="message">
            <slot></slot>
          </div>
          <div part="actions" class="actions" ?hidden=${!this.hasSlottedActions}>
            <slot name="actions" @slotchange=${this.handleActionsSlotChange}></slot>
          </div>
        </div>
        ${this.closable
          ? html`
              <button
                type="button"
                part="close-button"
                class="close-btn"
                aria-label=${this.t('close')}
                @click=${this.handleCloseClick}
              >
                <svg class="icon-svg" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M6 6l8 8"></path>
                  <path d="M14 6l-8 8"></path>
                </svg>
              </button>
            `
          : nothing}
      </div>
    `;
  }
}
