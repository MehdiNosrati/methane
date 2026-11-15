import { UIElement, type PropertyValues } from '@methane-ui/core';
import { SelectionController, SlotCollectionController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { formWizardMessages } from './form-wizard.messages.js';
import { formWizardStyles } from './form-wizard.styles.js';

export type StepValidator = (stepIndex: number, stepElement: HTMLElement) => boolean | Promise<boolean>;

interface ValidatableControlElement extends HTMLElement {
  checkValidity?: () => boolean;
  reportValidity?: () => boolean;
  disabled?: boolean;
}

/**
 * `<mth-form-wizard>`: multi-step wizard managing Light-DOM step panels via
 * `SelectionController` and `SlotCollectionController` with validation gating.
 */
export class MthFormWizard extends UIElement {
  static override messages = formWizardMessages;
  static override styles = formWizardStyles;

  @property({ type: Number, attribute: 'active-step', reflect: true })
  activeStep = 0;

  @property({ type: String, reflect: true })
  step = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  linear = true;

  @property({ type: Boolean, attribute: 'validate-on-next', reflect: true })
  validateOnNext = true;

  @property({ type: String, attribute: 'back-label' })
  backLabel = '';

  @property({ type: String, attribute: 'next-label' })
  nextLabel = '';

  @property({ type: String, attribute: 'submit-label' })
  submitLabel = '';

  @property({ attribute: false })
  validateStep: StepValidator | undefined = undefined;

  @state()
  private highestReachedStep = 0;

  @state()
  private stepError = '';

  private readonly slotCollection: SlotCollectionController<HTMLElement>;
  private readonly selection: SelectionController;

  constructor() {
    super();
    this.selection = new SelectionController(this, {
      mode: 'single',
      allowEmpty: false,
      onChange: (selected) => {
        const nextId = selected[0] ?? '';
        if (this.step !== nextId) {
          this.step = nextId;
        }
      },
    });

    this.slotCollection = new SlotCollectionController<HTMLElement>(this, {
      filter: (el): el is HTMLElement => el instanceof HTMLElement && !el.hasAttribute('slot'),
      attributeFilter: ['data-step', 'data-title', 'disabled'],
      onItemsChange: (items) => {
        this.reconcileSteps(items);
      },
    });
  }

  get stepCount(): number {
    return this.slotCollection.items.length;
  }

  override connectedCallback(): void {
    super.connectedCallback();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    const items = this.slotCollection.items;
    if (items.length === 0) return;

    if (changedProperties.has('step') && this.step.length > 0) {
      const idx = items.findIndex((el, i) => this.resolveStepId(el, i) === this.step);
      if (idx !== -1 && idx !== this.activeStep) {
        this.activeStep = idx;
      }
    }

    const clamped = Math.max(0, Math.min(this.activeStep, items.length - 1));
    if (clamped !== this.activeStep) {
      this.activeStep = clamped;
    }
    if (clamped > this.highestReachedStep) {
      this.highestReachedStep = clamped;
    }
    const currentId = this.resolveStepId(items[clamped]!, clamped);
    if (this.step !== currentId) {
      this.step = currentId;
    }
    this.selection.select(currentId);
  }

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    const defaultSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (defaultSlot) {
      this.slotCollection.attachSlot(defaultSlot);
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this.syncStepPanelsVisibility();
  }

  async next(): Promise<boolean> {
    const items = this.slotCollection.items;
    if (items.length === 0) return false;
    const valid = await this.validateCurrentStep();
    if (!valid) {
      this.stepError = this.t('stepInvalid');
      return false;
    }
    this.stepError = '';

    if (this.activeStep >= items.length - 1) {
      this.setCustomState('completed', true);
      this.emitEvent('mth-complete', { detail: { steps: items.length } });
      return true;
    }
    return this.goTo(this.activeStep + 1, false);
  }

  previous(): boolean {
    if (this.activeStep <= 0) return false;
    this.stepError = '';
    return this.transitionTo(this.activeStep - 1);
  }

  async goTo(index: number, runValidation = true): Promise<boolean> {
    const items = this.slotCollection.items;
    if (index < 0 || index >= items.length || index === this.activeStep) return false;
    if (this.linear && index > this.highestReachedStep + 1) {
      return false;
    }
    if (runValidation && index > this.activeStep) {
      const valid = await this.validateCurrentStep();
      if (!valid) {
        this.stepError = this.t('stepInvalid');
        return false;
      }
    }
    this.stepError = '';
    return this.transitionTo(index);
  }

  private transitionTo(nextIndex: number): boolean {
    const items = this.slotCollection.items;
    const target = items[nextIndex];
    if (!target) return false;
    const previousIndex = this.activeStep;
    const stepId = this.resolveStepId(target, nextIndex);
    const allowed = this.emitEvent('mth-step-change', {
      cancelable: true,
      detail: { index: nextIndex, previousIndex, step: stepId },
    });
    if (!allowed) return false;
    this.activeStep = nextIndex;
    this.step = stepId;
    if (nextIndex > this.highestReachedStep) {
      this.highestReachedStep = nextIndex;
    }
    this.selection.select(stepId);
    return true;
  }

  private async validateCurrentStep(): Promise<boolean> {
    if (!this.validateOnNext) return true;
    const items = this.slotCollection.items;
    const panel = items[this.activeStep];
    if (!panel) return true;

    const controls = Array.from(
      panel.querySelectorAll<ValidatableControlElement>('*'),
    );
    let allValid = true;
    for (const ctrl of controls) {
      if (ctrl.disabled) continue;
      if (typeof ctrl.checkValidity === 'function' && !ctrl.checkValidity()) {
        ctrl.reportValidity?.();
        allValid = false;
      }
    }
    if (!allValid) return false;
    if (this.validateStep) {
      return Boolean(await this.validateStep(this.activeStep, panel));
    }
    return true;
  }

  private resolveStepId(el: HTMLElement, index: number): string {
    return el.getAttribute('data-step') || el.id || `step-${index + 1}`;
  }

  private resolveStepTitle(el: HTMLElement, index: number): string {
    return (
      el.getAttribute('data-title') ||
      el.getAttribute('title') ||
      this.t('stepDefaultTitle', { index: index + 1 })
    );
  }

  private reconcileSteps(items: ReadonlyArray<HTMLElement>): void {
    const selItems = items.map((el, i) => ({
      value: this.resolveStepId(el, i),
      disabled: el.hasAttribute('disabled'),
    }));
    this.selection.setItems(selItems);
    if (items.length > 0) {
      const clamped = Math.max(0, Math.min(this.activeStep, items.length - 1));
      const activeId = this.resolveStepId(items[clamped]!, clamped);
      this.selection.select(activeId);
    }
    this.syncStepPanelsVisibility();
  }

  private syncStepPanelsVisibility(): void {
    const items = this.slotCollection.items;
    for (let i = 0; i < items.length; i += 1) {
      const el = items[i]!;
      const isActive = i === this.activeStep;
      if (el.hidden !== !isActive) {
        el.hidden = !isActive;
      }
    }
  }

  override render() {
    const items = this.slotCollection.items;
    const total = items.length;
    const active = Math.max(0, Math.min(this.activeStep, Math.max(0, total - 1)));
    const isFirst = active <= 0;
    const isLast = total === 0 || active >= total - 1;

    return html`
      <section part="base" class="base" aria-label=${this.label || this.t('defaultLabel')}>
        <ol part="steps" class="steps" aria-label=${this.t('stepIndicator', { current: active + 1, total })}>
          ${items.map((el, idx) => {
            const title = this.resolveStepTitle(el, idx);
            const isCurrent = idx === active;
            const locked = this.linear && idx > this.highestReachedStep + 1;
            return html`
              <li>
                <button
                  type="button"
                  part="step"
                  class="step-btn"
                  aria-current=${isCurrent ? 'step' : nothing}
                  ?disabled=${locked || el.hasAttribute('disabled')}
                  @click=${() => void this.goTo(idx)}
                >
                  ${this.t('stepTabLabel', { index: idx + 1, title })}
                </button>
              </li>
            `;
          })}
        </ol>

        <div part="panel" class="panel">
          <slot></slot>
        </div>

        <p part="error" class="error" role=${this.stepError ? 'alert' : nothing} ?hidden=${!this.stepError}>
          ${this.stepError}
        </p>

        <div part="actions" class="actions">
          <slot name="actions"></slot>
          <div class="actions-nav">
            <button
              type="button"
              part="back"
              class="nav-btn"
              ?disabled=${isFirst}
              @click=${() => this.previous()}
            >
              ${this.backLabel || this.t('backLabel')}
            </button>
            <button
              type="button"
              part="next"
              class="nav-btn nav-btn-primary"
              @click=${() => void this.next()}
            >
              ${isLast ? this.submitLabel || this.t('submitLabel') : this.nextLabel || this.t('nextLabel')}
            </button>
          </div>
        </div>
      </section>
    `;
  }
}
