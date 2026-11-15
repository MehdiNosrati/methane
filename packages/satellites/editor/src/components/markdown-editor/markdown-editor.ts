import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, RovingFocusController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { renderMarkdownIntoElement } from '../../shared/markdown-render.js';
import { readHostTokenValue, syncTokenStylesheet } from '../../shared/theme-sync.js';
import { markdownEditorMessages } from './markdown-editor.messages.js';
import type { MarkdownEditorMode } from './markdown-editor.spec.js';
import { markdownEditorStyles } from './markdown-editor.styles.js';

const TRACKED_TOKENS = [
  '--mth-color-surface',
  '--mth-color-bg-subtle',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-border',
  '--mth-color-border-focus',
  '--mth-color-accent',
] as const;

export interface MarkdownEditorEngine {
  readonly mode: MarkdownEditorMode;
  setMode(mode: MarkdownEditorMode): void;
  insertSyntax(prefix: string, suffix?: string, fallbackText?: string): void;
  getThemeToken(tokenName: string): string;
  destroy(): void;
}

/**
 * `<mth-markdown-editor>`: Form-associated Markdown editor with roving
 * formatting toolbar, write/preview/split modes, and sanitized preview rendering.
 */
export class MthMarkdownEditor extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = markdownEditorMessages;
  static override styles = [markdownEditorStyles];

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: String, reflect: true })
  mode: MarkdownEditorMode = 'write';

  @property({ type: Boolean, attribute: 'allow-raw-html' })
  allowRawHtml = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @query('#mth-me-textarea')
  private textareaEl!: HTMLTextAreaElement | null;

  @query('#mth-me-preview')
  private previewEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly rovingCtrl: RovingFocusController;

  private _engine: MarkdownEditorEngine | null = null;
  private tokenSheet: CSSStyleSheet | null = null;
  private readonly tokenCache = new Map<string, string>();
  private styleObserver: MutationObserver | null = null;
  private deferPreviewTimer: ReturnType<typeof setTimeout> | null = null;
  private wasSsrHydrated = false;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: this.value,
      required: this.required,
      disabled: this.disabled,
      readOnly: this.readonly,
      onValueSync: (nextVal) => {
        this.value = nextVal;
        this.syncPreview();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="tool-button"]') ?? []),
    });
  }

  get engine(): MarkdownEditorEngine | null {
    return this._engine;
  }

  checkValidity(): boolean {
    const valid = this.formCtrl.checkValidity();
    this.requestUpdate();
    return valid;
  }

  reportValidity(): boolean {
    const valid = this.formCtrl.reportValidity();
    this.requestUpdate();
    return valid;
  }

  override formDisabledCallback(disabled: boolean): void {
    super.formDisabledCallback(disabled);
    this.formCtrl.handleFormDisabled(disabled);
    this.requestUpdate();
  }

  override formResetCallback(): void {
    this.formCtrl.handleFormReset();
    this.syncPreview();
  }

  override formStateRestoreCallback(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(state, mode);
    this.syncPreview();
  }

  override connectedCallback(): void {
    this.wasSsrHydrated = !this.hasUpdated && Boolean(this.shadowRoot?.querySelector('[part="base"]'));
    super.connectedCallback();
    this.ensureEngine();
    this.attachStyleObserver();
    this.syncThemeTokens();
    if (this.hasUpdated) {
      this.syncPreview();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.deferPreviewTimer !== null) {
      clearTimeout(this.deferPreviewTimer);
      this.deferPreviewTimer = null;
    }
    this.wasSsrHydrated = false;
    this.styleObserver?.disconnect();
    this.styleObserver = null;
    this._engine?.destroy();
    this._engine = null;
  }

  syncThemeTokens(): void {
    if (!this.tokenSheet && typeof CSSStyleSheet !== 'undefined') {
      this.tokenSheet = new CSSStyleSheet();
    }
    syncTokenStylesheet(
      this,
      this.shadowRoot,
      this.tokenSheet,
      this.tokenCache,
      TRACKED_TOKENS,
    );
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    this.syncThemeTokens();
    if (this.wasSsrHydrated) {
      this.deferPreviewTimer = setTimeout(() => {
        this.deferPreviewTimer = null;
        this.syncPreview();
      }, 0);
    } else {
      this.syncPreview();
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.rovingCtrl.updateOptions({
      dir:
        (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl'
          ? 'rtl'
          : 'ltr',
    });
    if (changed.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changed.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changed.has('mode')) {
      this.setCustomState('split', this.mode === 'split');
    }
    if (changed.has('value')) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('value') || changed.has('mode') || changed.has('allowRawHtml')) {
      if (!this.wasSsrHydrated || this.deferPreviewTimer === null) {
        this.syncPreview();
      }
    }
  }

  private attachStyleObserver(): void {
    if (typeof MutationObserver === 'undefined') return;
    this.styleObserver?.disconnect();
    this.styleObserver = new MutationObserver(() => {
      this.syncThemeTokens();
    });
    this.styleObserver.observe(this, { attributes: true, attributeFilter: ['style'] });
  }

  private ensureEngine(): void {
    if (this._engine) return;
    const getMode = () => this.mode;
    this._engine = {
      get mode() {
        return getMode();
      },
      setMode: (nextMode: MarkdownEditorMode) => {
        this.setMode(nextMode);
      },
      insertSyntax: (prefix: string, suffix = '', fallbackText = 'text') => {
        this.insertSyntax(prefix, suffix, fallbackText);
      },
      getThemeToken: (tokenName: string) => {
        return readHostTokenValue(this, tokenName) || this.tokenCache.get(tokenName) || '';
      },
      destroy: () => {
        // Released on disconnect
      },
    };
  }

  private syncPreview(): void {
    if (!this.previewEl || this.mode === 'write') return;
    renderMarkdownIntoElement(this.previewEl, this.value, { allowRawHtml: this.allowRawHtml });
  }

  private setMode(nextMode: MarkdownEditorMode): void {
    if (this.mode === nextMode) return;
    this.mode = nextMode;
    this.emitEvent('mth-mode-change', { detail: { mode: nextMode } });
  }

  private insertSyntax(prefix: string, suffix = '', fallbackText = 'text'): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const ta = this.textareaEl;
    if (!ta) {
      const nextValue = `${this.value}${prefix}${fallbackText}${suffix}`;
      this.updateValueFromInput(nextValue);
      return;
    }
    const start = ta.selectionStart ?? this.value.length;
    const end = ta.selectionEnd ?? start;
    const selected = this.value.slice(start, end) || fallbackText;
    const nextValue =
      this.value.slice(0, start) + prefix + selected + suffix + this.value.slice(end);
    this.updateValueFromInput(nextValue);
  }

  private updateValueFromInput(nextValue: string): void {
    this.value = nextValue;
    this.formCtrl.setValue(nextValue);
    this.syncPreview();
    this.emitEvent('mth-input', { detail: { value: nextValue } });
  }

  private handleTextareaInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.updateValueFromInput(target.value);
  }

  private handleTextareaBlur(): void {
    this.emitEvent('mth-change', { detail: { value: this.value } });
  }

  protected override render() {
    const labelText = this.label.trim() || this.t('editorLabel');
    const isBlocked = this.formCtrl.disabled || this.formCtrl.readOnly;
    const showWrite = this.mode === 'write' || this.mode === 'split';
    const showPreview = this.mode === 'preview' || this.mode === 'split';

    return html`
      ${this.label.trim()
        ? html`<label part="label" id="mth-me-label" for=${showWrite ? 'mth-me-textarea' : nothing}>${this.label}</label>`
        : nothing}
      <div
        part="base"
        role="group"
        aria-label=${this.label.trim() ? nothing : labelText}
        aria-labelledby=${this.label.trim() ? 'mth-me-label' : nothing}
      >
        <div part="header">
          <div part="toolbar" role="toolbar" aria-label=${this.t('toolbarLabel')}>
            <button
              part="tool-button"
              type="button"
              ?disabled=${isBlocked}
              @click=${() => this.insertSyntax('**', '**', 'bold')}
            >
              ${this.t('boldLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              ?disabled=${isBlocked}
              @click=${() => this.insertSyntax('*', '*', 'italic')}
            >
              ${this.t('italicLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              ?disabled=${isBlocked}
              @click=${() => this.insertSyntax('`', '`', 'code')}
            >
              ${this.t('codeLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              ?disabled=${isBlocked}
              @click=${() => this.insertSyntax('[', '](https://example.com)', 'link')}
            >
              ${this.t('linkLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              ?disabled=${isBlocked}
              @click=${() => this.insertSyntax('## ', '', 'Heading')}
            >
              ${this.t('headingLabel')}
            </button>
            <slot name="toolbar"></slot>
          </div>

          <div class="me-modes" role="group" aria-label=${this.t('modeGroupLabel')}>
            <button
              part="tool-button"
              type="button"
              aria-pressed=${this.mode === 'write' ? 'true' : 'false'}
              @click=${() => this.setMode('write')}
            >
              ${this.t('writeModeLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              aria-pressed=${this.mode === 'preview' ? 'true' : 'false'}
              @click=${() => this.setMode('preview')}
            >
              ${this.t('previewModeLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              aria-pressed=${this.mode === 'split' ? 'true' : 'false'}
              @click=${() => this.setMode('split')}
            >
              ${this.t('splitModeLabel')}
            </button>
          </div>
        </div>

        <div part="panes">
          ${showWrite
            ? html`
                <textarea
                  id="mth-me-textarea"
                  part="textarea"
                  .value=${this.value}
                  placeholder=${this.placeholder || this.t('placeholderFallback')}
                  ?disabled=${this.formCtrl.disabled}
                  ?readonly=${this.formCtrl.readOnly}
                  ?required=${this.required}
                  aria-label=${labelText}
                  aria-invalid=${this.formCtrl.invalid ? 'true' : nothing}
                  @input=${this.handleTextareaInput}
                  @blur=${this.handleTextareaBlur}
                ></textarea>
              `
            : nothing}
          ${showPreview
            ? html`
                <div
                  id="mth-me-preview"
                  part="preview"
                  role="region"
                  aria-label=${this.t('previewLabel')}
                ></div>
              `
            : nothing}
        </div>

        <div part="fallback">
          <slot name="fallback"></slot>
        </div>
      </div>
    `;
  }
}
