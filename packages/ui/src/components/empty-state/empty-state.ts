import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing, svg } from 'lit';
import { property } from 'lit/decorators.js';
import { emptyStateMessages } from './empty-state.messages.js';
import { emptyStateStyles } from './empty-state.styles.js';

export type MthEmptyStateVariant = 'default' | 'compact' | 'card';
export type MthEmptyStateTone = 'neutral' | 'info' | 'warning' | 'danger';
export type MthEmptyStateAlign = 'center' | 'start';
export type MthEmptyStateRoleMode = 'region' | 'status' | 'none';

/**
 * `<mth-empty-state>`: semantic empty, no-results, or recovery placeholder surface.
 */
export class MthEmptyState extends UIElement {
  static override messages = emptyStateMessages;
  static override styles = emptyStateStyles;

  @property({ type: String })
  heading = '';

  @property({ type: String })
  description = '';

  @property({ type: String, reflect: true })
  variant: MthEmptyStateVariant = 'default';

  @property({ type: String, reflect: true })
  tone: MthEmptyStateTone = 'neutral';

  @property({ type: String, reflect: true })
  align: MthEmptyStateAlign = 'center';

  @property({ type: String, attribute: 'role-mode', reflect: true })
  roleMode: MthEmptyStateRoleMode = 'region';

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('variant')) {
      this.setCustomState('compact', this.variant === 'compact');
    }
    if (changedProperties.has('tone')) {
      this.setCustomState('tone', this.tone !== 'neutral');
    }
  }

  private renderDefaultIcon() {
    return svg`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5" />
        <path d="M4 10h16" stroke="currentColor" stroke-width="1.5" />
      </svg>
    `;
  }

  override render() {
    const resolvedRole = this.roleMode === 'none' ? nothing : this.roleMode;
    const resolvedLabel =
      this.roleMode === 'none' ? nothing : this.heading || this.t('emptyLabel');

    return html`
      <div part="base" class="base" role=${resolvedRole} aria-label=${resolvedLabel}>
        <div part="icon" class="icon">
          <slot name="icon">${this.renderDefaultIcon()}</slot>
        </div>
        <h3 part="title" class="title">
          <slot name="title">${this.heading}</slot>
        </h3>
        <div part="description" class="description">
          <slot>${this.description}</slot>
        </div>
        <div part="actions" class="actions">
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }
}
