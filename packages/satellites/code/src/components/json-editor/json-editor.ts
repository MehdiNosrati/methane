import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { UIElement, type PropertyValues, type TemplateResult } from '@methane/core';
import { FormControlController, RovingFocusController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { readHostTokenValue, syncTokenStylesheet } from '../../shared/theme-sync.js';
import { jsonEditorMessages } from './json-editor.messages.js';
import type { JsonEditorMode } from './json-editor.spec.js';
import { jsonEditorStyles } from './json-editor.styles.js';

const TRACKED_TOKENS = [
  '--mth-color-surface',
  '--mth-color-bg-subtle',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-border',
  '--mth-color-border-focus',
  '--mth-color-accent',
] as const;

export interface JsonEditorEngine {
  readonly view: EditorView | null;
  readonly state: EditorState;
  readonly isValid: boolean;
  format(): boolean;
  getParsedValue(): unknown;
  getThemeToken(tokenName: string): string;
  destroy(): void;
}

interface ParsedJsonResult {
  readonly valid: boolean;
  readonly parsed: unknown;
  readonly error: string;
}

function parseJsonSafe(raw: string): ParsedJsonResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: true, parsed: undefined, error: '' };
  }
  try {
    return { valid: true, parsed: JSON.parse(trimmed), error: '' };
  } catch (err) {
    return {
      valid: false,
      parsed: undefined,
      error: err instanceof Error ? err.message : 'Invalid JSON',
    };
  }
}

/**
 * `<mth-json-editor>`: Form-associated CodeMirror 6 JSON editor with live syntax
 * validation, prettify formatting, and collapsible interactive tree view.
 */
