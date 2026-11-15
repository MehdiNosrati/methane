import { UIElement, type PropertyValues } from '@methane-ui/core';
import { RovingFocusController, SlotCollectionController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { stepperMessages } from './stepper.messages.js';
import type {
  StepperOrientation,
  StepperStatus,
  StepperStepItem,
} from './stepper.spec.js';
import { stepperStyles } from './stepper.styles.js';

export type { StepperOrientation, StepperStatus, StepperStepItem };

const EMPTY_STEPPER_STEPS: ReadonlyArray<StepperStepItem> = Object.freeze([]);

interface StepElementLike extends HTMLElement {
  value?: string;
  label?: string;
  description?: string;
  status?: StepperStatus;
  disabled?: boolean;
}

/**
 * `<mth-stepper>`: Multi-step navigation landmark supporting declarative `<mth-step>` children
 * or `.steps` data, linear step enforcement, and horizontal/vertical roving focus.
 */
export class MthStepper extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = stepperMessages;
  static override styles = [stepperStyles];

  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  orientation: StepperOrientation = 'horizontal';

  @property({ type: Boolean, reflect: true })
  linear = false;

  @property({ type: Number, attribute: 'active-step' })
  activeStep = 0;

  @property({ type: String })
  value = '';

  @property({ attribute: false })
  steps: ReadonlyArray<StepperStepItem> = EMPTY_STEPPER_STEPS;

  private readonly rovingCtrl: RovingFocusController;
  private readonly slotCtrl: SlotCollectionController<StepElementLike>;

  constructor() {
    super();

    this.rovingCtrl = new RovingFocusController(this, {
      orientation: this.orientation,
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="trigger"]') ?? []),
    });

    this.slotCtrl = new SlotCollectionController<StepElementLike>(this, {
      filter: (el): el is StepElementLike =>
        el instanceof HTMLElement &&
        (el.tagName.toLowerCase().endsWith('-step') || 'stepNumber' in el),
      attributeFilter: ['value', 'label', 'description', 'status', 'disabled'],
    });
  }

  getResolvedSteps(): ReadonlyArray<StepperStepItem> {
    if (this.steps.length > 0) {
      return this.steps;
    }
    const slotted =
      this.slotCtrl.items.length > 0
        ? this.slotCtrl.items
        : Array.from(this.children ?? []).filter(
            (el): el is StepElementLike =>
              el instanceof HTMLElement &&
              (el.tagName.toLowerCase().endsWith('-step') || 'stepNumber' in el),
          );

    return slotted.map((el, idx) => {
      const value = el.value ?? el.getAttribute('value') ?? String(idx);
      const label = el.label ?? el.getAttribute('label') ?? `${this.t('stepFallback')} ${idx + 1}`;
      const description = el.description ?? el.getAttribute('description') ?? undefined;
      const rawStatus = el.status ?? (el.getAttribute('status') as StepperStatus | null) ?? undefined;
      const disabled = Boolean(el.disabled || el.hasAttribute('disabled'));
      return {
        value,
        label,
        ...(description ? { description } : {}),
        ...(rawStatus ? { status: rawStatus } : {}),
        disabled,
      };
    });
  }

  selectStep(index: number): boolean {
    const resolved = this.getResolvedSteps();
    const target = resolved[index];
    if (!target || target.disabled || this.isStepBlocked(index, resolved)) {
      return false;
    }
    this.activeStep = index;
    this.value = target.value;
    this.rovingCtrl.setActiveIndex(index);
    this.emitEvent('mth-change', {
      detail: { index, value: target.value },
    });
    return true;
  }

  protected override onFirstConnect(): void {
    this.setCustomState('linear', this.linear);
    this.syncValueFromActiveStep();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.rovingCtrl.updateOptions({
      orientation: this.orientation,
      dir: this.closest('[dir]') ? 'auto' : this.resolvedDir,
    });
    if (changed.has('linear')) {
      this.setCustomState('linear', this.linear);
    }
    if (changed.has('value') && this.value) {
      const idx = this.getResolvedSteps().findIndex((s) => s.value === this.value);
      if (idx !== -1 && idx !== this.activeStep) {
        this.activeStep = idx;
      }
    } else if (changed.has('activeStep') || changed.has('steps')) {
      this.syncValueFromActiveStep();
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('steps') || changed.has('orientation') || changed.has('activeStep')) {
      this.rovingCtrl.syncTabIndices();
    }
  }

  private syncValueFromActiveStep(): void {
    const resolved = this.getResolvedSteps();
    const entry = resolved[this.activeStep];
    if (entry && !this.value) {
      this.value = entry.value;
    }
  }

  private resolveStepStatus(step: StepperStepItem, idx: number): StepperStatus {
    if (step.status) return step.status;
    if (idx === this.activeStep) return 'current';
    if (idx < this.activeStep) return 'complete';
    return 'upcoming';
  }

  private isStepBlocked(idx: number, resolved: ReadonlyArray<StepperStepItem>): boolean {
    if (!this.linear) return false;
    if (idx <= this.activeStep + 1) return false;
    for (let i = 0; i < idx; i += 1) {
      const prior = resolved[i];
      if (!prior) continue;
      if (this.resolveStepStatus(prior, i) !== 'complete') {
        return true;
      }
    }
    return false;
  }

  private renderIndicator(status: StepperStatus, idx: number): string {
    if (status === 'complete') return '✓';
    if (status === 'error') return '!';
    return String(idx + 1);
  }

  protected override render() {
    const resolved = this.getResolvedSteps();
    const navLabel = this.label.trim() || this.t('navLabel');

    return html`
      <nav part="nav" aria-label=${navLabel}>
        <ol part="list">
          ${resolved.map((step, idx) => {
            const status = this.resolveStepStatus(step, idx);
            const blocked = this.isStepBlocked(idx, resolved);
            const disabled = Boolean(step.disabled || blocked);
            const isCurrent = idx === this.activeStep;

            return html`
              <li part="item">
                <button
                  part="trigger"
                  type="button"
                  data-value=${step.value}
                  data-index=${String(idx)}
                  data-status=${status}
                  aria-current=${isCurrent ? 'step' : nothing}
                  aria-disabled=${disabled ? 'true' : nothing}
                  @click=${() => {
                    this.selectStep(idx);
                  }}
                >
                  <span part="indicator" aria-hidden="true">${this.renderIndicator(status, idx)}</span>
                  <span>
                    <span part="label">${step.label}</span>
                    ${step.description
                      ? html`<span part="description">${step.description}</span>`
                      : nothing}
                  </span>
                </button>
                ${idx < resolved.length - 1
                  ? html`<span part="connector" aria-hidden="true"></span>`
                  : nothing}
              </li>
            `;
          })}
        </ol>
        <div class="stp-source" aria-hidden="true">
          <slot></slot>
        </div>
      </nav>
    `;
  }
}
