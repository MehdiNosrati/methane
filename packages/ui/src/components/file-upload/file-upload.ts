import { UIElement, type PropertyValues, html, nothing, property, query, state } from '@methane/core';
import { FormControlController } from '@methane/primitives';
import { fileUploadMessages } from './file-upload.messages.js';
import { fileUploadStyles } from './file-upload.styles.js';

export type FileRejectReason = 'type' | 'size' | 'count';

export interface RejectedFile {
  file: File;
  reason: FileRejectReason;
}

interface UploadedEntry {
  file: File;
  previewUrl: string | null;
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
    if (rule.startsWith('.')) {
      return fileName.endsWith(rule);
    }
    if (rule.endsWith('/*')) {
      const prefix = rule.slice(0, -1);
      return fileType.startsWith(prefix);
    }
    return fileType === rule;
  });
}

function createSafePreviewUrl(file: File): string | null {
  if (!file.type.toLowerCase().startsWith('image/')) return null;
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return null;
  try {
    const url = URL.createObjectURL(file);
    return url.startsWith('blob:') ? url : null;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Form-associated file upload control with advisory MIME/size validation and safe <img> previews.
 */
export class MthFileUpload extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = fileUploadStyles;
  static override messages = fileUploadMessages;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  accept = '';

  @property({ type: Boolean, reflect: true })
  multiple = false;

  @property({ type: Number, attribute: 'max-file-size' })
  maxFileSize = 0;

  @property({ type: Number, attribute: 'max-files' })
  maxFiles = 0;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private entries: UploadedEntry[] = [];

  @state()
  private rejectedCount = 0;

  @query('[part="input"]')
  private inputEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: fileUploadMessages,
      validator: (ctx) => {
        const current = typeof ctx.value === 'string' ? ctx.value : '';
        if (ctx.required && !current.trim()) {
          return { flags: { valueMissing: true }, message: this.t('requiredError') };
        }
        return null;
      },
      onValueSync: (nextValue) => {
        if (!nextValue) {
          this.revokeAllPreviews();
          this.entries = [];
          this.rejectedCount = 0;
        }
        this.value = nextValue;
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
    });
  }

  get files(): ReadonlyArray<File> {
    return this.entries.map((e) => e.file);
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage || this.internals?.validationMessage || '';
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.closest('form');
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  override disconnectedCallback(): void {
    this.revokeAllPreviews();
    super.disconnectedCallback();
  }

  protected override onFirstConnect(): void {
    const initialDefault = this.getAttribute('value') ?? this.value ?? '';
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changed.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
    }
    if (changed.has('value')) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
  }

  addFiles(incoming: FileList | ReadonlyArray<File>): void {
    if (this.effectivelyDisabled || this.readonly) return;
    const candidateList = Array.from(incoming);
    if (candidateList.length === 0) return;

    const accepted: UploadedEntry[] = [];
    const rejected: RejectedFile[] = [];
    const baseEntries = this.multiple ? [...this.entries] : [];

    for (const file of candidateList) {
      if (this.accept && !matchesAccept(file, this.accept)) {
        rejected.push({ file, reason: 'type' });
        continue;
      }
      if (this.maxFileSize > 0 && file.size > this.maxFileSize) {
        rejected.push({ file, reason: 'size' });
        continue;
      }
      const nextCount = baseEntries.length + accepted.length + 1;
      if (this.maxFiles > 0 && nextCount > this.maxFiles) {
        rejected.push({ file, reason: 'count' });
        continue;
      }
      if (!this.multiple && accepted.length >= 1) {
        rejected.push({ file, reason: 'count' });
        continue;
      }
      accepted.push({ file, previewUrl: createSafePreviewUrl(file) });
    }

    this.rejectedCount = rejected.length;
    if (rejected.length > 0) {
      this.emitEvent('mth-reject', { detail: { rejected } });
    }

    if (accepted.length > 0) {
      if (!this.multiple) {
        this.revokeAllPreviews();
      }
      this.entries = this.multiple ? [...baseEntries, ...accepted] : accepted;
      this.syncCommittedFiles(true);
    }
  }

  removeFile(index: number): void {
    if (this.effectivelyDisabled || this.readonly) return;
    const target = this.entries[index];
    if (!target) return;
    if (target.previewUrl && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(target.previewUrl);
    }
    this.entries = this.entries.filter((_, i) => i !== index);
    this.syncCommittedFiles(true);
  }

  clear(): void {
    if (this.effectivelyDisabled || this.readonly) return;
    this.revokeAllPreviews();
    this.entries = [];
    this.rejectedCount = 0;
    if (this.inputEl) {
      this.inputEl.value = '';
    }
    this.syncCommittedFiles(true);
  }

  private revokeAllPreviews(): void {
    if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return;
    for (const entry of this.entries) {
      if (entry.previewUrl) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    }
  }

  private syncCommittedFiles(markDirty: boolean): void {
    const names = this.entries.map((e) => e.file.name).join(', ');
    this.value = names;
    this.formCtrl.setValue(names, { markDirty });
    if (markDirty) {
      this.formCtrl.markTouched();
    }
    this.emitEvent('mth-change', {
      detail: {
        files: this.entries.map((e) => e.file),
        value: names,
      },
    });
  }

  private readonly handleInputChange = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFiles(input.files);
    }
  };

  private readonly handleBrowseClick = (): void => {
    if (this.effectivelyDisabled || this.readonly) return;
    this.inputEl?.click();
  };

  private readonly handleDragOver = (event: DragEvent): void => {
    if (this.effectivelyDisabled || this.readonly) return;
    event.preventDefault();
    this.setCustomState('dragover', true);
  };

  private readonly handleDragLeave = (): void => {
    this.setCustomState('dragover', false);
  };

  private readonly handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    this.setCustomState('dragover', false);
    if (this.effectivelyDisabled || this.readonly) return;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.addFiles(event.dataTransfer.files);
    }
  };

  protected override render() {
    const isDisabled = this.effectivelyDisabled;
    const labelId = this.label ? 'upload-label' : undefined;

    return html`
      <div part="base" class="base">
        ${this.label
          ? html`<label id="upload-label" for="upload-input" part="label" class="label">${this.label}</label>`
          : nothing}
        <div
          part="drop-area"
          class="drop-area"
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
          <span class="hint">${this.t('dropHint')}</span>
          <input
            id="upload-input"
            part="input"
            class="native-input"
            type="file"
            accept=${this.accept || nothing}
            ?multiple=${this.multiple}
            ?disabled=${isDisabled}
            aria-labelledby=${labelId ?? nothing}
            @change=${this.handleInputChange}
          />
          <button
            type="button"
            part="browse-button"
            class="browse-button"
            ?disabled=${isDisabled || this.readonly}
            @click=${this.handleBrowseClick}
          >
            ${this.t('browse')}
          </button>
        </div>
        ${this.entries.length > 0
          ? html`
              <ul part="list" class="list">
                ${this.entries.map(
                  (entry, index) => html`
                    <li part="item" class="item">
                      ${entry.previewUrl
                        ? html`<img
                            part="preview"
                            class="preview"
                            src=${entry.previewUrl}
                            alt=${entry.file.name}
                          />`
                        : nothing}
                      <span class="meta">${entry.file.name} (${formatBytes(entry.file.size)})</span>
                      <button
                        type="button"
                        part="remove-button"
                        class="remove-button"
                        aria-label=${`${this.t('removeFile')} ${entry.file.name}`}
                        ?disabled=${isDisabled || this.readonly}
                        @click=${() => this.removeFile(index)}
                      >
                        ${this.t('removeFile')}
                      </button>
                    </li>
                  `,
                )}
              </ul>
            `
          : nothing}
        ${this.rejectedCount > 0
          ? html`<div part="error" class="error" role="status">${this.t('rejectedNotice')}</div>`
          : nothing}
      </div>
    `;
  }
}