export class MthJsonEditor extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = jsonEditorMessages;
  static override styles = [jsonEditorStyles];

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  mode: JsonEditorMode = 'code';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @state()
  private parseError = '';

  @state()
  private parsedData: unknown = undefined;

  @query('#mth-je-surface')
  private surfaceEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly rovingCtrl: RovingFocusController;

  private _engine: JsonEditorEngine | null = null;
  private syncHeadlessDoc: ((nextVal: string) => void) | null = null;
  private mountContainer: HTMLDivElement | null = null;
  private editableCompartment = new Compartment();
  private readonlyCompartment = new Compartment();
  private ariaCompartment = new Compartment();
  private tokenSheet: CSSStyleSheet | null = null;
  private readonly tokenCache = new Map<string, string>();
  private styleObserver: MutationObserver | null = null;
  private deferMountTimer: ReturnType<typeof setTimeout> | null = null;
  private wasSsrHydrated = false;
  private updatingFromEngine = false;

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
        this.validateJsonState(nextVal);
        this.loadValueIntoEngine(nextVal);
      },
      onDisabledChange: () => {
        this.reconfigureAccess();
        this.requestUpdate();
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

  get engine(): JsonEditorEngine | null {
    return this._engine;
  }

  checkValidity(): boolean {
    const valid = this.formCtrl.checkValidity();
    this.reconfigureAccess();
    return valid;
  }

  reportValidity(): boolean {
    const valid = this.formCtrl.reportValidity();
    this.reconfigureAccess();
    return valid;
  }

  format(): boolean {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return false;
    const res = parseJsonSafe(this.value);
    if (!res.valid || res.parsed === undefined) return false;
    const formatted = JSON.stringify(res.parsed, null, 2);
    this.value = formatted;
    this.formCtrl.setValue(formatted);
    this.loadValueIntoEngine(formatted);
    this.emitEvent('mth-change', { detail: { value: formatted, valid: true } });
    return true;
  }

  override formDisabledCallback(disabled: boolean): void {
    super.formDisabledCallback(disabled);
    this.formCtrl.handleFormDisabled(disabled);
    this.reconfigureAccess();
  }

  override formResetCallback(): void {
    this.formCtrl.handleFormReset();
  }

  override formStateRestoreCallback(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  override connectedCallback(): void {
    this.wasSsrHydrated =
      !this.hasUpdated && Boolean(this.shadowRoot?.querySelector('#mth-je-surface'));
    super.connectedCallback();
    this.ensureEngine();
    this.attachStyleObserver();
    this.syncThemeTokens();
    if (this.hasUpdated) {
      this.attachMountToSurface();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.deferMountTimer !== null) {
      clearTimeout(this.deferMountTimer);
      this.deferMountTimer = null;
    }
    this.wasSsrHydrated = false;
    this.styleObserver?.disconnect();
    this.styleObserver = null;
    this._engine?.destroy();
    this._engine = null;
    this.syncHeadlessDoc = null;
    this.mountContainer?.remove();
    this.mountContainer = null;
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
      this.deferMountTimer = setTimeout(() => {
        this.deferMountTimer = null;
        this.attachMountToSurface();
      }, 0);
    } else {
      this.attachMountToSurface();
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
      this.reconfigureAccess();
    }
    if (changed.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
      this.reconfigureAccess();
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
      this.reconfigureAccess();
    }
    if (changed.has('label')) {
      this.reconfigureAccess();
    }
    if (changed.has('mode')) {
      this.setCustomState('split', this.mode === 'split');
    }
    if (changed.has('value')) {
      this.validateJsonState(this.value);
      this.formCtrl.setValue(this.value, { markDirty: false });
      if (!this.updatingFromEngine) {
        this.loadValueIntoEngine(this.value);
      }
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('mode') && changed.get('mode') !== undefined) {
      this.attachMountToSurface();
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

  private attachMountToSurface(): void {
    if (!this.surfaceEl || !this.mountContainer) return;
    if (this.mountContainer.parentElement !== this.surfaceEl) {
      this.surfaceEl.replaceChildren(this.mountContainer);
    }
  }

  private buildCmContentAttributes(): Record<string, string> {
    const hasParseError = this.parseError.length > 0;
    const isInvalid = hasParseError || this.formCtrl.invalid;
    const attrs: Record<string, string> = {
      'aria-label': this.label.trim() || this.t('surfaceLabel'),
    };
    if (this.formCtrl.disabled) {
      attrs['aria-disabled'] = 'true';
    }
    if (this.formCtrl.readOnly) {
      attrs['aria-readonly'] = 'true';
    }
    if (isInvalid) {
      attrs['aria-invalid'] = 'true';
    }
    if (hasParseError) {
      attrs['aria-errormessage'] = 'mth-je-error';
    }
    return attrs;
  }

  private ensureEngine(): void {
    if (this._engine) return;
    this.editableCompartment = new Compartment();
    this.readonlyCompartment = new Compartment();
    this.ariaCompartment = new Compartment();

    const blocked = this.formCtrl.disabled || this.formCtrl.readOnly;
    let currentState = EditorState.create({
      doc: this.value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        this.ariaCompartment.of(EditorView.contentAttributes.of(this.buildCmContentAttributes())),
        this.editableCompartment.of(EditorView.editable.of(!blocked)),
        this.readonlyCompartment.of(EditorState.readOnly.of(blocked)),
        EditorView.theme({
          '&': {
            backgroundColor: 'var(--_je-surface)',
            color: 'var(--_je-fg)',
          },
          '&.cm-focused': {
            outline: '2px solid var(--_je-focus)',
            outlineOffset: '-2px',
          },
        }),
        EditorView.updateListener.of((update) => {
          currentState = update.state;
          if (update.docChanged && !this.updatingFromEngine) {
            const nextVal = update.state.doc.toString();
            this.updatingFromEngine = true;
            this.value = nextVal;
            this.updatingFromEngine = false;
            const valid = this.validateJsonState(nextVal);
            this.formCtrl.setValue(nextVal);
            this.emitEvent('mth-input', { detail: { value: nextVal, valid } });
          }
        }),
        EditorView.domEventHandlers({
          blur: () => {
            this.emitEvent('mth-change', {
              detail: { value: this.value, valid: this.parseError.length === 0 },
            });
            return false;
          },
        }),
      ],
    });

    const container = typeof document !== 'undefined' ? document.createElement('div') : null;
    this.mountContainer = container;

    let view: EditorView | null = null;
    if (container) {
      try {
        view = new EditorView({
          state: currentState,
          parent: container,
        });
      } catch {
        view = null;
      }
    }

    const readParsed = () => this.parsedData;
    const readValid = () => this.parseError.length === 0;

    this.syncHeadlessDoc = (nextVal: string) => {
      const current = currentState.doc.toString();
      if (current === nextVal) return;
      currentState = currentState.update({
        changes: { from: 0, to: current.length, insert: nextVal },
      }).state;
    };

    this._engine = {
      get view() {
        return view;
      },
      get state() {
        return view?.state ?? currentState;
      },
      get isValid() {
        return readValid();
      },
      format: () => this.format(),
      getParsedValue: () => readParsed(),
      getThemeToken: (tokenName: string) =>
        readHostTokenValue(this, tokenName) || this.tokenCache.get(tokenName) || '',
      destroy: () => {
        view?.destroy();
        view = null;
      },
    };
  }

  private validateJsonState(raw: string): boolean {
    const res = parseJsonSafe(raw);
    this.parseError = res.error;
    this.parsedData = res.parsed;
    if (!res.valid) {
      this.formCtrl.setValidity({ customError: true }, res.error);
      this.reconfigureAccess();
      return false;
    }
    this.formCtrl.validate();
    this.reconfigureAccess();
    return true;
  }

  private reconfigureAccess(): void {
    const view = this._engine?.view;
    if (!view) return;
    const blocked = this.formCtrl.disabled || this.formCtrl.readOnly;
    view.dispatch({
      effects: [
        this.editableCompartment.reconfigure(EditorView.editable.of(!blocked)),
        this.readonlyCompartment.reconfigure(EditorState.readOnly.of(blocked)),
        this.ariaCompartment.reconfigure(
          EditorView.contentAttributes.of(this.buildCmContentAttributes()),
        ),
      ],
    });
  }

  private loadValueIntoEngine(nextVal: string): void {
    const view = this._engine?.view;
    if (!view) {
      this.syncHeadlessDoc?.(nextVal);
      return;
    }
    const current = view.state.doc.toString();
    if (current === nextVal) return;
    this.updatingFromEngine = true;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: nextVal },
    });
    this.updatingFromEngine = false;
  }

  private setMode(nextMode: JsonEditorMode): void {
    if (this.mode === nextMode) return;
    this.mode = nextMode;
    this.emitEvent('mth-mode-change', { detail: { mode: nextMode } });
  }

  private renderJsonNode(nodeValue: unknown, keyLabel?: string, depth = 0): TemplateResult {
    if (depth > 16 || nodeValue === null || typeof nodeValue !== 'object') {
      const formatted = nodeValue === undefined ? 'undefined' : JSON.stringify(nodeValue);
      return html`
        <div class="je-node">
          ${keyLabel !== undefined ? html`<span class="je-key">${keyLabel}: </span>` : nothing}
          <span class="je-primitive">${formatted}</span>
        </div>
      `;
    }

    const entries: Array<[string, unknown]> = Array.isArray(nodeValue)
      ? nodeValue.map((v, idx) => [String(idx), v])
      : Object.entries(nodeValue as Record<string, unknown>);

    return html`
      <details class="je-node" ?open=${depth < 2}>
        <summary>
          ${keyLabel !== undefined ? html`<span class="je-key">${keyLabel}: </span>` : nothing}
          <span>${Array.isArray(nodeValue) ? `[${entries.length}]` : `{${entries.length}}`}</span>
        </summary>
        ${entries.map(([k, v]) => this.renderJsonNode(v, k, depth + 1))}
      </details>
    `;
  }

  protected override render() {
    const labelText = this.label.trim() || this.t('editorLabel');
    const showCode = this.mode === 'code' || this.mode === 'split';
    const showTree = this.mode === 'tree' || this.mode === 'split';
    const hasError = this.parseError.length > 0;
    const isBlocked = this.formCtrl.disabled || this.formCtrl.readOnly;

    return html`
      ${this.label.trim()
        ? html`<label part="label" id="mth-je-label">${this.label}</label>`
        : nothing}
      <div
        part="base"
        role="group"
        aria-label=${this.label.trim() ? nothing : labelText}
        aria-labelledby=${this.label.trim() ? 'mth-je-label' : nothing}
      >
        <div part="header">
          <div class="je-controls" role="toolbar" aria-label=${this.t('toolbarLabel')}>
            <button
              part="tool-button"
              type="button"
              ?disabled=${this.formCtrl.disabled}
              aria-pressed=${this.mode === 'code' ? 'true' : 'false'}
              @click=${() => this.setMode('code')}
            >
              ${this.t('codeModeLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              ?disabled=${this.formCtrl.disabled}
              aria-pressed=${this.mode === 'tree' ? 'true' : 'false'}
              @click=${() => this.setMode('tree')}
            >
              ${this.t('treeModeLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              ?disabled=${this.formCtrl.disabled}
              aria-pressed=${this.mode === 'split' ? 'true' : 'false'}
              @click=${() => this.setMode('split')}
            >
              ${this.t('splitModeLabel')}
            </button>
            <button
              part="tool-button"
              type="button"
              ?disabled=${isBlocked || hasError}
              @click=${() => this.format()}
            >
              ${this.t('formatLabel')}
            </button>
            <slot name="toolbar"></slot>
          </div>
        </div>

        <div part="panes">
          ${showCode
            ? html`<div id="mth-je-surface" part="surface"></div>`
            : nothing}
          ${showTree
            ? html`
                <div part="tree" role="region" aria-label=${this.t('treeRegionLabel')}>
                  ${this.parsedData !== undefined
                    ? this.renderJsonNode(this.parsedData)
                    : html`<span>${hasError ? this.t('invalidJsonError') : this.t('validStatus')}</span>`}
                </div>
              `
            : nothing}
        </div>

        ${hasError
          ? html`<div id="mth-je-error" part="error" role="status">${this.parseError}</div>`
          : nothing}

        <div part="fallback">
          <slot name="fallback"></slot>
        </div>
      </div>
    `;
  }
}
