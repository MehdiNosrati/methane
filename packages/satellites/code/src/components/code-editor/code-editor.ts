import type { Compartment, EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { UIElement, type PropertyValues } from '@methane-ui/core';
import { FormControlController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import {
  isBrowserDom,
  loadCodeMirrorModules,
  type LoadedCodeMirror,
} from '../../shared/codemirror-loader.js';
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
  private cm: LoadedCodeMirror | null = null;
  private syncHeadlessDoc: ((nextVal: string) => void) | null = null;
  private mountContainer: HTMLDivElement | null = null;
  private tabCompartment: Compartment | null = null;
  private editableCompartment: Compartment | null = null;
  private readonlyCompartment: Compartment | null = null;
  private ariaCompartment: Compartment | null = null;
  private tokenSheet: CSSStyleSheet | null = null;
  private readonly tokenCache = new Map<string, string>();
  private styleObserver: MutationObserver | null = null;
  private deferMountTimer: ReturnType<typeof setTimeout> | null = null;
  private wasSsrHydrated = false;
  private updatingFromEngine = false;
  private mountToken = 0;
  private pendingEnginePromise: Promise<void> | null = null;

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
    if (this.hasUpdated && !this.wasSsrHydrated) {
      this.attachMountToSurface();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.mountToken += 1;
    this.pendingEnginePromise = null;
    if (this.deferMountTimer !== null) {
      clearTimeout(this.deferMountTimer);
      this.deferMountTimer = null;
    }
    this.wasSsrHydrated = false;
    this.styleObserver?.disconnect();
    this.styleObserver = null;
    this._engine?.destroy();
    this._engine = null;
    this.cm = null;
    this.tabCompartment = null;
    this.editableCompartment = null;
    this.readonlyCompartment = null;
    this.ariaCompartment = null;
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

  protected override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    if (!this.wasSsrHydrated && this.pendingEnginePromise) {
      await this.pendingEnginePromise;
    }
    return result;
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    this.syncThemeTokens();
    if (this.wasSsrHydrated) {
      this.deferMountTimer = setTimeout(() => {
        this.wasSsrHydrated = false;
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

  private buildCmThemeExtension(cm: LoadedCodeMirror) {
    return cm.EditorView.theme({
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
    this.mountToken += 1;
    const token = this.mountToken;

    let headlessValue = this.value;
    let currentState: EditorState | null = null;
    let view: EditorView | null = null;
    let destroyed = false;

    const getHeadlessState = (): EditorState =>
      ({
        doc: {
          toString: () => headlessValue,
          get length() {
            return headlessValue.length;
          },
        },
      }) as unknown as EditorState;

    const mountCodeMirror = (cm: LoadedCodeMirror): void => {
      if (destroyed || token !== this.mountToken || !this.isConnected) return;
      this.cm = cm;
      const tabComp = new cm.Compartment();
      const editableComp = new cm.Compartment();
      const readonlyComp = new cm.Compartment();
      const ariaComp = new cm.Compartment();
      const themeComp = new cm.Compartment();
      this.tabCompartment = tabComp;
      this.editableCompartment = editableComp;
      this.readonlyCompartment = readonlyComp;
      this.ariaCompartment = ariaComp;

      const blocked = this.formCtrl.disabled || this.formCtrl.readOnly;
      currentState = cm.EditorState.create({
        doc: headlessValue,
        extensions: [
          cm.history(),
          cm.keymap.of([...cm.defaultKeymap, ...cm.historyKeymap]),
          ariaComp.of(cm.EditorView.contentAttributes.of(this.buildCmContentAttributes())),
          tabComp.of(this.tabTrapsFocus ? cm.keymap.of([cm.indentWithTab]) : []),
          editableComp.of(cm.EditorView.editable.of(!blocked)),
          readonlyComp.of(cm.EditorState.readOnly.of(blocked)),
          themeComp.of(this.buildCmThemeExtension(cm)),
          cm.EditorView.updateListener.of((update) => {
            currentState = update.state;
            if (update.docChanged && !this.updatingFromEngine) {
              const nextVal = update.state.doc.toString();
              headlessValue = nextVal;
              this.updatingFromEngine = true;
              this.value = nextVal;
              this.updatingFromEngine = false;
              this.formCtrl.setValue(nextVal);
              this.emitEvent('mth-input', { detail: { value: nextVal } });
            }
          }),
          cm.EditorView.domEventHandlers({
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

      const container = document.createElement('div');
      this.mountContainer = container;

      try {
        view = new cm.EditorView({
          state: currentState,
          parent: container,
        });
      } catch {
        view = null;
      }

      if (!this.wasSsrHydrated) {
        this.attachMountToSurface();
      }
    };

    this.syncHeadlessDoc = (nextVal: string) => {
      headlessValue = nextVal;
    };

    this._engine = {
      get view() {
        return view;
      },
      get state() {
        return view?.state ?? currentState ?? getHeadlessState();
      },
      setTabTrapsFocus: (enabled: boolean) => {
        this.tabTrapsFocus = enabled;
        this.reconfigureTabKeymap();
      },
      getThemeToken: (tokenName: string) =>
        readHostTokenValue(this, tokenName) || this.tokenCache.get(tokenName) || '',
      destroy: () => {
        destroyed = true;
        view?.destroy();
        view = null;
        currentState = null;
      },
    };

    if (isBrowserDom()) {
      this.pendingEnginePromise = loadCodeMirrorModules()
        .then((cm) => {
          mountCodeMirror(cm);
        })
        .catch(() => {
          // Graceful headless fallback if CodeMirror chunk fails to load
        });
    }
  }

  private reconfigureAccess(): void {
    const view = this._engine?.view;
    const cm = this.cm;
    if (
      !view ||
      !cm ||
      !this.editableCompartment ||
      !this.readonlyCompartment ||
      !this.ariaCompartment
    ) {
      return;
    }
    const blocked = this.formCtrl.disabled || this.formCtrl.readOnly;
    view.dispatch({
      effects: [
        this.editableCompartment.reconfigure(cm.EditorView.editable.of(!blocked)),
        this.readonlyCompartment.reconfigure(cm.EditorState.readOnly.of(blocked)),
        this.ariaCompartment.reconfigure(
          cm.EditorView.contentAttributes.of(this.buildCmContentAttributes()),
        ),
      ],
    });
  }

  private reconfigureTabKeymap(): void {
    const view = this._engine?.view;
    const cm = this.cm;
    if (!view || !cm || !this.tabCompartment) return;
    view.dispatch({
      effects: this.tabCompartment.reconfigure(
        this.tabTrapsFocus ? cm.keymap.of([cm.indentWithTab]) : [],
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
