import { UIElement, html, nothing, property, query, type PropertyValues } from '@methane/core';
import { MotionController } from '@methane/primitives';
import { toolCallMessages } from './tool-call.messages.js';
import { toolCallStyles } from './tool-call.styles.js';

export type MthToolCallStatus = 'pending' | 'running' | 'success' | 'error';

function formatSafePayload(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * `<mth-tool-call>`: collapsible tool invocation status card escaping JSON args/output
 * as text nodes (never raw HTML sinks).
 */
export class MthToolCall extends UIElement {
  static override messages = toolCallMessages;
  static override styles = toolCallStyles;

  @property({ type: String })
  name = '';

  @property({ type: String, reflect: true })
  status: MthToolCallStatus = 'pending';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ attribute: false })
  args: unknown = undefined;

  @property({ attribute: false })
  output: unknown = undefined;

  @property({ type: Number, attribute: 'duration-ms' })
  durationMs: number | null = null;

  @query('[part="details"]')
  private detailsEl!: HTMLElement | null;

  private readonly motionCtrl: MotionController;
  private hasMounted = false;

  constructor() {
    super();
    this.motionCtrl = new MotionController(this, {
      target: () => this.detailsEl,
      enterKeyframes: [{ opacity: 0 }, { opacity: 1 }],
      exitKeyframes: [{ opacity: 1 }, { opacity: 0 }],
      durationMs: 120,
      respectReducedMotion: true,
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStates();
  }

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.hasMounted = true;
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('open') && this.hasMounted) {
      if (this.open) {
        void this.motionCtrl.open();
      } else {
        void this.motionCtrl.close();
      }
    }
    this.syncStates();
  }

  private syncStates(): void {
    this.setCustomState('open', this.open);
    this.setCustomState('pending', this.status === 'pending');
    this.setCustomState('running', this.status === 'running');
    this.setCustomState('success', this.status === 'success');
    this.setCustomState('error', this.status === 'error');
  }

  toggle(): void {
    this.open = !this.open;
    this.emitEvent('mth-toggle', { detail: { open: this.open, status: this.status } });
  }

  private resolveStatusLabel(): string {
    switch (this.status) {
      case 'running':
        return this.t('statusRunning');
      case 'success':
        return this.t('statusSuccess');
      case 'error':
        return this.t('statusError');
      default:
        return this.t('statusPending');
    }
  }

  private resolveBadgeVariant(): 'neutral' | 'accent' | 'success' | 'danger' {
    switch (this.status) {
      case 'running':
        return 'accent';
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  private readonly handleTriggerClick = (): void => {
    this.toggle();
  };

  override render() {
    const triggerId = 'mth-tc-trigger';
    const detailsId = 'mth-tc-details';
    const toolLabel = this.name || this.t('defaultToolName');
    const argsText = formatSafePayload(this.args);
    const outputText = formatSafePayload(this.output);

    return html`
      <div class="card" part="base">
        <button
          id=${triggerId}
          type="button"
          class="trigger"
          part="trigger"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls=${detailsId}
          @click=${this.handleTriggerClick}
        >
          ${this.status === 'running' ? html`<mth-spinner size="xs"></mth-spinner>` : nothing}
          <span class="name">${toolLabel}</span>
          ${this.durationMs !== null
            ? html`<span class="duration">${this.t('durationLabel', { ms: this.durationMs })}</span>`
            : nothing}
          <mth-badge variant=${this.resolveBadgeVariant()} size="sm" pill>
            ${this.resolveStatusLabel()}
          </mth-badge>
          <mth-icon name="chevron-down" size="xs"></mth-icon>
        </button>

        <div
          id=${detailsId}
          class="details"
          part="details"
          role="region"
          aria-labelledby=${triggerId}
          ?hidden=${!this.open}
        >
          ${argsText
            ? html`
                <div>
                  <div class="section-label">${this.t('argumentsLabel')}</div>
                  <pre class="code" part="args"><code>${argsText}</code></pre>
                </div>
              `
            : nothing}
          ${outputText
            ? html`
                <div>
                  <div class="section-label">${this.t('outputLabel')}</div>
                  <pre class="code" part="output"><code>${outputText}</code></pre>
                </div>
              `
            : nothing}
          <slot></slot>
        </div>
      </div>
    `;
  }
}
