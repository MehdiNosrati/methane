import { UIElement, html, nothing, property, query, type PropertyValues } from '@methane-ui/core';
import { MotionController, type MotionPhase } from '@methane-ui/primitives';
import { thinkingIndicatorMessages } from './thinking-indicator.messages.js';
import { thinkingIndicatorStyles } from './thinking-indicator.styles.js';

/**
 * `<mth-thinking-indicator>`: collapsible AI chain-of-thought disclosure with elapsed
 * timer formatting and `MotionController` (`prefers-reduced-motion` aware).
 */
export class MthThinkingIndicator extends UIElement {
  static override messages = thinkingIndicatorMessages;
  static override styles = thinkingIndicatorStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  streaming = false;

  @property({ type: Number, attribute: 'elapsed-seconds' })
  elapsedSeconds = 0;

  @property({ type: String })
  summary = '';

  @property({ type: String })
  content = '';

  @query('[part="panel"]')
  private panelEl!: HTMLElement | null;

  private readonly motionCtrl: MotionController;
  private hasMounted = false;

  constructor() {
    super();
    this.motionCtrl = new MotionController(this, {
      target: () => this.panelEl,
      enterKeyframes: [
        { opacity: 0, transform: 'translateY(-4px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      exitKeyframes: [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-4px)' },
      ],
      durationMs: 140,
      respectReducedMotion: true,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
    });
  }

  get motionPhase(): MotionPhase {
    return this.motionCtrl.phase;
  }

  get isReducedMotion(): boolean {
    return this.motionCtrl.isReducedMotion;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('open', this.open);
    this.setCustomState('streaming', this.streaming);
  }

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.hasMounted = true;
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('open')) {
      this.setCustomState('open', this.open);
      if (this.hasMounted) {
        if (this.open) {
          void this.motionCtrl.open();
        } else {
          void this.motionCtrl.close();
        }
      }
    }
    if (changedProperties.has('streaming')) {
      this.setCustomState('streaming', this.streaming);
    }
  }

  toggle(): void {
    this.open = !this.open;
    this.emitEvent('mth-toggle', { detail: { open: this.open } });
  }

  private resolveSummary(): string {
    if (this.summary) return this.summary;
    if (this.streaming) return this.t('thinkingLabel');
    if (this.elapsedSeconds > 0) {
      return this.t('thoughtForSeconds', { seconds: Math.round(this.elapsedSeconds) });
    }
    return this.t('thoughtSummary');
  }

  private readonly handleTriggerClick = (): void => {
    this.toggle();
  };

  override render() {
    const triggerId = 'mth-ti-trigger';
    const panelId = 'mth-ti-panel';

    return html`
      <div class="base" part="base">
        <button
          id=${triggerId}
          type="button"
          class="trigger"
          part="trigger"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls=${panelId}
          @click=${this.handleTriggerClick}
        >
          ${this.streaming ? html`<mth-spinner size="xs"></mth-spinner>` : nothing}
          <span class="label">${this.resolveSummary()}</span>
          <mth-icon class="chevron" name="chevron-down" size="xs"></mth-icon>
        </button>

        <div
          id=${panelId}
          class="panel"
          part="panel"
          role="region"
          aria-labelledby=${triggerId}
          ?hidden=${!this.open}
        >
          ${this.content ? html`<div>${this.content}</div>` : nothing}
          <slot></slot>
        </div>
      </div>
    `;
  }
}
