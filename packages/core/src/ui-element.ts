import { ContextConsumer } from '@lit/context';
import { LitElement, type PropertyValues } from 'lit';
import {
  DEFAULT_LOCALE_CONTEXT,
  LOCALE_CONTEXT,
  type LocaleContextValue,
} from './context.js';
import { IS_DEV, runElementDevDiagnostics } from './env.js';
import {
  inferDirectionFromLocale,
  normalizeLocale,
  translateMessage,
  type MessageCatalog,
} from './i18n.js';
import { getRuntime, type MethaneRuntime } from './runtime.js';

function findComposedAncestorAttr(start: Element, attrName: 'lang' | 'dir'): string | null {
  const docEl = typeof document !== 'undefined' ? document.documentElement : null;
  let current: Element | null = start;
  const selector = `[${attrName}]`;

  while (current) {
    if (current !== docEl) {
      const matched: Element | null =
        typeof current.closest === 'function' ? current.closest(selector) : null;
      if (matched && matched !== docEl) {
        const raw = matched.getAttribute(attrName)?.trim() ?? '';
        if (attrName === 'lang' && raw.length > 0) {
          return raw;
        }
        if (attrName === 'dir') {
          const normalized = raw.toLowerCase();
          if (normalized === 'rtl' || normalized === 'ltr') {
            return normalized;
          }
        }
        if (matched.parentElement) {
          current = matched.parentElement;
          continue;
        }
        const matchedRoot: Node | null =
          typeof matched.getRootNode === 'function' ? matched.getRootNode() : null;
        if (typeof ShadowRoot !== 'undefined' && matchedRoot instanceof ShadowRoot && matchedRoot.host) {
          current = matchedRoot.host;
          continue;
        }
        break;
      }
    }

    const root: Node | null =
      typeof current.getRootNode === 'function' ? current.getRootNode() : null;
    if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot && root.host) {
      current = root.host;
      continue;
    }
    break;
  }

  return null;
}

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
  private _hasLocaleContext = false;
  private _localeContext: LocaleContextValue = DEFAULT_LOCALE_CONTEXT;

  constructor() {
    super();
    this.internals =
      typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    this._localeConsumer = new ContextConsumer(this, {
      context: LOCALE_CONTEXT,
      subscribe: true,
      callback: (value) => {
        this._hasLocaleContext = value !== undefined;
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

  /** Current locale resolved via host/composed ancestor `[lang]` (excluding `<html>`) -> LocaleContext -> `<html lang>` -> `'en'`. */
  protected get resolvedLocale(): string {
    const ancestorLang = findComposedAncestorAttr(this, 'lang');
    if (ancestorLang) return normalizeLocale(ancestorLang);
    if (this._localeConsumer && this._hasLocaleContext && this._localeContext.locale) {
      return normalizeLocale(this._localeContext.locale);
    }
    const docLang = typeof document !== 'undefined' ? document.documentElement?.lang : '';
    return normalizeLocale(docLang || 'en');
  }

  /** Current writing direction resolved via host/composed ancestor `[dir]` (excluding `<html>`) -> LocaleContext -> `<html dir>` -> locale default. */
  protected get resolvedDir(): 'ltr' | 'rtl' {
    const ancestorDir = findComposedAncestorAttr(this, 'dir');
    if (ancestorDir === 'rtl' || ancestorDir === 'ltr') return ancestorDir;
    if (
      this._hasLocaleContext &&
      (this._localeContext.dir === 'rtl' || this._localeContext.dir === 'ltr')
    ) {
      return this._localeContext.dir;
    }
    if (findComposedAncestorAttr(this, 'lang')) {
      return inferDirectionFromLocale(this.resolvedLocale);
    }
    const docDir =
      typeof document !== 'undefined' ? document.documentElement?.dir?.trim().toLowerCase() : '';
    if (docDir === 'rtl' || docDir === 'ltr') return docDir;
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
    if (IS_DEV) {
      this.runDevDiagnostics();
    }
  }

  protected runDevDiagnostics(): void {
    runElementDevDiagnostics(this, this.internals, this.labels);
  }
}
