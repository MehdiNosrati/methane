import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { uploadProgressMessages } from './upload-progress.messages.js';
import { uploadProgressStyles } from './upload-progress.styles.js';

export type UploadProgressStatus = 'queued' | 'uploading' | 'paused' | 'complete' | 'error';

const STATUS_VALUES: readonly UploadProgressStatus[] = [
  'queued',
  'uploading',
  'paused',
  'complete',
  'error',
];

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * `<mth-upload-progress>`: file transfer progress card with pause/resume/retry/cancel controls.
 */
export class MthUploadProgress extends UIElement {
  static override messages = uploadProgressMessages;
  static override styles = uploadProgressStyles;

  @property({ type: String })
  filename = '';

  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  size = 0;

  @property({ type: String, reflect: true })
  status: UploadProgressStatus = 'queued';

  @property({ type: String, attribute: 'error-message' })
  errorMessage = '';

  @property({ type: Boolean, reflect: true })
  pausable = true;

  @property({ type: Boolean, reflect: true })
  cancellable = true;

  private fillSheet: CSSStyleSheet | null = null;

  protected override firstUpdated(_changed: PropertyValues): void {
    super.firstUpdated(_changed);
    this.syncFillSheet();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('status')) {
      for (const candidate of STATUS_VALUES) {
        this.setCustomState(candidate, candidate === this.status);
      }
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('value') || changedProperties.has('status')) {
      this.syncFillSheet();
    }
  }

  public pause(): void {
    if (this.status !== 'uploading') return;
    this.status = 'paused';
    this.emitEvent('mth-pause');
  }

  public resume(): void {
    if (this.status !== 'paused') return;
    this.status = 'uploading';
    this.emitEvent('mth-resume');
  }

  public cancel(): void {
    this.emitEvent('mth-cancel');
  }

  public retry(): void {
    if (this.status !== 'error') return;
    this.status = 'uploading';
    this.emitEvent('mth-retry');
  }

  private clampPercent(): number {
    if (this.status === 'complete') return 100;
    if (!Number.isFinite(this.value)) return 0;
    return Math.min(100, Math.max(0, Math.round(this.value)));
  }

  private syncFillSheet(): void {
    const root = this.shadowRoot;
    if (!root || typeof CSSStyleSheet === 'undefined' || !Array.isArray(root.adoptedStyleSheets)) {
      return;
    }
    if (!this.fillSheet) {
      this.fillSheet = new CSSStyleSheet();
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.fillSheet];
    }
    const pct = this.clampPercent();
    this.fillSheet.replaceSync(`:host { --_upload-pct: ${pct}%; }`);
  }

  private resolveStatusText(pct: number): string {
    switch (this.status) {
      case 'uploading':
        return this.t('uploadingLabel', { percent: pct });
      case 'paused':
        return this.t('pausedLabel');
      case 'complete':
        return this.t('completeLabel');
      case 'error':
        return this.errorMessage || this.t('errorLabel');
      default:
        return this.t('queuedLabel');
    }
  }

  protected override render() {
    const pct = this.clampPercent();
    const resolvedName = this.filename || this.t('defaultFilename');
    const sizeText = formatBytes(this.size);
    const statusText = this.resolveStatusText(pct);

    return html`
      <div class="base" part="base">
        <div class="row">
          <div class="meta" part="meta">
            <span class="filename" part="filename">
              <slot name="icon"></slot>
              ${resolvedName}${sizeText ? ` (${sizeText})` : ''}
            </span>
            <span class="status-text" part="status-text">${statusText}</span>
          </div>

          <div class="controls" part="controls">
            <slot name="actions"></slot>
            ${this.pausable && this.status === 'uploading'
              ? html`
                  <button
                    type="button"
                    class="ctrl-btn"
                    part="pause-button"
                    aria-label=${this.t('pauseLabel')}
                    @click=${() => this.pause()}
                  >
                    ❚❚
                  </button>
                `
              : nothing}
            ${this.pausable && this.status === 'paused'
              ? html`
                  <button
                    type="button"
                    class="ctrl-btn"
                    part="pause-button"
                    aria-label=${this.t('resumeLabel')}
                    @click=${() => this.resume()}
                  >
                    ▶
                  </button>
                `
              : nothing}
            ${this.status === 'error'
              ? html`
                  <button
                    type="button"
                    class="ctrl-btn"
                    part="retry-button"
                    aria-label=${this.t('retryLabel')}
                    @click=${() => this.retry()}
                  >
                    ↻
                  </button>
                `
              : nothing}
            ${this.cancellable && this.status !== 'complete'
              ? html`
                  <button
                    type="button"
                    class="ctrl-btn"
                    part="cancel-button"
                    aria-label=${this.t('cancelLabel')}
                    @click=${() => this.cancel()}
                  >
                    ✕
                  </button>
                `
              : nothing}
          </div>
        </div>

        <div
          class="track"
          part="track"
          role="progressbar"
          aria-label=${resolvedName}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow=${String(pct)}
        >
          <div class="fill" part="fill"></div>
        </div>
      </div>
    `;
  }
}
