import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { ContextConsumer } from '@lit/context';
import { LitElement, type PropertyValues } from 'lit';
import {
  DEFAULT_LOCALE_CONTEXT,
  LOCALE_CONTEXT,
  type LocaleContextValue,
} from './context.js';
import { devWarn, isDevMode } from './env.js';
import {
  inferDirectionFromLocale,
  normalizeLocale,
  translateMessage,
  type MessageCatalog,
} from './i18n.js';
import { getRuntime, type MethaneRuntime } from './runtime.js';

const ARIA_IDREF_ATTRS: ReadonlyArray<string> = [
  'aria-labelledby',
  'aria-describedby',
  'aria-errormessage',
  'aria-controls',
  'aria-activedescendant',
  'aria-owns',
  'aria-flowto',
  'aria-details',
];

const INTERACTIVE_ROLES_REQUIRING_NAME: ReadonlySet<string> = new Set([
  'button',
  'textbox',
  'combobox',
  'listbox',
  'checkbox',
  'switch',
  'slider',
  'dialog',
  'alertdialog',
  'tab',
  'menuitem',
]);

/**
 * Thin human-owned base class wrapping Lit 3 (ADR-001).
 * Adds exactly 5 capabilities:
 *  1. DSD in-place hydration & moveBefore/reconnect idempotency
 *  2. FACE ElementInternals wiring (without mutating host `disabled`)
 *  3. CustomStateSet (`:state()`) helpers
 *  4. Reactive i18n message-catalog lookup
 *  5. Tree-shakable `__DEV__` diagnostics
 */
export class UIElement extends LitElement {
  /** Override in subclasses to specify co-located English default i18n messages. */
  static messages: MessageCatalog = {};

  /** Namespace used for i18n catalog lookup (defaults to tag name). */
  static i18nNamespace?: string;

  protected readonly internals: ElementInternals | null;
  protected _formDisabled = false;

  private readonly _customStates = new Set<string>();
  private _baseAdoptedSheets: CSSStyleSheet[] = [];
  private _styleUnsubscribe: (() => void) | null = null;
  private _connectedInitialized = false;
  private _localeConsumer: ContextConsumer<typeof LOCALE_CONTEXT, this> | null = null;
  private _localeContext: LocaleContextValue = DEFAULT_LOCALE_CONTEXT;

  constructor() {
    super();
    this.internals =
      typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    this._localeConsumer = new ContextConsumer(this, {
      context: LOCALE_CONTEXT,
      subscribe: true,
      callback: (value) => {
        this._localeContext = value ?? DEFAULT_LOCALE_CONTEXT;
        this.requestUpdate();
      },
    });
  }

  protected get runtime(): MethaneRuntime {
    return getRuntime();
  }

  /** Associated `<label>` elements via `ElementInternals.labels` (only on form-associated elements). */
  get labels(): NodeList | null {
    const ctor = this.constructor as { formAssociated?: boolean };
    if (!ctor.formAssociated || !this.internals) return null;
    try {
      return this.internals.labels ?? null;
    } catch {
      return null;
    }
  }

  /** Current locale resolved via LocaleContext -> host/ancestor `[lang]` -> `'en'`. */
  protected get resolvedLocale(): string {
    const explicit = this.getAttribute('lang');
    if (explicit) return normalizeLocale(explicit);
    if (this._localeConsumer && this._localeContext.locale) {
      return normalizeLocale(this._localeContext.locale);
    }
    const docLang = typeof document !== 'undefined' ? document.documentElement?.lang : '';
    return normalizeLocale(docLang || 'en');
  }

  /** Current writing direction resolved via host `[dir]` -> LocaleContext -> locale default. */
  protected get resolvedDir(): 'ltr' | 'rtl' {
    const explicitDir = this.getAttribute('dir');
    if (explicitDir === 'rtl' || explicitDir === 'ltr') return explicitDir;
    if (this._localeContext.dir === 'rtl' || this._localeContext.dir === 'ltr') {
      return this._localeContext.dir;
    }
    return inferDirectionFromLocale(this.resolvedLocale);
  }

  /** Reactive i18n message lookup with pluralization and RTL-safe bidi isolation. */
  protected t(
    key: string,
    params?: Readonly<Record<string, string | number>>,
    fallback?: string,
  ): string {
    const ctor = this.constructor as typeof UIElement;
    const namespace = ctor.i18nNamespace ?? this.localName;
    return translateMessage(namespace, key, {
      locale: this.resolvedLocale,
      ...(params !== undefined ? { params } : {}),
      ...(this._localeContext.messages !== undefined
        ? { contextOverrides: this._localeContext.messages }
        : {}),
      defaults: ctor.messages,
      ...(fallback !== undefined ? { fallback } : {}),
    });
  }

  /** Updates both `ElementInternals.states` (`:state()`) and internal fallback state tracking. */
  protected setCustomState(name: string, active: boolean): void {
    if (active) {
      this._customStates.add(name);
    } else {
      this._customStates.delete(name);
    }

    const states = this.internals?.states as
      | { add(state: string): void; delete(state: string): void }
      | undefined;
    if (states) {
      try {
        if (active) states.add(name);
        else states.delete(name);
      } catch {
        // Ignore engines with restrictive CustomStateSet syntax on legacy state tokens.
      }
    }
  }

