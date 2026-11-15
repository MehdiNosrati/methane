import { UIElement, type PropertyValues } from '@methane/core';
import {
  FocusTrapController,
  OverlayController,
  PositioningController,
  type OverlayCloseReason,
  type Placement,
  type PositioningAnchor,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { tourMessages } from './tour.messages.js';
import { tourStyles } from './tour.styles.js';

interface TourStepElementLike extends HTMLElement {
  stepId?: string;
  target?: string;
  heading?: string;
  placement?: Placement;
  active?: boolean;
}

/**
 * `<mth-tour>`: guided multi-step tour coordinating `<mth-tour-step>` children
 * via `OverlayController`, `PositioningController`, and `FocusTrapController`.
 */
export class MthTour extends UIElement {
  static override messages = tourMessages;
  static override styles = tourStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Number, attribute: 'current-step' })
  currentStep = 0;

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'force-fallback' })
  forceFallback = false;

  @state()
  private stepCount = 0;

  @state()
  private activeHeading = '';

  @query('.card')
  private cardEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private readonly focusTrapCtrl: FocusTrapController;
  private triggerEl: HTMLElement | null = null;
  private syncingFromController = false;

  constructor() {
    super();

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.resolveStepAnchor(),
      floating: () => this.cardEl,
      placement: 'bottom',
      offset: 12,
      forceFallback: this.forceFallback,
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.cardEl,
      trigger: () => this.triggerEl,
      closeOnEscape: true,
      lightDismiss: false,
      restoreFocus: true,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.syncingFromController = false;
        this.setCustomState('open', nextOpen);
        if (nextOpen) {
          this.syncStepsState();
          this.positioningCtrl.start();
          this.focusTrapCtrl.activate();
        } else {
          this.focusTrapCtrl.deactivate();
          this.positioningCtrl.stop();
        }
      },
    });

    this.focusTrapCtrl = new FocusTrapController(this, {
      container: () => this.cardEl,
      restoreFocus: false,
    });
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('forceFallback')) {
      this.positioningCtrl.updateOptions({ forceFallback: this.forceFallback });
    }
    if (changedProperties.has('currentStep') && this.open) {
      this.syncStepsState();
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('open') && !this.syncingFromController) {
      if (this.open && !this.overlayCtrl.open) {
        void this.overlayCtrl.show();
      } else if (!this.open && this.overlayCtrl.open) {
        void this.overlayCtrl.hide('programmatic');
      }
    }
  }

  public getSteps(): ReadonlyArray<TourStepElementLike> {
    if (!this.children) {
      return [];
    }
    return Array.from(this.children).filter(
      (el): el is TourStepElementLike =>
        el instanceof HTMLElement &&
        (el.tagName.toLowerCase().endsWith('-tour-step') || 'stepId' in el),
    );
  }

  public start(stepIndex = 0, trigger?: HTMLElement | null): Promise<boolean> {
    if (trigger !== undefined) {
      this.triggerEl = trigger;
    }
    this.currentStep = Math.max(0, Math.trunc(stepIndex));
    this.syncStepsState();
    return this.overlayCtrl.show();
  }

  public show(trigger?: HTMLElement | null): Promise<boolean> {
    return this.start(this.currentStep, trigger);
  }

  public hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    return this.overlayCtrl.hide(reason);
  }

  public goTo(index: number): void {
    const steps = this.getSteps();
    if (steps.length === 0) {
      this.stepCount = 0;
      this.activeHeading = '';
      return;
    }
    const clamped = Math.min(Math.max(0, Math.trunc(index)), steps.length - 1);
    this.currentStep = clamped;
    this.syncStepsState();
    const active = steps[clamped];
    const stepId = active?.stepId || active?.getAttribute('step-id') || active?.id || '';
    this.emitEvent('mth-step-change', { detail: { index: clamped, stepId } });
    if (this.open) {
      this.positioningCtrl.reposition();
    }
  }

  public next(): void {
    const steps = this.getSteps();
    if (this.currentStep + 1 >= steps.length) {
      this.complete();
      return;
    }
    this.goTo(this.currentStep + 1);
  }

  public previous(): void {
    if (this.currentStep <= 0) {
      return;
    }
    this.goTo(this.currentStep - 1);
  }

  public complete(): void {
    this.emitEvent('mth-complete');
    void this.hide('invoker');
  }

  public skip(): void {
    this.emitEvent('mth-skip', { detail: { index: this.currentStep } });
    void this.hide('invoker');
  }

  private syncStepsState(): void {
    const steps = this.getSteps();
    this.stepCount = steps.length;
    if (steps.length === 0) {
      this.activeHeading = '';
      return;
    }
    const clamped = Math.min(Math.max(0, Math.trunc(this.currentStep)), steps.length - 1);
    if (clamped !== this.currentStep) {
      this.currentStep = clamped;
    }
    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i]!;
      step.active = i === clamped;
    }
    const active = steps[clamped];
    this.activeHeading = active?.heading || active?.getAttribute('heading') || '';
    const placement = active?.placement || (active?.getAttribute('placement') as Placement | null) || 'bottom';
    this.positioningCtrl.updateOptions({ placement });
  }

  private resolveStepAnchor(): PositioningAnchor | null {
    const steps = this.getSteps();
    const active = steps[this.currentStep];
    const selector = active?.target || active?.getAttribute('target') || '';
    if (!selector || typeof document === 'undefined') {
      return null;
    }
    try {
      return document.querySelector(selector);
    } catch {
      return null;
    }
  }

  private readonly handleSlotChange = (): void => {
    if (this.open) {
      this.syncStepsState();
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.open) {
      return;
    }
    const rtl =
      this.resolvedDir === 'rtl' ||
      (typeof getComputedStyle === 'function' && getComputedStyle(this).direction === 'rtl');
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (rtl) this.previous();
      else this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (rtl) this.next();
      else this.previous();
    }
  };

  protected override render() {
    const headingId = 'mth-tour-heading';
    const resolvedHeading = this.activeHeading || this.label || this.t('defaultLabel');
    const total = this.stepCount;
    const isFirst = this.currentStep <= 0;
    const isLast = total === 0 || this.currentStep >= total - 1;

    return html`
      <section
        class="card"
        part="base"
        role="dialog"
        aria-modal="false"
        aria-labelledby=${headingId}
        ?hidden=${!this.open}
        @keydown=${this.handleKeyDown}
      >
        <header class="header" part="header">
          <h2 id=${headingId} class="heading" part="heading">${resolvedHeading}</h2>
          <button
            type="button"
            class="icon-btn"
            part="close-button"
            aria-label=${this.t('closeLabel')}
            @click=${() => this.skip()}
          >
            ✕
          </button>
        </header>

        <div class="body" part="body">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>

        <footer class="footer" part="footer">
          ${total > 0
            ? html`<span class="progress" part="progress">${this.t('stepProgress', { current: this.currentStep + 1, total })}</span>`
            : nothing}
          <div class="controls">
            <button
              type="button"
              class="btn"
              part="skip-button"
              @click=${() => this.skip()}
            >
              ${this.t('skipLabel')}
            </button>
            ${!isFirst
              ? html`
                  <button
                    type="button"
                    class="btn"
                    part="prev-button"
                    @click=${() => this.previous()}
                  >
                    ${this.t('previousLabel')}
                  </button>
                `
              : nothing}
            <button
              type="button"
              class="btn btn-primary"
              part="next-button"
              @click=${() => this.next()}
            >
              ${isLast ? this.t('finishLabel') : this.t('nextLabel')}
            </button>
          </div>
        </footer>
      </section>
    `;
  }
}
