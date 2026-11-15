import { UIElement, type PropertyValues } from '@methane-ui/core';
import { FormControlController, RovingFocusController, SelectionController } from '@methane-ui/primitives';
import { registerMthBadge } from '@methane-ui/ui/badge';
import { html, nothing } from 'lit';
import { property, query, queryAll } from 'lit/decorators.js';
import { resolveEffectiveDir } from '../../shared/dir.js';
import { planPickerMessages } from './plan-picker.messages.js';
import { planPickerStyles } from './plan-picker.styles.js';

export interface BillingPlan {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly monthlyPrice: number;
  readonly annualPrice: number;
  readonly features?: ReadonlyArray<string>;
  readonly badge?: string;
  readonly disabled?: boolean;
}

/**
 * `<mth-plan-picker>`: form-associated SaaS tier selector with monthly/annual billing cycle
 * toggle, `SelectionController`, `RovingFocusController`, and locale-aware currency formatting.
 */
export class MthPlanPicker extends UIElement {
  static formAssociated = true;
  static override messages = planPickerMessages;
  static override styles = planPickerStyles;

  @property({ attribute: false })
  plans: ReadonlyArray<BillingPlan> = [];

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'billing-cycle' })
  billingCycle: 'monthly' | 'annual' = 'monthly';

  @property({ type: String })
  currency = 'USD';

  @property({ type: String })
  locale = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @query('.grid')
  private gridEl!: HTMLElement | null;

  @queryAll('.plan-card')
  private planCards!: NodeListOf<HTMLButtonElement>;

  private initializedDefault = false;
  private rovingContainer: HTMLElement | null = null;
  private readonly formCtrl: FormControlController;
  private readonly selectionCtrl: SelectionController;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    registerMthBadge();

    this.selectionCtrl = new SelectionController(this, {
      mode: 'single',
    });

    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      dir: 'auto',
      loop: true,
      container: () => this.rovingContainer,
      getItems: () => Array.from(this.planCards ?? []),
    });

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      onValueSync: (val) => {
        this.value = val;
        this.selectionCtrl.setSelection(val ? [val] : []);
      },
      onDisabledChange: () => {
        this.syncStates();
        this.requestUpdate();
      },
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.initializedDefault) {
      this.initializedDefault = true;
      this.formCtrl.setDefaultValue(this.value);
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
  }

  override formDisabledCallback(disabled: boolean): void {
    super.formDisabledCallback(disabled);
    this.formCtrl.handleFormDisabled(disabled);
  }

  override formResetCallback(): void {
    super.formResetCallback();
    this.formCtrl.handleFormReset();
  }

  override formStateRestoreCallback(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    super.formStateRestoreCallback(state, mode);
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  private get effectiveDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  private formatMoney(amount: number): string {
    const targetLocale = this.locale || this.resolvedLocale;
    const safe = Number.isFinite(amount) ? amount : 0;
    try {
      return new Intl.NumberFormat(targetLocale, {
        style: 'currency',
        currency: this.currency || 'USD',
      }).format(safe);
    } catch {
      return `${this.currency || 'USD'} ${safe.toFixed(2)}`;
    }
  }

  selectPlan(planId: string): void {
    if (this.effectiveDisabled) return;
    const idx = this.plans.findIndex((p) => p.id === planId);
    const target = idx >= 0 ? this.plans[idx] : undefined;
    if (!target || target.disabled) return;
    this.value = planId;
    this.selectionCtrl.setSelection([planId]);
    this.rovingCtrl.setActiveIndex(idx, false);
    this.formCtrl.markTouched();
    this.formCtrl.setValue(planId, { markDirty: true });
    this.emitEvent('mth-change', {
      detail: {
        planId,
        billingCycle: this.billingCycle,
      },
    });
  }

  setBillingCycle(cycle: 'monthly' | 'annual'): void {
    if (this.effectiveDisabled || this.billingCycle === cycle) return;
    this.billingCycle = cycle;
    this.syncStates();
    this.emitEvent('mth-cycle-change', { detail: { billingCycle: cycle } });
  }

  private handleToggleKeyDown = (e: KeyboardEvent): void => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.stopPropagation();
    }
  };

  private syncStates(): void {
    this.setCustomState('annual', this.billingCycle === 'annual');
    this.setCustomState('disabled', this.effectiveDisabled);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    this.rovingCtrl.updateOptions({
      dir: resolveEffectiveDir(this, this.resolvedDir),
    });
    if (changed.has('plans')) {
      this.selectionCtrl.setItems(
        (this.plans ?? []).map((p) => ({
          value: p.id,
          disabled: Boolean(p.disabled) || this.effectiveDisabled,
        })),
      );
    }
    if (changed.has('value')) {
      this.selectionCtrl.setSelection(this.value ? [this.value] : []);
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
    if (changed.has('billingCycle') || changed.has('disabled') || changed.has('required')) {
      this.formCtrl.hostDisabled = this.disabled;
      this.formCtrl.required = this.required;
      this.syncStates();
    }
  }

  protected override firstUpdated(): void {
    if (this.gridEl && this.rovingContainer !== this.gridEl) {
      this.rovingCtrl.hostDisconnected();
      this.rovingContainer = this.gridEl;
      this.rovingCtrl.hostConnected();
    }
    const activeIdx = (this.plans ?? []).findIndex((p) => p.id === this.value);
    if (activeIdx >= 0) {
      this.rovingCtrl.setActiveIndex(activeIdx, false);
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('value')) {
      const activeIdx = (this.plans ?? []).findIndex((p) => p.id === this.value);
      if (activeIdx >= 0) {
        this.rovingCtrl.setActiveIndex(activeIdx, false);
      }
    }
  }

  protected override render() {
    const isDisabled = this.effectiveDisabled;
    const isAnnual = this.billingCycle === 'annual';
    const list = this.plans ?? [];

    return html`
      <section class="root" part="base" dir=${resolveEffectiveDir(this, this.resolvedDir)} aria-label=${this.label || this.t('regionLabel')}>
        <div
          class="cycle-bar"
          part="cycle-toggle"
          role="group"
          aria-label=${this.t('billingCycleLabel')}
          @keydown=${this.handleToggleKeyDown}
        >
          <button
            type="button"
            class="cycle-btn"
            aria-pressed=${!isAnnual ? 'true' : 'false'}
            ?disabled=${isDisabled}
            @click=${() => this.setBillingCycle('monthly')}
          >
            ${this.t('monthlyLabel')}
          </button>
          <button
            type="button"
            class="cycle-btn"
            aria-pressed=${isAnnual ? 'true' : 'false'}
            ?disabled=${isDisabled}
            @click=${() => this.setBillingCycle('annual')}
          >
            ${this.t('annualLabel')}
          </button>
        </div>

        <div class="grid" part="grid" role="radiogroup" aria-label=${this.label || this.t('selectPlanLabel')}>
          ${list.map((plan) => {
            const selected = this.value === plan.id;
            const cardDisabled = isDisabled || Boolean(plan.disabled);
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const suffix = isAnnual ? this.t('perYearSuffix') : this.t('perMonthSuffix');

            return html`
              <button
                type="button"
                class="plan-card"
                part="plan"
                role="radio"
                aria-checked=${selected ? 'true' : 'false'}
                ?disabled=${cardDisabled}
                @click=${() => this.selectPlan(plan.id)}
              >
                <div class="plan-header">
                  <span class="plan-name">${plan.name}</span>
                  ${plan.badge
                    ? html`<mth-badge size="sm" variant="accent" pill>${plan.badge}</mth-badge>`
                    : nothing}
                </div>
                <div class="price-line">
                  <span class="amount">${this.formatMoney(price)}</span>
                  <span class="suffix">${suffix}</span>
                </div>
                ${plan.description ? html`<span class="desc">${plan.description}</span>` : nothing}
                ${plan.features && plan.features.length > 0
                  ? html`
                      <ul class="features">
                        ${plan.features.map((feat) => html`<li>✓ ${feat}</li>`)}
                      </ul>
                    `
                  : nothing}
              </button>
            `;
          })}
        </div>
      </section>
    `;
  }
}
