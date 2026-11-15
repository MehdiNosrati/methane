import { UIElement, type PropertyValues, html, nothing, property, query } from '@methane/core';
import { dropzoneMessages } from './dropzone.messages.js';
import { dropzoneStyles } from './dropzone.styles.js';

export type DropRejectReason = 'type' | 'size' | 'count';

export interface DropRejectedFile {
  file: File;
  reason: DropRejectReason;
}

function matchesAccept(file: File, accept: string): boolean {
  const rules = accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const fileType = (file.type || '').toLowerCase();
  const fileName = file.name.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) return fileName.endsWith(rule);
    if (rule.endsWith('/*')) return fileType.startsWith(rule.slice(0, -1));
    return fileType === rule;
  });
}

/**
 * Accessible drag-and-drop file dropzone with advisory MIME/size filtering.
 */
export class MthDropzone extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = dropzoneStyles;
  static override messages = dropzoneMessages;

  @property({ type: String })
  accept = '';

  @property({ type: Boolean, reflect: true })
  multiple = true;

  @property({ type: Number, attribute: 'max-file-size' })
  maxFileSize = 0;

  @property({ type: Number, attribute: 'max-files' })
  maxFiles = 0;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  @query('[part="input"]')
  private inputEl!: HTMLInputElement | null;

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
      if (this.disabled) {
        this.setCustomState('dragover', false);
      }
    }
  }

  receiveFiles(incoming: FileList | ReadonlyArray<File>): void {
    if (this.disabled) return;
    const list = Array.from(incoming);
    if (list.length === 0) return;

    const accepted: File[] = [];
    const rejected: DropRejectedFile[] = [];

    for (const file of list) {
      if (this.accept && !matchesAccept(file, this.accept)) {
        rejected.push({ file, reason: 'type' });
        continue;
      }
      if (this.maxFileSize > 0 && file.size > this.maxFileSize) {
        rejected.push({ file, reason: 'size' });
        continue;
      }
      if (!this.multiple && accepted.length >= 1) {
        rejected.push({ file, reason: 'count' });
        continue;
      }
      if (this.maxFiles > 0 && accepted.length + 1 > this.maxFiles) {
        rejected.push({ file, reason: 'count' });
        continue;
      }
      accepted.push(file);
    }

    if (rejected.length > 0) {
      this.emitEvent('mth-reject', { detail: { rejected } });
    }
    if (accepted.length > 0) {
      this.emitEvent('mth-drop', { detail: { files: accepted } });
    }
  }

  private readonly handleDragOver = (event: DragEvent): void => {
    if (this.disabled) return;
    event.preventDefault();
    this.setCustomState('dragover', true);
  };

  private readonly handleDragLeave = (): void => {
    this.setCustomState('dragover', false);
  };

  private readonly handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    this.setCustomState('dragover', false);
    if (this.disabled) return;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.receiveFiles(event.dataTransfer.files);
    }
  };

  private readonly handleTriggerClick = (): void => {
    if (this.disabled) return;
    this.inputEl?.click();
  };

  private readonly handleInputChange = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.receiveFiles(input.files);
      input.value = '';
    }
  };

  protected override render() {
    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.label || this.t('prompt')}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
        <slot><span>${this.t('prompt')}</span></slot>
        <input
          part="input"
          class="native-input"
          type="file"
          accept=${this.accept || nothing}
          ?multiple=${this.multiple}
          ?disabled=${this.disabled}
          aria-hidden="true"
          tabindex="-1"
          @change=${this.handleInputChange}
        />
        <button
          type="button"
          part="trigger"
          class="trigger"
          ?disabled=${this.disabled}
          @click=${this.handleTriggerClick}
        >
          ${this.t('browse')}
        </button>
      </div>
    `;
  }
}
