import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { resolveEffectiveDir } from '../../shared/dir.js';
import { presenceBadgeMessages } from './presence-badge.messages.js';
import { presenceBadgeStyles } from './presence-badge.styles.js';

export type MthPresenceStatus = 'online' | 'away' | 'busy' | 'offline';
export type MthPresenceSize = 'sm' | 'md';

const STATUS_VALUES: ReadonlySet<MthPresenceStatus> = new Set([
  'online',
  'away',
  'busy',
  'offline',
]);

/**
 * `<mth-presence-badge>`: user availability status badge with distinct geometric SVG shapes
 * per state (`online` circle, `away` crescent/clock, `busy` bar-in-circle, `offline` ring)
 * so status remains distinguishable in `forced-colors` mode.
 */
export class MthPresenceBadge extends UIElement {
  static override messages = presenceBadgeMessages;
  static override styles = presenceBadgeStyles;

  @property({ type: String, reflect: true })
  status: MthPresenceStatus = 'offline';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'show-label' })
  showLabel = true;

  @property({ type: String, reflect: true })
  size: MthPresenceSize = 'md';

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCustomStates();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('status')) {
      this.syncCustomStates();
    }
  }

  private getNormalizedStatus(): MthPresenceStatus {
    return STATUS_VALUES.has(this.status) ? this.status : 'offline';
  }

  private syncCustomStates(): void {
    const active = this.getNormalizedStatus();
    for (const candidate of STATUS_VALUES) {
      this.setCustomState(candidate, active === candidate);
    }
  }

  private renderShape(status: MthPresenceStatus) {
    switch (status) {
      case 'online':
        return html`
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" fill="currentColor"></circle>
          </svg>
        `;
      case 'away':
        return html`
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M7.5 1.7a4.5 4.5 0 1 0 2.8 8.2A3.7 3.7 0 0 1 7.5 1.7Z"
              fill="currentColor"
            ></path>
          </svg>
        `;
      case 'busy':
        return html`
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" fill="currentColor"></circle>
            <rect x="3" y="5" width="6" height="2" rx="1" fill="var(--_pb-bg, Canvas)"></rect>
          </svg>
        `;
      case 'offline':
        return html`
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="2"></circle>
          </svg>
        `;
    }
  }

  protected override render() {
    const active = this.getNormalizedStatus();
    const resolvedText = this.label || this.t(active);
    const accessibleLabel = `${this.t('statusPrefix')}: ${resolvedText}`;

    return html`
      <span
        class="base"
        part="base"
        dir=${resolveEffectiveDir(this, this.resolvedDir)}
        role="status"
        aria-label=${!this.showLabel ? accessibleLabel : nothing}
      >
        <span class="indicator" part="indicator" data-shape=${active}>
          ${this.renderShape(active)}
        </span>
        ${this.showLabel
          ? html`<span class="label" part="label"><slot>${resolvedText}</slot></span>`
          : nothing}
      </span>
    `;
  }
}
