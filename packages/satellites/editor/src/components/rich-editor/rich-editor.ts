import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, RovingFocusController } from '@methane/primitives';
import { escapeHtml, parseSafeFragment, sanitizeToTrustedHTML } from '@methane/sanitize';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { baseKeymap, setBlockType, toggleMark } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { DOMParser as PmDOMParser, DOMSerializer, Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes, wrapInList } from 'prosemirror-schema-list';
import { EditorState, type Command, type Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { readHostTokenValue, syncTokenStylesheet } from '../../shared/theme-sync.js';
import { richEditorMessages } from './rich-editor.messages.js';
import { richEditorStyles } from './rich-editor.styles.js';

const RICH_SCHEMA = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: basicSchema.spec.marks,
});

const TRACKED_TOKENS = [
  '--mth-color-surface',
  '--mth-color-bg-subtle',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-border',
  '--mth-color-border-focus',
  '--mth-color-accent',
] as const;

export interface RichEditorEngine {
  readonly view: EditorView | null;
  readonly state: EditorState;
  exec(command: Command): boolean;
  getThemeToken(tokenName: string): string;
  destroy(): void;
}

function serializeFragmentSafe(fragment: DocumentFragment | HTMLElement): string {
  const parts: Array<string> = [];
  for (const child of Array.from(fragment.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      parts.push((child as Element).outerHTML);
    } else if (child.nodeType === Node.TEXT_NODE) {
      parts.push(escapeHtml(child.textContent ?? ''));
    }
  }
  return String(sanitizeToTrustedHTML(parts.join('')));
}

function parseHtmlToPmDoc(rawHtml: string) {
  const doc = typeof document !== 'undefined' ? document : undefined;
  if (!doc || !rawHtml.trim()) {
    return RICH_SCHEMA.nodes.doc!.createAndFill()!;
  }
  const frag = parseSafeFragment(rawHtml, { ownerDocument: doc });
  const container = doc.createElement('div');
  container.appendChild(frag);
  return PmDOMParser.fromSchema(RICH_SCHEMA).parse(container);
}

/**
 * `<mth-rich-editor>`: Form-associated ProseMirror rich-text editor with accessible
 * formatting toolbar, `@methane/sanitize` HTML IO, and token synchronization.
 */
