import { UIElement, type PropertyValues } from '@methane/core';
import { RovingFocusController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, queryAll } from 'lit/decorators.js';
import { checkoutStepsMessages } from './checkout-steps.messages.js';
import { checkoutStepsStyles } from './checkout-steps.styles.js';

export interface CheckoutStep {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly completed?: boolean;
  readonly error?: string;
  readonly disabled?: boolean;
}

/**
 * `<mth-checkout-steps>`: multi-step checkout coordinator using `RovingFocusController`
 * (`horizontal` / `vertical`, RTL-aware) with linear progression locking.
 */
export class MthCheckoutSteps extends UIElement {
  static override messages = checkoutStepsMessages;
  static override styles = checkoutStepsStyles;

  @property({ attribute: false })
  steps: ReadonlyArray<CheckoutStep> = [];

  @property({ type: String, attribute: 'active-step' })
  activeStep = '';

  @property({ type: String })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ type: Boolean })
  linear = true;

  @property({ type: String })
  label = '';

  @queryAll('.step-btn')
  private stepButtons!: NodeListOf<HTMLButtonElement>;

  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      dir: 'auto',
      loop: false,
      getItems: () => Array.from(this.stepButtons ?? []),
    });
  }

  private get effectiveActiveId(): string {
    if (this.activeStep) return this.activeStep;
    return this.steps[0]?.id ?? '';
  }

  private isStepLocked(index: number): boolean {
    const step = this.steps[index];
    if (!step) return true;
    if (step.disabled) return true;
    if (!this.linear) return false;
    const activeIdx = this.steps.findIndex((s) => s.id === this.effectiveActiveId);
    if (index <= activeIdx) return false;
    for (let i = 0; i < index; i++) {
      if (!this.steps[i]?.completed) return true;
    }
    return false;
  }

  selectStep(stepId: string): boolean {
    const idx = this.steps.findIndex((s) => s.id === stepId);
    if (idx < 0 || this.isStepLocked(idx)) return false;
    this.activeStep = stepId;
    this.rovingCtrl.setActiveIndex(idx, false);
    this.emitEvent('mth-step-change', { detail: { stepId, index: idx } });
    return true;
  }

  completeStep(stepId: string): void {
    this.steps = this.steps.map((s) => (s.id === stepId ? { ...s, completed: true } : s));
    this.emitEvent('mth-step-complete', { detail: { stepId } });
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('orientation')) {
      this.rovingCtrl.updateOptions({
        orientation: this.orientation === 'vertical' ? 'vertical' : 'horizontal',
      });
    }
    this.setCustomState('vertical', this.orientation === 'vertical');
    this.setCustomState('linear', this.linear);
  }

  protected override render() {
    const activeId = this.effectiveActiveId;
    const list = this.steps ?? [];

    return html`
      <nav part="base" dir=${this.resolvedDir} aria-label=${this.label || this.t('navLabel')}>
        <ol class="list" data-orientation=${this.orientation === 'vertical' ? 'vertical' : 'horizontal'}>
          ${list.map((step, idx) => {
            const isActive = step.id === activeId;
            const locked = this.isStepLocked(idx);
            return html`
              <li class="step" part="step">
                <button
                  type="button"
                  class="step-btn"
                  part="step-button"
                  tabindex=${isActive || (idx === 0 && !activeId) ? '0' : '-1'}
                  aria-current=${isActive ? 'step' : 'false'}
                  data-completed=${step.completed ? 'true' : 'false'}
                  ?disabled=${locked}
                  @click=${() => {
                    this.selectStep(step.id);
                  }}
                >
                  <span class="indicator" part="indicator" aria-hidden="true">
                    ${step.completed ? '✓' : idx + 1}
                  </span>
                  <span class="text">
                    <span class="label" part="label">${step.label}</span>
                    ${step.description ? html`<span class="desc">${step.description}</span>` : nothing}
                    ${step.error
                      ? html`<span class="error">${this.t('errorPrefix')} ${step.error}</span>`
                      : nothing}
                  </span>
                </button>
              </li>
            `;
          })}
        </ol>
      </nav>
    `;
  }
}
