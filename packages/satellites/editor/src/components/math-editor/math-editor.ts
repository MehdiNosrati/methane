import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, RovingFocusController } from '@methane/primitives';
import { safeSetHTML } from '@methane/sanitize';
import type { KatexOptions } from 'katex';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { readHostTokenValue, syncTokenStylesheet } from '../../shared/theme-sync.js';
import { mathEditorMessages } from './math-editor.messages.js';
import { mathEditorStyles } from './math-editor.styles.js';

interface KatexModule {
  renderToString(tex: string, options?: KatexOptions): string;
}

let cachedKatex: KatexModule | null = null;
let katexLoadPromise: Promise<KatexModule> | null = null;

async function loadKatex(): Promise<KatexModule> {
  if (cachedKatex) return cachedKatex;
  if (!katexLoadPromise) {
    katexLoadPromise = import('katex').then((mod) => {
      const resolved = (mod.default ?? mod) as KatexModule;
      cachedKatex = resolved;
      return resolved;
    });
  }
  return katexLoadPromise;
}

const TRACKED_TOKENS = [
  '--mth-color-surface',
  '--mth-color-bg-subtle',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-border',
  '--mth-color-border-focus',
  '--mth-color-accent',
] as const;

export interface MathEditorEngine {
  renderLatex(latex: string, displayMode?: boolean): string;
  insertSymbol(snippet: string): void;
  getLastError(): string;
  getThemeToken(tokenName: string): string;
  destroy(): void;
}

interface QuickSymbol {
  readonly labelKey: string;
  readonly symbol: string;
  readonly snippet: string;
}

const QUICK_SYMBOLS: ReadonlyArray<QuickSymbol> = [
  { labelKey: 'symFraction', symbol: 'a/b', snippet: '\\frac{a}{b}' },
  { labelKey: 'symSqrt', symbol: '√x', snippet: '\\sqrt{x}' },
  { labelKey: 'symSum', symbol: '∑', snippet: '\\sum_{i=1}^{n}' },
  { labelKey: 'symIntegral', symbol: '∫', snippet: '\\int_{a}^{b}' },
  { labelKey: 'symAlpha', symbol: 'α', snippet: '\\alpha' },
  { labelKey: 'symPi', symbol: 'π', snippet: '\\pi' },
  { labelKey: 'symInf', symbol: '∞', snippet: '\\infty' },
];

/**
 * `<mth-math-editor>`: Form-associated LaTeX formula editor with quick-symbol
 * toolbar, KaTeX HTML rendering sanitized via `@methane/sanitize`, and token sync.
 */