  public hasCustomState(name: string): boolean {
    const states = this.internals?.states as { has?(state: string): boolean } | undefined;
    if (states && typeof states.has === 'function') {
      return states.has(name) || this._customStates.has(name);
    }
    return this._customStates.has(name);
  }

  protected setFormValue(
    value: File | string | FormData | null,
    state?: File | string | FormData | null,
  ): void {
    this.internals?.setFormValue?.(value, state);
  }

  protected setValidity(
    flags?: ValidityStateFlags,
    message?: string,
    anchor?: HTMLElement,
  ): void {
    this.internals?.setValidity?.(flags, message, anchor);
  }

  /**
   * Dispatches a Methane custom event (`mth-*`) or native `input`/`change` event.
   */
  protected emitEvent<T = undefined>(
    name: `mth-${string}` | 'input' | 'change',
    options?: CustomEventInit<T>,
  ): boolean {
    return this.dispatchEvent(
      new CustomEvent<T>(name, {
        bubbles: true,
        composed: true,
        ...options,
      }),
    );
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();
    if (root instanceof ShadowRoot && 'adoptedStyleSheets' in root) {
      this._baseAdoptedSheets = [...root.adoptedStyleSheets];
      this.syncRuntimeStyles(root);
    }
    return root;
  }

  private syncRuntimeStyles(root: ShadowRoot | null = this.shadowRoot): void {
    if (!root || !('adoptedStyleSheets' in root)) return;
    const overrides = this.runtime.styles.getSheetsForTag(this.localName);
    root.adoptedStyleSheets = [...this._baseAdoptedSheets, ...overrides];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._styleUnsubscribe) {
      this._styleUnsubscribe = this.runtime.styles.subscribe((target) => {
        if (target === '*' || target === this.localName) {
          this.syncRuntimeStyles();
        }
      });
    }
    this.syncRuntimeStyles();
    if (!this._connectedInitialized) {
      this._connectedInitialized = true;
      this.onFirstConnect();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._styleUnsubscribe?.();
    this._styleUnsubscribe = null;
  }

  /** Lifecycle hook invoked by `Node.prototype.moveBefore()` without teardown. */
  connectedMoveCallback(): void {
    if (!this._connectedInitialized) {
      this.connectedCallback();
    }
    this.syncRuntimeStyles();
    this.onMoveBefore();
  }

  /** FACE callback: updates internal disabled state without mutating host `disabled` attribute (ADR-014). */
  formDisabledCallback(disabled: boolean): void {
    this._formDisabled = disabled;
    this.setCustomState('disabled', disabled);
    this.onFormDisabled(disabled);
    this.requestUpdate();
  }

  formResetCallback(): void {
    this.onFormReset();
  }

  formStateRestoreCallback(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.onFormStateRestore(state, mode);
  }

  protected onFirstConnect(): void {}
  protected onMoveBefore(): void {}
  protected onFormDisabled(_disabled: boolean): void {}
  protected onFormReset(): void {}
  protected onFormStateRestore(
    _state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {}

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (isDevMode()) {
      this.runDevDiagnostics();
    }
  }

  protected runDevDiagnostics(): void {
    const ctor = this.constructor as typeof LitElement & {
      shadowRootOptions?: { delegatesFocus?: boolean };
    };
    const delegatesFocus =
      (this.shadowRoot && 'delegatesFocus' in this.shadowRoot
        ? (this.shadowRoot as ShadowRoot & { delegatesFocus?: boolean }).delegatesFocus
        : undefined) ?? ctor.shadowRootOptions?.delegatesFocus;

    if (delegatesFocus && (this.hasAttribute('role') || this.internals?.role)) {
      devWarn(
        `<${this.localName}> combines delegatesFocus: true with host role ("${this.getAttribute('role') ?? this.internals?.role}"). Remove host role per ADR-014.`,
      );
    }

    const root = this.shadowRoot;
    if (!root) return;

    const localIds = new Set<string>();
    for (const el of root.querySelectorAll('[id]')) {
      if (el.id) localIds.add(el.id);
    }

    for (const el of root.querySelectorAll('*')) {
      for (const attr of ARIA_IDREF_ATTRS) {
        const val = el.getAttribute(attr);
        if (!val) continue;
        for (const idRef of val.trim().split(/\s+/)) {
          if (!localIds.has(idRef)) {
            devWarn(
              `<${this.localName}> has non-same-root ${attr}="${idRef}" inside shadowRoot (ADR-003).`,
            );
          }
        }
      }

      const role = el.getAttribute('role');
      if (role && INTERACTIVE_ROLES_REQUIRING_NAME.has(role)) {
        const hasLabelAttr = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
        const hasTitle = el.hasAttribute('title');
        const hasText = (el.textContent?.trim().length ?? 0) > 0;
        const hasHostLabels = (this.labels?.length ?? 0) > 0;
        if (!hasLabelAttr && !hasTitle && !hasText && !hasHostLabels) {
          devWarn(
            `<${this.localName}> inner [role="${role}"] is missing an accessible name (ADR-003).`,
          );
        }
      }
    }
  }
}
