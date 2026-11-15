import { UIElement, html, nothing, property, type PropertyValues } from '@methane-ui/core';
import { RovingFocusController, SelectionController } from '@methane-ui/primitives';
import { aiFeedbackMessages } from './ai-feedback.messages.js';
import { aiFeedbackStyles } from './ai-feedback.styles.js';

export type MthAiFeedbackRating = '' | 'up' | 'down';

/**
 * `<mth-ai-feedback>`: thumbs up/down rating bar with multi-select reason chips
 * (`SelectionController`) and RTL-aware `RovingFocusController`.
 */
export class MthAiFeedback extends UIElement {
  static override messages = aiFeedbackMessages;
  static override styles = aiFeedbackStyles;

  @property({ type: String, reflect: true })
  rating: MthAiFeedbackRating = '';

  @property({ attribute: false })
  reasons: ReadonlyArray<string> = [];

  @property({ attribute: false })
  selectedReasons: ReadonlyArray<string> = [];

  @property({ type: String })
  comment = '';

  @property({ type: Boolean, reflect: true })
  submitted = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'multiple',
      allowEmpty: true,
      onChange: (next) => {
        this.selectedReasons = next;
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.getItemElements(),
      orientation: 'horizontal',
      loop: true,
      dir: this.resolvedDir,
    });
  }

  getItemElements(): HTMLElement[] {
    if (!this.shadowRoot) return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLElement>('[part="feedback-control"]'));
  }

  private resolveEffectiveDir(): 'ltr' | 'rtl' {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl'
      ? 'rtl'
      : 'ltr';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.rovingCtrl.updateOptions({ dir: this.resolveEffectiveDir() });
    this.syncStates();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    this.selectionCtrl.setItems(this.resolveReasons());
    if (changedProperties.has('selectedReasons')) {
      this.selectionCtrl.setSelection(this.selectedReasons);
    }
    this.rovingCtrl.updateOptions({ dir: this.resolveEffectiveDir() });
    this.syncStates();
  }

  private resolveReasons(): ReadonlyArray<string> {
    if (this.reasons.length > 0) return this.reasons;
    return [
      this.t('reasonInaccurate'),
      this.t('reasonIncomplete'),
      this.t('reasonVerbose'),
      this.t('reasonOffTopic'),
    ];
  }

  private syncStates(): void {
    this.setCustomState('positive', this.rating === 'up');
    this.setCustomState('negative', this.rating === 'down');
    this.setCustomState('submitted', this.submitted);
    this.setCustomState('disabled', this.disabled);
  }

  private emitFeedback(submitted = this.submitted): void {
    this.emitEvent('mth-feedback', {
      detail: {
        rating: this.rating,
        reasons: [...this.selectionCtrl.selectedValues],
        comment: this.comment,
        submitted,
      },
    });
  }

  private readonly handleRateUp = (): void => {
    if (this.disabled) return;
    this.rating = this.rating === 'up' ? '' : 'up';
    this.submitted = this.rating === 'up';
    this.syncStates();
    this.emitFeedback(this.submitted);
  };

  private readonly handleRateDown = (): void => {
    if (this.disabled) return;
    this.rating = this.rating === 'down' ? '' : 'down';
    this.submitted = false;
    this.syncStates();
    this.emitFeedback(false);
  };

  private handleReasonToggle(reason: string): void {
    if (this.disabled) return;
    this.selectionCtrl.select(reason, { toggle: true });
    this.emitFeedback(this.submitted);
  }

  private readonly handleCommentInput = (event: Event): void => {
    this.comment = (event.target as HTMLInputElement).value;
  };

  private readonly handleSiblingNavKeyDown = (event: KeyboardEvent): void => {
    if (
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      event.stopPropagation();
    }
  };

  private readonly handleSubmit = (): void => {
    if (this.disabled) return;
    this.submitted = true;
    this.syncStates();
    this.emitFeedback(true);
  };

  override render() {
    const groupLabel = this.label || this.t('label');
    const resolvedReasons = this.resolveReasons();

    return html`
      <div class="base" part="base" role="group" aria-label=${groupLabel}>
        <div class="rating-row" role="toolbar" aria-label=${groupLabel}>
          <button
            type="button"
            class="chip"
            part="feedback-control"
            aria-pressed=${this.rating === 'up' ? 'true' : 'false'}
            ?disabled=${this.disabled}
            @click=${this.handleRateUp}
          >
            <mth-icon name="check" size="xs"></mth-icon>
            <span>${this.t('thumbsUpLabel')}</span>
          </button>
          <button
            type="button"
            class="chip"
            part="feedback-control"
            aria-pressed=${this.rating === 'down' ? 'true' : 'false'}
            ?disabled=${this.disabled}
            @click=${this.handleRateDown}
          >
            <mth-icon name="close" size="xs"></mth-icon>
            <span>${this.t('thumbsDownLabel')}</span>
          </button>
          <slot></slot>
        </div>

        ${this.rating === 'down'
          ? html`
              <div class="reasons">
                ${resolvedReasons.map((reason) => {
                  const active = this.selectionCtrl.isSelected(reason);
                  return html`
                    <button
                      type="button"
                      class="chip"
                      part="feedback-control"
                      aria-pressed=${active ? 'true' : 'false'}
                      ?disabled=${this.disabled}
                      @click=${() => this.handleReasonToggle(reason)}
                    >
                      ${reason}
                    </button>
                  `;
                })}
              </div>

              <div class="comment-row" @keydown=${this.handleSiblingNavKeyDown}>
                <input
                  type="text"
                  class="comment-input"
                  part="comment-input"
                  .value=${this.comment}
                  placeholder=${this.t('commentPlaceholder')}
                  aria-label=${this.t('commentPlaceholder')}
                  ?disabled=${this.disabled}
                  @input=${this.handleCommentInput}
                />
                <mth-button
                  variant="solid"
                  size="sm"
                  part="submit-button"
                  ?disabled=${this.disabled}
                  @click=${this.handleSubmit}
                >
                  ${this.t('submitLabel')}
                </mth-button>
              </div>
            `
          : nothing}

        ${this.submitted
          ? html`<p class="thanks" role="status">${this.t('submittedNotice')}</p>`
          : nothing}
      </div>
    `;
  }
}