export class MthMathEditor extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = mathEditorMessages;
  static override styles = [mathEditorStyles];

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: Boolean, reflect: true, attribute: 'display-mode' })
  displayMode = true;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @state()
  private parseError = '';

  @query('#mth-math-textarea')
  private textareaEl!: HTMLTextAreaElement | null;

  @query('#mth-math-preview')
  private previewEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly rovingCtrl: RovingFocusController;

  private _engine: MathEditorEngine | null = null;
  private tokenSheet: CSSStyleSheet | null = null;
  private readonly tokenCache = new Map<string, string>();
  private styleObserver: MutationObserver | null = null;
  private deferRenderTimer: ReturnType<typeof setTimeout> | null = null;
  private wasSsrHydrated = false;

  private lastRenderedHtml = '';

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
        this.lastRenderedHtml = '';
        this.validateLatexState(nextVal);
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: () =>
        this.parseError
          ? { flags: { customError: true }, message: this.parseError }
          : null,
    });

    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="tool-button"]') ?? []),
    });
  }

  get engine(): MathEditorEngine | null {
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
    this.renderFormulaPreview();
  }

  override formStateRestoreCallback(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(state, mode);
    this.renderFormulaPreview();
  }

  override connectedCallback(): void {
    this.wasSsrHydrated = !this.hasUpdated && Boolean(this.shadowRoot?.querySelector('[part="base"]'));
    super.connectedCallback();
    this.ensureEngine();
    this.attachStyleObserver();
    this.syncThemeTokens();
    if (!cachedKatex) {
      void loadKatex();
    }
    if (this.hasUpdated) {
      this.validateLatexState(this.value, false);
      this.renderFormulaPreview();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.deferRenderTimer !== null) {
      clearTimeout(this.deferRenderTimer);
      this.deferRenderTimer = null;
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
      this.deferRenderTimer = setTimeout(() => {
        this.deferRenderTimer = null;
        this.renderFormulaPreview();
      }, 0);
    } else {
      this.renderFormulaPreview();
    }
  }

  protected override async scheduleUpdate(): Promise<void> {
    if (!cachedKatex && this.isConnected) {
      await loadKatex();
    }
    await super.scheduleUpdate();
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
    if (changed.has('displayMode')) {
      this.setCustomState('display-mode', this.displayMode);
    }
    if (changed.has('value') || changed.has('displayMode')) {
      const emitErr = changed.has('value');
      this.validateLatexState(this.value, emitErr);
      if (changed.has('value')) {
        this.formCtrl.setValue(this.value, { markDirty: false });
      }
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('value') || changed.has('displayMode')) {
      if (!this.wasSsrHydrated || this.deferRenderTimer === null) {
        this.renderFormulaPreview();
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
    this._engine = {
      renderLatex: (latex: string, displayMode = this.displayMode) => {
        if (!cachedKatex) {
          void loadKatex();
          return '';
        }
        return cachedKatex.renderToString(latex, {
          displayMode,
          throwOnError: true,
          output: 'html',
          strict: 'ignore',
        });
      },
      insertSymbol: (snippet: string) => {
        this.insertSymbol(snippet);
      },
      getLastError: () => {
        return this.parseError;
      },
      getThemeToken: (tokenName: string) => {
        return readHostTokenValue(this, tokenName) || this.tokenCache.get(tokenName) || '';
      },
      destroy: () => {
        // Released on disconnect
      },
    };
  }

  private validateLatexState(latex: string, emitError = false): void {
    const trimmed = latex.trim();
    if (!trimmed) {
      this.lastRenderedHtml = '';
      this.parseError = '';
      this.formCtrl.validate(this.textareaEl ?? undefined);
      return;
    }
    if (!cachedKatex) {
      void loadKatex().then(() => {
        if (this.isConnected) {
          this.validateLatexState(this.value, emitError);
          this.renderFormulaPreview();
        }
      });
      return;
    }
    try {
      this.lastRenderedHtml = cachedKatex.renderToString(trimmed, {
        displayMode: this.displayMode,
        throwOnError: true,
        output: 'html',
        strict: 'ignore',
      });
      this.parseError = '';
      this.formCtrl.validate(this.textareaEl ?? undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : this.t('invalidFormula');
      this.lastRenderedHtml = '';
      this.parseError = msg;
      this.formCtrl.setValidity({ customError: true }, msg, this.textareaEl ?? undefined);
      if (emitError) {
        this.emitEvent('mth-error', { detail: { message: msg } });
      }
    }
  }

  private renderFormulaPreview(): void {
    if (!this.previewEl) return;
    safeSetHTML(this.previewEl, this.lastRenderedHtml);
  }

  private insertSymbol(snippet: string): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const ta = this.textareaEl;
    if (!ta) {
      this.updateValueFromInput(`${this.value}${snippet}`);
      return;
    }
    const start = ta.selectionStart ?? this.value.length;
    const end = ta.selectionEnd ?? start;
    const nextValue = this.value.slice(0, start) + snippet + this.value.slice(end);
    this.updateValueFromInput(nextValue);
  }

  private updateValueFromInput(nextValue: string): void {
    this.value = nextValue;
    this.formCtrl.setValue(nextValue);
    this.renderFormulaPreview();
    this.emitEvent('mth-input', { detail: { value: nextValue } });
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.updateValueFromInput(target.value);
  }

  private handleBlur(): void {
    this.emitEvent('mth-change', { detail: { value: this.value } });
  }

  protected override render() {
    const labelText = this.label.trim() || this.t('editorLabel');
    const isBlocked = this.formCtrl.disabled || this.formCtrl.readOnly;
    const hasError = this.parseError.length > 0;

    return html`
      ${this.label.trim()
        ? html`<label part="label" id="mth-math-label" for="mth-math-textarea">${this.label}</label>`
        : nothing}
      <div
        part="base"
        role="group"
        aria-label=${this.label.trim() ? nothing : labelText}
        aria-labelledby=${this.label.trim() ? 'mth-math-label' : nothing}
      >
        <div part="toolbar" role="toolbar" aria-label=${this.t('toolbarLabel')}>
          ${QUICK_SYMBOLS.map(
            (item) => html`
              <button
                part="tool-button"
                type="button"
                aria-label=${this.t(item.labelKey)}
                ?disabled=${isBlocked}
                @click=${() => this.insertSymbol(item.snippet)}
              >
                ${item.symbol}
              </button>
            `,
          )}
          <slot name="toolbar"></slot>
        </div>

        <textarea
          id="mth-math-textarea"
          part="textarea"
          .value=${this.value}
          placeholder=${this.placeholder || this.t('placeholderFallback')}
          ?disabled=${this.formCtrl.disabled}
          ?readonly=${this.formCtrl.readOnly}
          ?required=${this.required}
          aria-label=${this.t('inputLabel')}
          aria-invalid=${hasError || this.formCtrl.invalid ? 'true' : nothing}
          aria-errormessage=${hasError ? 'mth-math-error' : nothing}
          @input=${this.handleInput}
          @blur=${this.handleBlur}
        ></textarea>

        <div
          id="mth-math-preview"
          part="preview"
          role="region"
          aria-label=${this.t('previewLabel')}
        ></div>

        ${hasError
          ? html`<div id="mth-math-error" part="error" role="status">${this.parseError}</div>`
          : nothing}

        <div part="fallback">
          <slot name="fallback"></slot>
        </div>
      </div>
    `;
  }
}
