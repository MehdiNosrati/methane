import { UIElement, type PropertyValues } from '@methane/core';
import { FormattingUtils } from '@methane/primitives';
import { html, nothing, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import { statCardMessages } from './stat-card.messages.js';
import { statCardStyles } from './stat-card.styles.js';

export type MthStatCardTrend = 'neutral' | 'up' | 'down';
export type MthStatCardFormat = 'none' | 'number' | 'compact' | 'currency' | 'percent';
export type MthStatCardVariant = 'elevated' | 'outlined' | 'subtle';

/**
 * `<mth-stat-card>`: KPI metric summary card with `FormattingUtils` formatting,
 * semantic trend indicator, and optional sparkline/footer slots.
 */
export class MthStatCard extends UIElement {
  static override messages = statCardMessages;
  static override styles = statCardStyles;

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  format: MthStatCardFormat = 'none';

  @property({ type: String })
  currency = 'USD';

  @property({ type: String })
  delta = '';

  @property({ type: String, reflect: true })
  trend: MthStatCardTrend = 'neutral';

  @property({ type: String })
  hint = '';

  @property({ type: String, reflect: true })
  variant: MthStatCardVariant = 'elevated';

  @state()
  private hasDeltaSlot = false;

  @state()
  private hasSparklineSlot = false;

  @state()
  private hasFooterSlot = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncTrendStates();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('trend')) {
      this.syncTrendStates();
    }
  }

  private syncTrendStates(): void {
    this.setCustomState('trend-up', this.trend === 'up');
    this.setCustomState('trend-down', this.trend === 'down');
    this.setCustomState('trend-neutral', this.trend === 'neutral');
  }

  private formatDisplayValue(): string {
    if (this.format === 'none') return this.value;
    const numeric = Number(this.value);
    if (!Number.isFinite(numeric) || this.value.trim() === '') {
      return this.value;
    }
    const locale = this.resolvedLocale || 'en';
    switch (this.format) {
      case 'number':
        return FormattingUtils.formatNumber(numeric, locale);
      case 'compact':
        return FormattingUtils.formatCompactNumber(numeric, locale);
      case 'currency':
        return FormattingUtils.formatCurrency(numeric, this.currency || 'USD', locale);
      case 'percent':
        return FormattingUtils.formatPercent(numeric, locale);
      default:
        return this.value;
    }
  }

  private handlePresence(section: 'delta' | 'sparkline' | 'footer', event: Event): void {
    const slot = event.target as HTMLSlotElement;
    const present = slot
      .assignedNodes({ flatten: true })
      .some((n) => n.nodeType === Node.ELEMENT_NODE || (n.textContent?.trim().length ?? 0) > 0);
    if (section === 'delta') this.hasDeltaSlot = present;
    else if (section === 'sparkline') this.hasSparklineSlot = present;
    else this.hasFooterSlot = present;
  }

  private renderTrendIcon() {
    if (this.trend === 'up') {
      return svg`<svg class="trend-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 11L13 5M8 5h5v5"></path>
      </svg>`;
    }
    if (this.trend === 'down') {
      return svg`<svg class="trend-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 5l10 6M8 11h5V6"></path>
      </svg>`;
    }
    return nothing;
  }

  override render() {
    const displayValue = this.formatDisplayValue();
    const showTrend = this.delta.trim().length > 0 || this.hasDeltaSlot;
    const trendSrLabel =
      this.trend === 'up'
        ? this.t('trendUp')
        : this.trend === 'down'
          ? this.t('trendDown')
          : this.t('trendNeutral');

    return html`
      <section
        part="base"
        class="base"
        data-variant=${this.variant}
        aria-labelledby="mth-stat-label"
      >
        <div part="header" class="header">
          <div id="mth-stat-label" part="label" class="label">
            <slot name="label">${this.label || this.t('statLabel')}</slot>
          </div>
          <div part="icon" class="icon">
            <slot name="icon"></slot>
          </div>
        </div>
        <div class="main-row">
          <div part="value" class="value">
            <slot>${displayValue}</slot>
          </div>
          <div
            part="trend"
            class="trend"
            data-trend=${this.trend}
            ?hidden=${!showTrend}
          >
            ${this.renderTrendIcon()}
            <span class="sr-only">${trendSrLabel}:</span>
            <slot name="delta" @slotchange=${(e: Event) => this.handlePresence('delta', e)}>
              ${this.delta}
            </slot>
          </div>
        </div>
        <div part="sparkline" class="sparkline" ?hidden=${!this.hasSparklineSlot}>
          <slot
            name="sparkline"
            @slotchange=${(e: Event) => this.handlePresence('sparkline', e)}
          ></slot>
        </div>
        <div part="hint" class="hint" ?hidden=${this.hint.trim().length === 0}>
          ${this.hint}
        </div>
        <div part="footer" class="footer" ?hidden=${!this.hasFooterSlot}>
          <slot name="footer" @slotchange=${(e: Event) => this.handlePresence('footer', e)}></slot>
        </div>
      </section>
    `;
  }
}
