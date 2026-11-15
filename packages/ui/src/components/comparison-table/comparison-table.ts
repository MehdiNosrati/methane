import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { comparisonTableMessages } from './comparison-table.messages.js';
import { comparisonTableStyles } from './comparison-table.styles.js';

export interface ComparisonPlan {
  readonly id: string;
  readonly name: string;
  readonly price?: string;
  readonly badge?: string;
  readonly highlighted?: boolean;
  readonly actionLabel?: string;
}

export interface ComparisonRow {
  readonly id?: string;
  readonly feature: string;
  readonly description?: string;
  readonly values: ReadonlyArray<boolean | string | number>;
}

/**
 * `<mth-comparison-table>`: semantic plan/feature comparison matrix with
 * `<th scope="col">` plan headers, `<th scope="row">` feature headers, and sticky headers.
 */
export class MthComparisonTable extends UIElement {
  static override shadowRootOptions = { ...UIElement.shadowRootOptions, delegatesFocus: true };
  static override messages = comparisonTableMessages;
  static override styles = comparisonTableStyles;

  @property({ type: String })
  caption = '';

  @property({ type: String })
  label = '';

  @property({ attribute: false })
  plans: ReadonlyArray<ComparisonPlan> = [];

  @property({ attribute: false })
  rows: ReadonlyArray<ComparisonRow> = [];

  @property({ type: Boolean, attribute: 'sticky-header', reflect: true })
  stickyHeader = false;

  @property({ type: Boolean, reflect: true })
  compact = false;

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('stickyHeader')) {
      this.setCustomState('sticky-header', this.stickyHeader);
    }
    if (changedProperties.has('compact')) {
      this.setCustomState('compact', this.compact);
    }
  }

  private handleSelectPlan(plan: ComparisonPlan): void {
    this.emitEvent('mth-select-plan', {
      detail: { id: plan.id, name: plan.name },
    });
  }

  private renderCellValue(value: boolean | string | number | undefined) {
    if (value === true) {
      return html`<span class="bool-yes" aria-label=${this.t('included')}>✓</span>`;
    }
    if (value === false || value === undefined) {
      return html`<span class="bool-no" aria-label=${this.t('notIncluded')}>—</span>`;
    }
    return html`${String(value)}`;
  }

  override render() {
    const tableAriaLabel = this.label || this.caption || this.t('tableLabel');

    return html`
      <div
        part="base"
        class="scroll-region"
        role="region"
        tabindex="0"
        aria-label=${tableAriaLabel}
      >
        <table part="table" aria-label=${this.caption ? nothing : tableAriaLabel}>
          ${this.caption
            ? html`<caption part="caption"><slot name="caption">${this.caption}</slot></caption>`
            : nothing}
          <thead part="head">
            <tr>
              <th scope="col">${this.t('featureColumn')}</th>
              ${this.plans.map(
                (plan) => html`
                  <th
                    part="plan-header"
                    scope="col"
                    data-highlighted=${plan.highlighted ? 'true' : 'false'}
                  >
                    <div class="plan-header-content">
                      ${plan.badge
                        ? html`<span part="badge" class="badge">${plan.badge}</span>`
                        : plan.highlighted
                          ? html`<span part="badge" class="badge">${this.t('recommended')}</span>`
                          : nothing}
                      <span>${plan.name}</span>
                      ${plan.price ? html`<span class="price">${plan.price}</span>` : nothing}
                      ${plan.actionLabel
                        ? html`
                            <button
                              type="button"
                              class="plan-action"
                              @click=${() => this.handleSelectPlan(plan)}
                            >
                              ${plan.actionLabel}
                            </button>
                          `
                        : nothing}
                    </div>
                  </th>
                `,
              )}
            </tr>
          </thead>
          <tbody part="body">
            ${this.rows.map(
              (row) => html`
                <tr>
                  <th part="feature-header" scope="row">
                    <span>${row.feature}</span>
                    ${row.description
                      ? html`<span class="feature-desc">${row.description}</span>`
                      : nothing}
                  </th>
                  ${this.plans.map((plan, idx) => {
                    const cellVal = row.values[idx];
                    return html`
                      <td
                        part="cell"
                        data-highlighted=${plan.highlighted ? 'true' : 'false'}
                      >
                        ${this.renderCellValue(cellVal)}
                      </td>
                    `;
                  })}
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
      <div class="footer">
        <slot name="footer"></slot>
      </div>
    `;
  }
}
