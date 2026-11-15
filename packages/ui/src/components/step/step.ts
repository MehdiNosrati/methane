import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { stepMessages } from './step.messages.js';
import type { StepStatus } from './step.spec.js';
import { stepStyles } from './step.styles.js';

export type { StepStatus };

/**
 * `<mth-step>`: Declarative step metadata and content child element for `<mth-stepper>`.
 */
export class MthStep extends UIElement {
  static override messages = stepMessages;
  static override styles = [stepStyles];

  @property({ type: String })
  value = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  description = '';

  @property({ type: String, reflect: true })
  status: StepStatus = 'upcoming';

  @property({ type: Number, attribute: 'step-number' })
  stepNumber = 0;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  protected override onFirstConnect(): void {
    this.syncCustomStates();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('status') || changed.has('disabled')) {
      this.syncCustomStates();
    }
  }

  private syncCustomStates(): void {
    this.setCustomState('complete', this.status === 'complete');
    this.setCustomState('current', this.status === 'current');
    this.setCustomState('error', this.status === 'error');
    this.setCustomState('disabled', this.disabled);
  }

  private renderIndicatorText(): string {
    if (this.status === 'complete') return '✓';
    if (this.status === 'error') return '!';
    return this.stepNumber > 0 ? String(this.stepNumber) : '•';
  }

  private getStatusAnnouncement(): string {
    if (this.status === 'complete') return this.t('completeLabel');
    if (this.status === 'current') return this.t('currentLabel');
    if (this.status === 'error') return this.t('errorLabel');
    return this.t('upcomingLabel');
  }

  protected override render() {
    const ariaLabel = this.label ? `${this.label} — ${this.getStatusAnnouncement()}` : this.getStatusAnnouncement();

    return html`
      <div part="base" role="group" aria-label=${ariaLabel}>
        <span part="indicator" aria-hidden="true">${this.renderIndicatorText()}</span>
        <div part="body">
          ${this.label ? html`<div part="label">${this.label}</div>` : nothing}
          ${this.description ? html`<div part="description">${this.description}</div>` : nothing}
          <div part="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}