export class MthRichEditor extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = richEditorMessages;
  static override styles = [richEditorStyles];

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @state()
  private activeBold = false;

  @state()
  private activeItalic = false;

  @query('#mth-re-surface')
  private surfaceEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly rovingCtrl: RovingFocusController;

  private _engine: RichEditorEngine | null = null;
  private setEngineState: ((nextState: EditorState) => void) | null = null;
  private mountContainer: HTMLDivElement | null = null;
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
      validator: (ctx) => {
        if (ctx.required) {
          const isEmpty = this._engine
            ? this._engine.state.doc.textContent.trim().length === 0
            : String(ctx.value ?? '').replace(/<[^>]*>/g, '').trim().length === 0;
          if (isEmpty) {
            return { flags: { valueMissing: true }, message: this.t('requiredError') };
          }
        }
        return null;
      },
      onValueSync: (nextVal) => {
        this.value = nextVal;
        this.loadValueIntoEngine(nextVal);
      },
      onDisabledChange: () => {
        this.syncEditorAccess();
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

  get engine(): RichEditorEngine | null {
    return this._engine;
  }

  checkValidity(): boolean {
    const valid = this.formCtrl.checkValidity();
    this.syncEditorAccess();
    return valid;
  }

  reportValidity(): boolean {
    const valid = this.formCtrl.reportValidity();
    this.syncEditorAccess();
    return valid;
  }

  override formDisabledCallback(disabled: boolean): void {
    super.formDisabledCallback(disabled);
    this.formCtrl.handleFormDisabled(disabled);
    this.syncEditorAccess();
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
      !this.hasUpdated && Boolean(this.shadowRoot?.querySelector('#mth-re-surface'));
    super.connectedCallback();
    this.ensureEngine();
    this.syncThemeTokens();
    this.attachStyleObserver();
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
    this.setEngineState = null;
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

  execCommand(command: Command): boolean {
    if (!this._engine || this.formCtrl.disabled || this.formCtrl.readOnly) return false;
    return this._engine.exec(command);
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
    }
    if (changed.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (
      changed.has('disabled') ||
      changed.has('readonly') ||
      changed.has('required') ||
      changed.has('label') ||
      changed.has('placeholder')
    ) {
      this.syncEditorAccess(false);
    }
    if (changed.has('value')) {
      const safe = String(sanitizeToTrustedHTML(this.value));
      if (safe !== this.value) {
        this.value = safe;
      }
      this.formCtrl.setValue(safe, { markDirty: false });
      if (!this.updatingFromEngine) {
        this.loadValueIntoEngine(safe);
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

  private ensureEngine(): void {
    if (this._engine) return;
    const initialDoc = parseHtmlToPmDoc(this.value);
    let currentState = EditorState.create({
      schema: RICH_SCHEMA,
      doc: initialDoc,
      plugins: [
        history(),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-b': toggleMark(RICH_SCHEMA.marks.strong!),
          'Mod-i': toggleMark(RICH_SCHEMA.marks.em!),
        }),
        keymap(baseKeymap),
      ],
    });

    const container = typeof document !== 'undefined' ? document.createElement('div') : null;
    this.mountContainer = container;

    let view: EditorView | null = null;
    if (container) {
      try {
        view = new EditorView(container, {
          state: currentState,
          editable: () => !this.formCtrl.disabled && !this.formCtrl.readOnly,
          attributes: () => this.buildPmAttributes(),
          dispatchTransaction: (tr: Transaction) => {
            if (!view) return;
            const nextState = view.state.apply(tr);
            currentState = nextState;
            view.updateState(nextState);
            this.syncToolbarMarks(nextState);
            if (tr.docChanged) {
              this.handleDocChanged(nextState);
            }
          },
          handleDOMEvents: {
            blur: () => {
              this.emitEvent('mth-change', {
                detail: { value: this.value, html: this.value },
              });
              return false;
            },
          },
        });
      } catch {
        view = null;
      }
    }

    this.setEngineState = (nextState: EditorState) => {
      currentState = nextState;
    };

    this._engine = {
      get view() {
        return view;
      },
      get state() {
        return view?.state ?? currentState;
      },
      exec: (command: Command): boolean => {
        if (view) {
          const ok = command(view.state, view.dispatch, view);
          if (ok) view.focus();
          return ok;
        }
        return command(currentState, (tr) => {
          currentState = currentState.apply(tr);
          this.syncToolbarMarks(currentState);
          if (tr.docChanged) {
            this.handleDocChanged(currentState);
          }
        });
      },
      getThemeToken: (tokenName: string): string => {
        return readHostTokenValue(this, tokenName) || this.tokenCache.get(tokenName) || '';
      },
      destroy: () => {
        view?.destroy();
        view = null;
      },
    };
  }

  private buildPmAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      role: 'textbox',
      'aria-multiline': 'true',
      'aria-placeholder': this.placeholder || this.t('placeholderFallback'),
    };
    if (this.label.trim()) {
      attrs['aria-labelledby'] = 'mth-re-label';
    } else {
      attrs['aria-label'] = this.t('editorLabel');
    }
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

  private syncEditorAccess(triggerRender = true): void {
    this._engine?.view?.setProps({
      editable: () => !this.formCtrl.disabled && !this.formCtrl.readOnly,
      attributes: () => this.buildPmAttributes(),
    });
    if (triggerRender) {
      this.requestUpdate();
    }
  }

  private loadValueIntoEngine(htmlValue: string): void {
    if (!this._engine) return;
    const nextDoc = parseHtmlToPmDoc(htmlValue);
    const nextState = EditorState.create({
      schema: RICH_SCHEMA,
      doc: nextDoc,
      plugins: this._engine.state.plugins,
    });
    this.setEngineState?.(nextState);
    this._engine.view?.updateState(nextState);
    this.syncToolbarMarks(nextState);
  }

  private syncToolbarMarks(pmState: EditorState): void {
    const { from, $from, to, empty } = pmState.selection;
    const strong = RICH_SCHEMA.marks.strong!;
    const em = RICH_SCHEMA.marks.em!;
    if (empty) {
      this.activeBold = Boolean(strong.isInSet(pmState.storedMarks || $from.marks()));
      this.activeItalic = Boolean(em.isInSet(pmState.storedMarks || $from.marks()));
    } else {
      this.activeBold = pmState.doc.rangeHasMark(from, to, strong);
      this.activeItalic = pmState.doc.rangeHasMark(from, to, em);
    }
  }

  private handleDocChanged(pmState: EditorState): void {
    const frag = DOMSerializer.fromSchema(RICH_SCHEMA).serializeFragment(pmState.doc.content);
    const serialized = serializeFragmentSafe(frag);
    const isEmptyDoc = pmState.doc.textContent.trim() === '' && serialized === '<p></p>';
    const safeHtml = isEmptyDoc ? '' : serialized;
    this.updatingFromEngine = true;
    this.value = safeHtml;
    this.updatingFromEngine = false;
    this.formCtrl.setValue(safeHtml);
    this.emitEvent('mth-input', {
      detail: { value: safeHtml, html: safeHtml },
    });
  }

  protected override render() {
    const labelText = this.label.trim() || this.t('editorLabel');
    const isBlocked = this.formCtrl.disabled || this.formCtrl.readOnly;

    return html`
      ${this.label.trim()
        ? html`<label part="label" id="mth-re-label">${this.label}</label>`
        : nothing}
      <div
        part="base"
        role="group"
        aria-label=${this.label.trim() ? nothing : labelText}
        aria-labelledby=${this.label.trim() ? 'mth-re-label' : nothing}
      >
        <div part="toolbar" role="toolbar" aria-label=${this.t('toolbarLabel')}>
          <button
            part="tool-button"
            type="button"
            ?disabled=${isBlocked}
            aria-pressed=${this.activeBold ? 'true' : 'false'}
            @click=${() => this.execCommand(toggleMark(RICH_SCHEMA.marks.strong!))}
          >
            ${this.t('boldLabel')}
          </button>
          <button
            part="tool-button"
            type="button"
            ?disabled=${isBlocked}
            aria-pressed=${this.activeItalic ? 'true' : 'false'}
            @click=${() => this.execCommand(toggleMark(RICH_SCHEMA.marks.em!))}
          >
            ${this.t('italicLabel')}
          </button>
          <button
            part="tool-button"
            type="button"
            ?disabled=${isBlocked}
            @click=${() => this.execCommand(setBlockType(RICH_SCHEMA.nodes.heading!, { level: 2 }))}
          >
            ${this.t('headingLabel')}
          </button>
          <button
            part="tool-button"
            type="button"
            ?disabled=${isBlocked}
            @click=${() => this.execCommand(wrapInList(RICH_SCHEMA.nodes.bullet_list!))}
          >
            ${this.t('listLabel')}
          </button>
          <button
            part="tool-button"
            type="button"
            ?disabled=${isBlocked}
            @click=${() => this.execCommand(undo)}
          >
            ${this.t('undoLabel')}
          </button>
          <button
            part="tool-button"
            type="button"
            ?disabled=${isBlocked}
            @click=${() => this.execCommand(redo)}
          >
            ${this.t('redoLabel')}
          </button>
          <slot name="toolbar"></slot>
        </div>

        <div id="mth-re-surface" part="surface"></div>

        <div part="fallback">
          <slot name="fallback"></slot>
        </div>
      </div>
    `;
  }
}
