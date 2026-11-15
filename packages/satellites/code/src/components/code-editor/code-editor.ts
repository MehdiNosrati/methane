import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { readHostTokenValue, syncTokenStylesheet } from '../../shared/theme-sync.js';
import { codeEditorMessages } from './code-editor.messages.js';
import { codeEditorStyles } from './code-editor.styles.js';

const TRACKED_TOKENS = [
  '--mth-color-surface',
  '--mth-color-bg-subtle',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-border',
  '--mth-color-border-focus',
  '--mth-color-accent',
] as const;

export interface CodeEditorEngine {
  readonly view: EditorView | null;
  readonly state: EditorState;
  setTabTrapsFocus(enabled: boolean): void;
  getThemeToken(tokenName: string): string;
  destroy(): void;
}

/**
 * `<mth-code-editor>`: Form-associated CodeMirror 6 wrapper with accessible
 * non-trapping Tab escape toggle, `--mth-*` token synchronization, and SSR purity.
 */
export class MthCodeEditor extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = codeEditorMessages;
  static override styles = [codeEditorStyles];

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  language = 'typescript';

  @property({ type: Boolean, reflect: true, attribute: 'tab-traps-focus' })
  tabTrapsFocus = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @query('#mth-ce-surface')
  private surfaceEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;

  private _engine: CodeEditorEngine | null = null;
  private syncHeadlessDoc: ((nextVal: string) => void) | null = null;
  private mountContainer: HTMLDivElement | null = null;
  private tabCompartment = new Compartment();
  private editableCompartment = new Compartment();
  private readonlyCompartment = new Compartment();
  private ariaCompartment = new Compartment();
  private themeCompartment = new Compartment();
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
        this.loadValueIntoEngine(nextVal);
      },
      onDisabledChange: () => {
        this.reconfigureAccess();
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
    });
  }

  get engine(): CodeEditorEngine | null {
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
      !this.hasUpdated && Boolean(this.shadowRoot?.querySelector('#mth-ce-surface'));
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
    if (changed.has('tabTrapsFocus')) {
      this.setCustomState('tab-trap', this.tabTrapsFocus);
      this.reconfigureTabKeymap();
    }
    if (changed.has('value')) {
      this.formCtrl.setValue(this.value, { markDirty: false });
      if (!this.updatingFromEngine) {
        this.loadValueIntoEngine(this.value);
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

  private attachMountToSurface(): void {
    if (!this.surfaceEl || !this.mountContainer) return;
    if (this.mountContainer.parentElement !== this.surfaceEl) {
      this.surfaceEl.replaceChildren(this.mountContainer);
    }
  }

  private buildCmThemeExtension() {
    return EditorView.theme({
      '&': {
        backgroundColor: 'var(--_ce-surface)',
        color: 'var(--_ce-fg)',
      },
      '.cm-content': {
        caretColor: 'var(--_ce-accent)',
      },
      '&.cm-focused': {
        outline: '2px solid var(--_ce-focus)',
        outlineOffset: '-2px',
      },
    });
  }

  private buildCmContentAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      'aria-label': this.label.trim() || this.t('surfaceLabel'),
    };
    if (this.formCtrl.disabled) {
      attrs['aria-disabled'] = 'true';
    }
    if (this.formCtrl.readOnly) {
      attrs['aria-readonly'] = 'true';
    }
    if (this.formCtrl.invalid) {
      attrs['aria-invalid'] = 'true';
    }
    return attrs;
  }

  private ensureEngine(): void {
    if (this._engine) return;
    this.tabCompartment = new Compartment();
    this.editableCompartment = new Compartment();
    this.readonlyCompartment = new Compartment();
    this.ariaCompartment = new Compartment();
    this.themeCompartment = new Compartment();

    const blocked = this.formCtrl.disabled || this.formCtrl.readOnly;
    let currentState = EditorState.create({
      doc: this.value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        this.ariaCompartment.of(EditorView.contentAttributes.of(this.buildCmContentAttributes())),
        this.tabCompartment.of(this.tabTrapsFocus ? keymap.of([indentWithTab]) : []),
        this.editableCompartment.of(EditorView.editable.of(!blocked)),
        this.readonlyCompartment.of(EditorState.readOnly.of(blocked)),
        this.themeCompartment.of(this.buildCmThemeExtension()),
        EditorView.updateListener.of((update) => {
          currentState = update.state;
          if (update.docChanged && !this.updatingFromEngine) {
            const nextVal = update.state.doc.toString();
            this.updatingFromEngine = true;
            this.value = nextVal;
            this.updatingFromEngine = false;
            this.formCtrl.setValue(nextVal);
            this.emitEvent('mth-input', { detail: { value: nextVal } });
          }
        }),
        EditorView.domEventHandlers({
          blur: () => {
            this.emitEvent('mth-change', { detail: { value: this.value } });
            return false;
          },
          keydown: (event) => {
            if (event.key === 'Escape' && this.tabTrapsFocus) {
              this.tabTrapsFocus = false;
              this.reconfigureTabKeymap();
              return false;
            }
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
      setTabTrapsFocus: (enabled: boolean) => {
        this.tabTrapsFocus = enabled;
        this.reconfigureTabKeymap();
      },
      getThemeToken: (tokenName: string) =>
        readHostTokenValue(this, tokenName) || this.tokenCache.get(tokenName) || '',
      destroy: () => {
        view?.destroy();
        view = null;
      },
    };
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

  private reconfigureTabKeymap(): void {
    const view = this._engine?.view;
    if (!view) return;
    view.dispatch({
      effects: this.tabCompartment.reconfigure(
        this.tabTrapsFocus ? keymap.of([indentWithTab]) : [],
      ),
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

  protected override render() {
    const labelText = this.label.trim() || this.t('editorLabel');

    return html`
      ${this.label.trim()
        ? html`<label part="label" id="mth-ce-label">${this.label}</label>`
        : nothing}
      <div
        part="base"
        role="group"
        aria-label=${this.label.trim() ? nothing : labelText}
        aria-labelledby=${this.label.trim() ? 'mth-ce-label' : nothing}
      >
        <div part="header">
          <div class="ce-meta">
            <span>${this.language}</span>
            ${this.formCtrl.readOnly ? html`<span>${this.t('readonlyBadge')}</span>` : nothing}
          </div>
          <div class="ce-meta">
            <slot name="toolbar"></slot>
            <button
              part="tab-toggle"
              type="button"
              ?disabled=${this.formCtrl.disabled}
              aria-pressed=${this.tabTrapsFocus ? 'true' : 'false'}
              @click=${() => {
                this.tabTrapsFocus = !this.tabTrapsFocus;
              }}
            >
              ${this.tabTrapsFocus ? this.t('tabToggleIndent') : this.t('tabToggleFocus')}
            </button>
          </div>
        </div>

        <div id="mth-ce-surface" part="surface"></div>

        <div part="fallback">
          <slot name="fallback"></slot>
        </div>
      </div>
    `;
  }
}
