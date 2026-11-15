import { ContextProvider } from '@lit/context';
import * as fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LOCALE_CONTEXT,
  DEFAULT_THEME_CONTEXT,
  FIELD_CONTEXT,
  FORM_CONTEXT,
  LOCALE_CONTEXT,
  RUNTIME_SYMBOL,
  THEME_CONTEXT,
  UIElement,
  compareSemver,
  css,
  defineComponents,
  devWarn,
  formatI18nMessage,
  getRuntime,
  html,
  inferDirectionFromLocale,
  isDevMode,
  isolateBidiValue,
  loadLocalePack,
  negotiateRuntime,
  normalizeLocale,
  parseSemver,
  property,
  registerLocaleMessages,
  registerLocalePack,
  registerStyles,
  resolveMessageEntry,
  translateMessage,
  type MessageCatalog,
} from './index.js';

class TestControlElement extends UIElement {
  static formAssociated = true;

  static override styles = css`
    :host {
      display: inline-block;
    }
  `;

  static override messages: MessageCatalog = {
    greeting: 'Hello {name}',
    items: {
      zero: 'No items',
      one: '{count} item',
      other: '{count} items',
    },
  };

  @property({ type: String })
  value = '';

  @property({ type: String })
  label = 'Field';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  firstConnectCalls = 0;
  moveBeforeCalls = 0;
  resetCalls = 0;
  formDisabledEvents: boolean[] = [];
  restoreCalls: Array<{ state: unknown; mode: string }> = [];

  override onFirstConnect(): void {
    this.firstConnectCalls += 1;
  }

  override onMoveBefore(): void {
    this.moveBeforeCalls += 1;
  }

  override onFormDisabled(disabled: boolean): void {
    this.formDisabledEvents.push(disabled);
  }

  override onFormReset(): void {
    this.resetCalls += 1;
    this.value = '';
    this.setCustomState('dirty', false);
  }

  override onFormStateRestore(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.restoreCalls.push({ state, mode });
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  setDirty(active: boolean): void {
    this.setCustomState('dirty', active);
  }

  toggleCustomState(name: string, active: boolean): void {
    this.setCustomState(name, active);
  }

  commitFormValue(value: File | string | FormData | null, state?: File | string | FormData | null): void {
    this.setFormValue(value, state);
  }

  commitValidity(flags?: ValidityStateFlags, message?: string, anchor?: HTMLElement): void {
    this.setValidity(flags, message, anchor);
  }

  dispatchMethaneEvent<T = undefined>(
    name: `mth-${string}` | 'input' | 'change',
    options?: CustomEventInit<T>,
  ): boolean {
    return this.emitEvent(name, options);
  }

  readText(key: string, params?: Record<string, string | number>, fallback?: string): string {
    return this.t(key, params, fallback);
  }

  readResolvedLocale(): string {
    return this.resolvedLocale;
  }

  readResolvedDir(): 'ltr' | 'rtl' {
    return this.resolvedDir;
  }

  get internalFormDisabled(): boolean {
    return this._formDisabled;
  }

  get internalInternals(): ElementInternals | null {
    return this.internals;
  }

  override render() {
    return html`<label id="lbl">${this.label}</label
      ><input aria-labelledby="lbl" .value=${this.value} ?disabled=${this.disabled || this._formDisabled} />`;
  }
}

if (!customElements.get('mth-test-control')) {
  customElements.define('mth-test-control', TestControlElement);
}

class NonFormElement extends UIElement {
  static override i18nNamespace = 'custom-ns';
  static override messages: MessageCatalog = {
    title: 'Custom Title',
  };

  readTitle(): string {
    return this.t('title');
  }

  override render() {
    return html`<span>non-form</span>`;
  }
}

if (!customElements.get('mth-non-form')) {
  customElements.define('mth-non-form', NonFormElement);
}

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('dir');
  delete (globalThis as { __DEV__?: unknown }).__DEV__;
  vi.restoreAllMocks();
});

describe('@methane-ui/core UIElement lifecycle & adoptedStyleSheets', () => {
  it('invokes onFirstConnect once across disconnect and reconnect cycles', async () => {
    const el = document.createElement('mth-test-control') as TestControlElement;
    expect(el.firstConnectCalls).toBe(0);

    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.firstConnectCalls).toBe(1);

    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.firstConnectCalls).toBe(1);
  });

  it('supports connectedMoveCallback without teardown and initializes if moved before connect', async () => {
    const fresh = document.createElement('mth-test-control') as TestControlElement;
    fresh.connectedMoveCallback();
    expect(fresh.firstConnectCalls).toBe(1);
    expect(fresh.moveBeforeCalls).toBe(1);

    const el = document.createElement('mth-test-control') as TestControlElement;
    el.value = 'preserved';
    document.body.appendChild(el);
    await el.updateComplete;
    el.connectedMoveCallback();
    expect(el.firstConnectCalls).toBe(1);
    expect(el.moveBeforeCalls).toBe(1);
    expect(el.value).toBe('preserved');
  });

  it('injects runtime registerStyles into connected shadowRoot.adoptedStyleSheets and cleans up on disconnect', async () => {
    const fakeGlobal: Record<symbol, unknown> = {};
    const rt = negotiateRuntime({ hostGlobal: fakeGlobal });
    const el = document.createElement('mth-test-control') as TestControlElement;
    vi.spyOn(el as unknown as { runtime: typeof rt }, 'runtime', 'get').mockReturnValue(rt);

    document.body.appendChild(el);
    await el.updateComplete;

    const root = el.shadowRoot!;
    const baseCount = root.adoptedStyleSheets.length;

    const sheet1 = rt.styles.registerStyles('mth-test-control', '.box { color: red; }');
    expect(sheet1).not.toBeNull();
    expect(root.adoptedStyleSheets.length).toBe(baseCount + 1);
    expect(root.adoptedStyleSheets).toContain(sheet1);

    // Disconnected element must not receive updates until reconnected
    el.remove();
    const sheet2 = rt.styles.registerStyles('*', '@layer custom { :host { opacity: 0.9; } }');
    expect(sheet2).not.toBeNull();
    expect(root.adoptedStyleSheets.length).toBe(baseCount + 1);

    // Reconnecting re-syncs latest global + tag runtime sheets
    document.body.appendChild(el);
    await el.updateComplete;
    expect(root.adoptedStyleSheets.length).toBe(baseCount + 2);
    expect(root.adoptedStyleSheets).toContain(sheet2);
    expect(rt.styles.getRawCssForTag('mth-test-control')).toEqual([
      '@layer custom { :host { opacity: 0.9; } }',
      '@layer override {\n.box { color: red; }\n}',
    ]);
  });

  it('preserves existing shadowRoot during Declarative Shadow DOM in-place hydration', async () => {
    const el = document.createElement('mth-test-control') as TestControlElement;
    const preShadow = el.attachShadow({ mode: 'open' });
    const ssrMarker = document.createElement('span');
    ssrMarker.setAttribute('data-ssr', 'kept');
    preShadow.appendChild(ssrMarker);

    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot).toBe(preShadow);
    expect(preShadow.querySelector('[data-ssr="kept"]')).toBe(ssrMarker);
  });
});

describe('@methane-ui/core FACE internals, CustomStateSet, and emitEvent', () => {
  it('handles formDisabledCallback without mutating host disabled property or attribute (ADR-014)', async () => {
    const el = document.createElement('mth-test-control') as TestControlElement;
    document.body.appendChild(el);
    await el.updateComplete;

    el.formDisabledCallback(true);
    await el.updateComplete;

    expect(el.internalFormDisabled).toBe(true);
    expect(el.disabled).toBe(false);
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.hasCustomState('disabled')).toBe(true);
    expect(el.formDisabledEvents).toEqual([true]);
    expect(el.shadowRoot!.querySelector('input')?.disabled).toBe(true);

    el.formDisabledCallback(false);
    await el.updateComplete;
    expect(el.internalFormDisabled).toBe(false);
    expect(el.hasCustomState('disabled')).toBe(false);
    expect(el.formDisabledEvents).toEqual([true, false]);
    expect(el.shadowRoot!.querySelector('input')?.disabled).toBe(false);
  });

  it('invokes onFormReset and onFormStateRestore for restore and autocomplete modes', () => {
    const el = document.createElement('mth-test-control') as TestControlElement;
    el.value = 'initial';
    el.setDirty(true);
    expect(el.hasCustomState('dirty')).toBe(true);

    el.formResetCallback();
    expect(el.resetCalls).toBe(1);
    expect(el.value).toBe('');
    expect(el.hasCustomState('dirty')).toBe(false);

    el.formStateRestoreCallback('restored-val', 'restore');
    expect(el.value).toBe('restored-val');
    el.formStateRestoreCallback('auto-val', 'autocomplete');
    expect(el.value).toBe('auto-val');
    expect(el.restoreCalls).toEqual([
      { state: 'restored-val', mode: 'restore' },
      { state: 'auto-val', mode: 'autocomplete' },
    ]);
  });

  it('forwards setFormValue, setValidity, and labels through ElementInternals', () => {
    const el = document.createElement('mth-test-control') as TestControlElement;
    const setFormValueSpy = vi.fn();
    const setValiditySpy = vi.fn();
    const fakeLabels = [document.createElement('label')] as unknown as NodeList;

    Object.defineProperty(el, 'internals', {
      configurable: true,
      value: {
        setFormValue: setFormValueSpy,
        setValidity: setValiditySpy,
        labels: fakeLabels,
        states: new Set<string>(),
      },
    });

    const anchor = document.createElement('input');
    el.commitFormValue('abc', 'state-abc');
    expect(setFormValueSpy).toHaveBeenCalledWith('abc', 'state-abc');

    el.commitValidity({ valueMissing: true }, 'Required field', anchor);
    expect(setValiditySpy).toHaveBeenCalledWith({ valueMissing: true }, 'Required field', anchor);

    expect(el.labels).toBe(fakeLabels);

    const nonForm = document.createElement('mth-non-form') as NonFormElement;
    expect(nonForm.labels).toBeNull();
  });

  it('returns null from labels when internals.labels throws', () => {
    const el = document.createElement('mth-test-control') as TestControlElement;
    Object.defineProperty(el, 'internals', {
      configurable: true,
      value: {
        get labels(): NodeList {
          throw new Error('NotSupportedError');
        },
      },
    });
    expect(el.labels).toBeNull();
  });

  it('tracks CustomStateSet even when ElementInternals.states throws on restricted engines', () => {
    const el = document.createElement('mth-test-control') as TestControlElement;
    const throwingStates = {
      add() {
        throw new DOMException('InvalidState');
      },
      delete() {
        throw new DOMException('InvalidState');
      },
      has() {
        return false;
      },
    };
    Object.defineProperty(el, 'internals', {
      configurable: true,
      value: { states: throwingStates },
    });

    el.toggleCustomState('open', true);
    expect(el.hasCustomState('open')).toBe(true);
    el.toggleCustomState('open', false);
    expect(el.hasCustomState('open')).toBe(false);
  });

  it('emits bubbling composed mth-*, input, and change events via emitEvent', () => {
    const parent = document.createElement('div');
    const shadowHost = document.createElement('div');
    const shadow = shadowHost.attachShadow({ mode: 'open' });
    const el = document.createElement('mth-test-control') as TestControlElement;
    shadow.appendChild(el);
    parent.appendChild(shadowHost);
    document.body.appendChild(parent);

    const received: Array<{ type: string; detail: unknown; bubbles: boolean; composed: boolean }> = [];
    for (const type of ['mth-change', 'input', 'change']) {
      parent.addEventListener(type, (ev) => {
        received.push({
          type,
          detail: ev instanceof CustomEvent ? ev.detail : undefined,
          bubbles: ev.bubbles,
          composed: ev.composed,
        });
      });
    }

    expect(el.dispatchMethaneEvent('mth-change', { detail: { count: 2 }, cancelable: true })).toBe(true);
    expect(el.dispatchMethaneEvent('input')).toBe(true);
    expect(el.dispatchMethaneEvent('change')).toBe(true);

    expect(received).toEqual([
      { type: 'mth-change', detail: { count: 2 }, bubbles: true, composed: true },
      { type: 'input', detail: null, bubbles: true, composed: true },
      { type: 'change', detail: null, bubbles: true, composed: true },
    ]);

    // Cancelable event returns false when preventDefault() is called
    parent.addEventListener('mth-cancelable', (ev) => ev.preventDefault());
    expect(el.dispatchMethaneEvent('mth-cancelable', { cancelable: true })).toBe(false);
  });
});

describe('@methane-ui/core composed ancestor lang/dir inheritance & i18n', () => {
  it('inherits lang from Light DOM ancestor elements and prefers host lang over ancestor', () => {
    document.documentElement.lang = 'en';
    const wrapper = document.createElement('div');
    wrapper.setAttribute('lang', 'fr');
    const inner = document.createElement('section');
    const el = document.createElement('mth-test-control') as TestControlElement;
    inner.appendChild(el);
    wrapper.appendChild(inner);
    document.body.appendChild(wrapper);

    expect(el.readResolvedLocale()).toBe('fr');

    el.setAttribute('lang', 'de-AT');
    expect(el.readResolvedLocale()).toBe('de-AT');
  });

  it('walks across ShadowRoot.host boundaries for composed ancestor [lang] and [dir]', () => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';

    const outer = document.createElement('div');
    outer.setAttribute('lang', 'ar');
    outer.setAttribute('dir', 'RTL');

    const outerHost = document.createElement('div');
    const outerShadow = outerHost.attachShadow({ mode: 'open' });
    const innerHost = document.createElement('div');
    const innerShadow = innerHost.attachShadow({ mode: 'open' });
    const el = document.createElement('mth-test-control') as TestControlElement;

    innerShadow.appendChild(el);
    outerShadow.appendChild(innerHost);
    outer.appendChild(outerHost);
    document.body.appendChild(outer);

    expect(el.readResolvedLocale()).toBe('ar');
    expect(el.readResolvedDir()).toBe('rtl');
  });

  it('lets LocaleContext override <html lang/dir> while explicit subtree <div lang/dir> overrides LocaleContext', async () => {
    document.documentElement.lang = 'de';
    document.documentElement.dir = 'ltr';

    const providerHost = document.createElement('div');
    new ContextProvider(providerHost, {
      context: LOCALE_CONTEXT,
      initialValue: {
        version: 1,
        locale: 'ar',
        dir: 'rtl',
        messages: { 'mth-test-control': { greeting: 'مرحبا {name}' } },
      },
    });

    const ctxChild = document.createElement('mth-test-control') as TestControlElement;
    const subtree = document.createElement('div');
    subtree.setAttribute('lang', 'fr');
    subtree.setAttribute('dir', 'ltr');
    const subtreeChild = document.createElement('mth-test-control') as TestControlElement;
    subtree.appendChild(subtreeChild);

    providerHost.append(ctxChild, subtree);
    document.body.appendChild(providerHost);
    await ctxChild.updateComplete;
    await subtreeChild.updateComplete;

    expect(ctxChild.readResolvedLocale()).toBe('ar');
    expect(ctxChild.readResolvedDir()).toBe('rtl');
    expect(ctxChild.readText('greeting', { name: 'MNS' })).toBe('مرحبا \u2068MNS\u2069');

    expect(subtreeChild.readResolvedLocale()).toBe('fr');
    expect(subtreeChild.readResolvedDir()).toBe('ltr');
  });

  it('falls back to documentElement lang/dir when no subtree attr or LocaleContext is present', () => {
    document.documentElement.lang = 'he';
    const el = document.createElement('mth-test-control') as TestControlElement;
    document.body.appendChild(el);

    expect(el.readResolvedLocale()).toBe('he');
    expect(el.readResolvedDir()).toBe('rtl');

    document.documentElement.lang = 'en';
    document.documentElement.dir = 'rtl';
    expect(el.readResolvedLocale()).toBe('en');
    expect(el.readResolvedDir()).toBe('rtl');
  });

  it('infers rtl from subtree lang="ar" even when documentElement has dir="ltr" and skips dir="auto"', () => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';

    const arWrap = document.createElement('div');
    arWrap.setAttribute('lang', 'ar');
    const autoWrap = document.createElement('div');
    autoWrap.setAttribute('dir', 'auto');
    const el = document.createElement('mth-test-control') as TestControlElement;
    autoWrap.appendChild(el);
    arWrap.appendChild(autoWrap);
    document.body.appendChild(arWrap);

    expect(el.readResolvedLocale()).toBe('ar');
    expect(el.readResolvedDir()).toBe('rtl');

    // Outer explicit dir="ltr" still wins when wrapping dir="auto"
    arWrap.setAttribute('dir', 'ltr');
    expect(el.readResolvedDir()).toBe('ltr');
  });

  it('normalizes locales, infers direction for ar/he/fa/ur, and isolates bidi values', () => {
    expect(normalizeLocale('')).toBe('en');
    expect(normalizeLocale(null)).toBe('en');
    expect(normalizeLocale('  en-us  ')).toBe('en-US');
    expect(normalizeLocale('invalid!!!locale')).toBe('en');

    expect(inferDirectionFromLocale('ar-EG')).toBe('rtl');
    expect(inferDirectionFromLocale('he')).toBe('rtl');
    expect(inferDirectionFromLocale('fa-IR')).toBe('rtl');
    expect(inferDirectionFromLocale('ur')).toBe('rtl');
    expect(inferDirectionFromLocale('en-US')).toBe('ltr');

    expect(isolateBidiValue(42)).toBe('\u206842\u2069');
  });

  it('resolves i18n messages in exact priority order and supports pluralization + custom namespace', async () => {
    const ns = 'i18n-order-probe';
    registerLocaleMessages('en', ns, { msg: 'en-pack' });
    registerLocaleMessages('fr', ns, { msg: 'fr-base' });
    registerLocaleMessages('fr-CA', ns, { msg: 'fr-CA-exact' });

    expect(
      resolveMessageEntry(ns, 'msg', 'fr-CA', { [ns]: { msg: 'ctx-override' } }, { msg: 'local' }),
    ).toBe('ctx-override');
    expect(resolveMessageEntry(ns, 'msg', 'fr-CA', undefined, { msg: 'local' })).toBe('fr-CA-exact');
    expect(resolveMessageEntry(ns, 'msg', 'fr-FR', undefined, { msg: 'local' })).toBe('fr-base');
    expect(resolveMessageEntry(ns, 'msg', 'es', undefined, { msg: 'local' })).toBe('en-pack');
    expect(resolveMessageEntry('unknown-ns', 'msg', 'es', undefined, { msg: 'local' })).toBe(
      'local',
    );

    expect(translateMessage(ns, 'missing', { fallback: 'Fallback Copy' })).toBe('Fallback Copy');
    expect(translateMessage(ns, 'missing')).toBe('missing');

    await loadLocalePack('ja-JP', async (norm) => {
      expect(norm).toBe('ja-JP');
      return { [ns]: { msg: 'ja-loaded' } };
    });
    expect(translateMessage(ns, 'msg', { locale: 'ja-JP' })).toBe('ja-loaded');

    registerLocalePack('de', { 'custom-ns': { title: 'Benutzerdefiniert' } });
    const nonForm = document.createElement('mth-non-form') as NonFormElement;
    nonForm.setAttribute('lang', 'de');
    expect(nonForm.readTitle()).toBe('Benutzerdefiniert');

    const plural = formatI18nMessage(
      { zero: 'none', one: '{count} one', other: '{count} many {unknown}' },
      { count: 5 },
      'en',
    );
    expect(plural).toBe('\u20685\u2069 many {unknown}');
  });

  it('exports versioned Symbol.for Context tokens and defaults', () => {
    expect(THEME_CONTEXT).toBe(Symbol.for('@methane-ui/context/theme'));
    expect(LOCALE_CONTEXT).toBe(Symbol.for('@methane-ui/context/locale'));
    expect(FIELD_CONTEXT).toBe(Symbol.for('@methane-ui/context/field'));
    expect(FORM_CONTEXT).toBe(Symbol.for('@methane-ui/context/form'));
    expect(DEFAULT_THEME_CONTEXT).toEqual({
      version: 1,
      theme: 'system',
      density: 'default',
      dir: 'auto',
    });
    expect(DEFAULT_LOCALE_CONTEXT).toEqual({
      version: 1,
      locale: 'en',
      dir: 'ltr',
    });
  });
});

describe('@methane-ui/core global runtime singleton & coordinators', () => {
  it('negotiates global runtime singleton with SemVer skew protection and duplicate-core __DEV__ warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fakeGlobal: Record<symbol, unknown> = {};

    const rt1 = negotiateRuntime({ version: '1.0.0', bundleId: 'bundle-a', hostGlobal: fakeGlobal });
    expect(rt1.major).toBe(1);
    expect(rt1.version).toBe('1.0.0');
    expect(fakeGlobal[RUNTIME_SYMBOL]).toBe(rt1);

    // Repeating same bundleId does not emit duplicate warning
    negotiateRuntime({ version: '1.0.0', bundleId: 'bundle-a', hostGlobal: fakeGlobal });
    expect(warnSpy).not.toHaveBeenCalled();

    rt1.overlays.register({
      id: 'dlg-1',
      element: document.createElement('div'),
      modal: true,
      requestClose: () => undefined,
    });

    const rt2 = negotiateRuntime({
      version: '1.3.0',
      bundleId: 'bundle-b',
      capabilities: ['extra-cap'],
      hostGlobal: fakeGlobal,
    });

    expect(rt2).toBe(rt1);
    expect(rt2.version).toBe('1.3.0');
    expect(rt2.capabilities.has('extra-cap')).toBe(true);
    expect(rt2.overlays.size).toBe(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    // Lower version does not downgrade higher version
    const rt3 = negotiateRuntime({ version: '1.1.0', bundleId: 'bundle-c', hostGlobal: fakeGlobal });
    expect(rt3.version).toBe('1.3.0');

    // Incompatible major throws
    expect(() =>
      negotiateRuntime({ version: '2.0.0', bundleId: 'bundle-v2', hostGlobal: fakeGlobal }),
    ).toThrow(/Incompatible @methane-ui\/core runtime major/);
  });

  it('parses and compares SemVer including prereleases and rejects invalid SemVer', () => {
    expect(parseSemver('1.2.3-alpha.1')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: 'alpha.1',
    });
    expect(compareSemver('1.0.0-alpha', '1.0.0')).toBeLessThan(0);
    expect(compareSemver('1.0.0', '1.0.0-alpha')).toBeGreaterThan(0);
    expect(compareSemver('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
    expect(compareSemver('1.2.0', '1.2.0')).toBe(0);
    expect(() => parseSemver('not-a-semver')).toThrow(/Invalid SemVer/);
  });

  it('coordinates overlays, notifications, hotkeys, and live announcer on isolated runtime', () => {
    const fakeGlobal: Record<symbol, unknown> = {};
    const rt = getRuntime(fakeGlobal);
    expect(getRuntime(fakeGlobal)).toBe(rt);

    // Overlays LIFO + requestCloseTop
    const closed: string[] = [];
    rt.overlays.register({
      id: 'o1',
      element: document.createElement('div'),
      modal: false,
      requestClose: (r) => closed.push(`o1:${r}`),
    });
    rt.overlays.register({
      id: 'o2',
      element: document.createElement('div'),
      modal: true,
      requestClose: (r) => closed.push(`o2:${r}`),
    });
    expect(rt.overlays.isTop('o2')).toBe(true);
    expect(rt.overlays.peek()?.id).toBe('o2');
    expect(rt.overlays.list().map((o) => o.id)).toEqual(['o1', 'o2']);
    expect(rt.overlays.requestCloseTop('escape')).toBe(true);
    expect(closed).toEqual(['o2:escape']);
    rt.overlays.unregister('o2');
    expect(rt.overlays.isTop('o1')).toBe(true);

    // Notifications store
    const snapshots: number[] = [];
    const unsubNotif = rt.notifications.subscribe((items) => snapshots.push(items.length));
    const item = rt.notifications.add({ message: 'Saved', tone: 'success' });
    expect(rt.notifications.list()).toHaveLength(1);
    expect(rt.notifications.dismiss(item.id)).toBe(true);
    expect(rt.notifications.dismiss('missing')).toBe(false);
    rt.notifications.add({ id: 'n1', message: 'One' });
    rt.notifications.clear();
    expect(rt.notifications.list()).toEqual([]);
    unsubNotif();
    expect(snapshots).toEqual([0, 1, 0, 1, 0]);

    // Hotkeys: input suppression, allowInInput, scope, IME guard
    const scopeEl = document.createElement('div');
    const innerBtn = document.createElement('button');
    const inputEl = document.createElement('input');
    scopeEl.append(innerBtn, inputEl);
    document.body.appendChild(scopeEl);

    let scopedHits = 0;
    let inputHits = 0;
    const unsubScoped = rt.hotkeys.register({
      id: 'scoped-save',
      combo: 'Ctrl+S',
      scope: scopeEl,
      handler: () => {
        scopedHits += 1;
      },
    });
    const unsubInput = rt.hotkeys.register({
      id: 'input-cmd',
      combo: 'Alt+K',
      allowInInput: true,
      handler: () => {
        inputHits += 1;
      },
    });

    const inputEv = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    Object.defineProperty(inputEv, 'target', { value: inputEl });
    expect(rt.hotkeys.handleKeydown(inputEv)).toBe(false);

    const btnEv = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    Object.defineProperty(btnEv, 'target', { value: innerBtn });
    expect(rt.hotkeys.handleKeydown(btnEv)).toBe(true);
    expect(scopedHits).toBe(1);

    const allowedInputEv = new KeyboardEvent('keydown', { key: 'k', altKey: true });
    Object.defineProperty(allowedInputEv, 'target', { value: inputEl });
    expect(rt.hotkeys.handleKeydown(allowedInputEv)).toBe(true);
    expect(inputHits).toBe(1);

    const imeEv = new KeyboardEvent('keydown', { key: 'k', altKey: true, isComposing: true });
    expect(rt.hotkeys.handleKeydown(imeEv)).toBe(false);

    unsubScoped();
    unsubInput();

    // Live announcer
    rt.announcer.announce('Item deleted', 'assertive');
    expect(rt.announcer.getLastAnnouncement()).toEqual({
      message: 'Item deleted',
      politeness: 'assertive',
    });
    const alertRegion = document.body.querySelector('[role="alert"]');
    expect(alertRegion?.textContent).toBe('Item deleted');
    rt.announcer.clear();
    expect(rt.announcer.getLastAnnouncement()).toBeNull();
  });

  it('supports prefix-configurable registration via defineComponents and registerStyles @layer override', () => {
    class CustomChip extends UIElement {
      override render() {
        return html`<span>chip</span>`;
      }
    }

    const defined = defineComponents({
      prefix: 'acme',
      components: { 'mth-chip': CustomChip },
    });
    expect(defined).toEqual(['acme-chip']);
    expect(customElements.get('acme-chip')).toBe(CustomChip);

    const reDefined = defineComponents({
      prefix: 'beta',
      components: { 'mth-chip': CustomChip },
    });
    expect(reDefined).toEqual(['beta-chip']);
    expect(customElements.get('beta-chip')).toBeDefined();
    expect(customElements.get('beta-chip')).not.toBe(CustomChip);
    expect(getRuntime().registry.getConstructor('mth-chip')).toBe(CustomChip);
    expect(getRuntime().registry.getDefinedTags().get('mth-chip')).toBe('beta-chip');

    getRuntime().registry.prefix = 'mth';

    registerStyles('acme-chip', '.chip { color: red; }');
    const raw = getRuntime().styles.getRawCssForTag('acme-chip');
    expect(raw.some((cssText) => cssText.includes('@layer override'))).toBe(true);
  });

  it('applies pre-registered runtime styles on initial connect', async () => {
    const fakeGlobal: Record<symbol, unknown> = {};
    const rt = negotiateRuntime({ hostGlobal: fakeGlobal });
    const preSheet = rt.styles.registerStyles('mth-test-control', '.pre { display: grid; }');
    expect(preSheet).not.toBeNull();

    const el = document.createElement('mth-test-control') as TestControlElement;
    vi.spyOn(el as unknown as { runtime: typeof rt }, 'runtime', 'get').mockReturnValue(rt);
    document.body.appendChild(el);
    await el.updateComplete;

    const root = el.shadowRoot!;
    expect(root.adoptedStyleSheets).toContain(preSheet);
  });

  it('handles null ElementInternals gracefully for setFormValue and setValidity', () => {
    const el = document.createElement('mth-test-control') as TestControlElement;
    Object.defineProperty(el, 'internals', { configurable: true, value: null });
    expect(() => el.commitFormValue('val')).not.toThrow();
    expect(() => el.commitValidity({ customError: true }, 'bad')).not.toThrow();
    expect(el.labels).toBeNull();
  });

  it('invokes base UIElement default FACE and lifecycle hooks safely', () => {
    const el = document.createElement('mth-non-form') as NonFormElement;
    expect(() => el.formDisabledCallback(true)).not.toThrow();
    expect(() => el.formResetCallback()).not.toThrow();
    expect(() => el.formStateRestoreCallback('x', 'restore')).not.toThrow();
    expect(() => el.connectedMoveCallback()).not.toThrow();
  });

  it('reactively updates ContextConsumer when ContextProvider changes value', async () => {
    const host = document.createElement('div');
    const provider = new ContextProvider(host, {
      context: LOCALE_CONTEXT,
      initialValue: {
        version: 1,
        locale: 'en',
        dir: 'ltr',
        messages: { 'mth-test-control': { greeting: 'Hi {name}' } },
      },
    });
    const el = document.createElement('mth-test-control') as TestControlElement;
    host.appendChild(el);
    document.body.appendChild(host);
    await el.updateComplete;
    expect(el.readText('greeting', { name: 'Ada' })).toBe('Hi \u2068Ada\u2069');

    provider.setValue({
      version: 1,
      locale: 'fr',
      dir: 'ltr',
      messages: { 'mth-test-control': { greeting: 'Salut {name}' } },
    });
    await el.updateComplete;
    expect(el.readResolvedLocale()).toBe('fr');
    expect(el.readText('greeting', { name: 'Ada' })).toBe('Salut \u2068Ada\u2069');
  });

  it('skips empty lang="" attributes when walking composed ancestors', () => {
    const outer = document.createElement('div');
    outer.setAttribute('lang', 'es');
    const inner = document.createElement('div');
    inner.setAttribute('lang', '   ');
    const el = document.createElement('mth-test-control') as TestControlElement;
    el.setAttribute('lang', '');
    inner.appendChild(el);
    outer.appendChild(inner);
    document.body.appendChild(outer);

    expect(el.readResolvedLocale()).toBe('es');
  });

  it('supports Arabic plural forms (zero, one, two, few, many, other)', () => {
    const forms = {
      zero: 'لا عناصر',
      one: 'عنصر واحد',
      two: 'عنصران',
      few: '{count} عناصر',
      many: '{count} عنصرًا',
      other: '{count} عنصر',
    };
    expect(formatI18nMessage(forms, { count: 0 }, 'ar')).toBe('لا عناصر');
    expect(formatI18nMessage(forms, { count: 1 }, 'ar')).toBe('عنصر واحد');
    expect(formatI18nMessage(forms, { count: 2 }, 'ar')).toBe('عنصران');
    expect(formatI18nMessage(forms, { count: 5 }, 'ar')).toBe('\u20685\u2069 عناصر');
    expect(formatI18nMessage(forms, { count: 15 }, 'ar')).toBe('\u206815\u2069 عنصرًا');
  });

  it('shares ResizeObserver, IntersectionObserver, and matchMedia pools and cleans up on unsubscribe', () => {
    const fakeGlobal: Record<symbol, unknown> = {};
    const rt = getRuntime(fakeGlobal);

    const resizeUnobserved: Element[] = [];
    let resizeCb: ((entries: ResizeObserverEntry[]) => void) | undefined;
    const origRO = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(cb: (entries: ResizeObserverEntry[]) => void) {
        resizeCb = cb;
      }
      observe(): void {}
      unobserve(el: Element): void {
        resizeUnobserved.push(el);
      }
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;

    const ioUnobserved: Element[] = [];
    let ioCb: ((entries: IntersectionObserverEntry[]) => void) | undefined;
    const origIO = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
        ioCb = cb;
      }
      observe(): void {}
      unobserve(el: Element): void {
        ioUnobserved.push(el);
      }
      disconnect(): void {}
    } as unknown as typeof IntersectionObserver;

    const origMatchMedia = window.matchMedia;
    let mediaListener: ((ev: MediaQueryListEvent) => void) | undefined;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: (_type: string, fn: (ev: MediaQueryListEvent) => void) => {
        mediaListener = fn;
      },
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;

    try {
      const target = document.createElement('div');
      const rHits: number[] = [];
      const unsubR1 = rt.observers.observeResize(target, () => rHits.push(1));
      const unsubR2 = rt.observers.observeResize(target, () => rHits.push(2));
      resizeCb?.([{ target } as unknown as ResizeObserverEntry]);
      expect(rHits).toEqual([1, 2]);
      unsubR1();
      expect(resizeUnobserved).toEqual([]);
      unsubR2();
      expect(resizeUnobserved).toEqual([target]);

      const iHits: boolean[] = [];
      const unsubI = rt.observers.observeIntersection(
        target,
        (entry) => iHits.push(entry.isIntersecting),
        { threshold: 0.5 },
      );
      ioCb?.([{ target, isIntersecting: true } as unknown as IntersectionObserverEntry]);
      expect(iHits).toEqual([true]);
      unsubI();
      expect(ioUnobserved).toEqual([target]);

      const mHits: boolean[] = [];
      const unsubM = rt.observers.observeMedia('(prefers-reduced-motion: reduce)', (m) =>
        mHits.push(m),
      );
      mediaListener?.({ matches: false } as MediaQueryListEvent);
      expect(mHits).toEqual([true, false]);
      unsubM();
    } finally {
      globalThis.ResizeObserver = origRO;
      globalThis.IntersectionObserver = origIO;
      window.matchMedia = origMatchMedia;
    }
  });

  it('normalizes Mod+, Space, and unregister in HotkeyManager and reuses connected live announcer regions', () => {
    const fakeGlobal: Record<symbol, unknown> = {};
    const rt = getRuntime(fakeGlobal);

    let hits = 0;
    rt.hotkeys.register({
      id: 'mod-space',
      combo: 'Mod+Space',
      handler: () => {
        hits += 1;
      },
    });
    expect(rt.hotkeys.getBindings()).toHaveLength(1);
    const isMac = /mac|iphone|ipad|ipod/i.test(navigator.platform ?? '');
    expect(
      rt.hotkeys.handleKeydown(
        new KeyboardEvent('keydown', { key: ' ', metaKey: isMac, ctrlKey: !isMac }),
      ),
    ).toBe(true);
    expect(hits).toBe(1);
    rt.hotkeys.unregister('mod-space');
    expect(rt.hotkeys.getBindings()).toHaveLength(0);

    rt.announcer.announce('First polite', 'polite');
    rt.announcer.announce('Second polite', 'polite');
    expect(document.body.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(document.body.querySelector('[role="status"]')?.textContent).toBe('Second polite');
  });

  it('diagnoses aria-controls/aria-describedby cross-root IDREFs and respects title/aria-label on interactive roles', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    class AriaProbeElement extends UIElement {
      override render() {
        return html`
          <button type="button" aria-controls="missing-ctrl">Trigger</button>
          <div role="checkbox" aria-label="Agree"></div>
          <div role="switch" title="Notifications"></div>
          <div role="textbox"></div>
        `;
      }
    }
    if (!customElements.get('mth-aria-probe')) {
      customElements.define('mth-aria-probe', AriaProbeElement);
    }

    const probe = document.createElement('mth-aria-probe') as AriaProbeElement;
    document.body.appendChild(probe);
    await probe.updateComplete;

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('non-same-root aria-controls="missing-ctrl"'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('inner [role="textbox"] is missing an accessible name'),
    );
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('[role="checkbox"]'));
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('[role="switch"]'));
  });
});

describe('@methane-ui/core __DEV__ diagnostics', () => {
  it('emits __DEV__ diagnostics for cross-root ARIA IDs, missing accessible names, and delegatesFocus + role conflict', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    class BadA11yElement extends UIElement {
      static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
      override render() {
        return html`
          <input aria-labelledby="missing-id" />
          <div role="button"></div>
        `;
      }
    }
    if (!customElements.get('mth-bad-a11y')) {
      customElements.define('mth-bad-a11y', BadA11yElement);
    }

    const bad = document.createElement('mth-bad-a11y') as BadA11yElement;
    bad.setAttribute('role', 'combobox');
    document.body.appendChild(bad);
    await bad.updateComplete;

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('combines delegatesFocus: true with host role'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('non-same-root aria-labelledby="missing-id"'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('inner [role="button"] is missing an accessible name'),
    );
  });

  it('does not warn when same-root ARIA IDs and accessible names are valid, and respects __DEV__ = false', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    class GoodA11yElement extends UIElement {
      static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
      override render() {
        return html`
          <span id="desc">Helper</span>
          <div role="button" aria-describedby="desc">Submit</div>
        `;
      }
    }
    if (!customElements.get('mth-good-a11y')) {
      customElements.define('mth-good-a11y', GoodA11yElement);
    }

    const good = document.createElement('mth-good-a11y') as GoodA11yElement;
    document.body.appendChild(good);
    await good.updateComplete;
    expect(warnSpy).not.toHaveBeenCalled();

    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    expect(isDevMode()).toBe(false);
    devWarn('suppressed');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('@methane-ui/core fast-check property-based tests (ADR-001)', () => {
  it('survives arbitrary property/attribute, connect/disconnect/move, and FACE callback sequences', async () => {
    type Action =
      | { type: 'set-prop'; value: string }
      | { type: 'set-attr'; label: string }
      | { type: 'toggle-disabled'; disabled: boolean }
      | { type: 'connect' }
      | { type: 'disconnect' }
      | { type: 'move' }
      | { type: 'form-disable'; disabled: boolean }
      | { type: 'form-reset' }
      | { type: 'form-restore'; state: string };

    const actionArb: fc.Arbitrary<Action> = fc.oneof(
      fc.record({ type: fc.constant('set-prop' as const), value: fc.string({ maxLength: 24 }) }),
      fc.record({
        type: fc.constant('set-attr' as const),
        label: fc.string({ minLength: 1, maxLength: 20 }),
      }),
      fc.record({ type: fc.constant('toggle-disabled' as const), disabled: fc.boolean() }),
      fc.constant({ type: 'connect' as const }),
      fc.constant({ type: 'disconnect' as const }),
      fc.constant({ type: 'move' as const }),
      fc.record({ type: fc.constant('form-disable' as const), disabled: fc.boolean() }),
      fc.constant({ type: 'form-reset' as const }),
      fc.record({
        type: fc.constant('form-restore' as const),
        state: fc.string({ maxLength: 16 }),
      }),
    );

    await fc.assert(
      fc.asyncProperty(fc.array(actionArb, { minLength: 1, maxLength: 25 }), async (actions) => {
        const containerA = document.createElement('div');
        const containerB = document.createElement('div');
        document.body.append(containerA, containerB);

        const el = document.createElement('mth-test-control') as TestControlElement;
        let expectedHostDisabled = false;
        let expectedFormDisabled = false;
        let expectedValue = '';

        try {
          for (const action of actions) {
            switch (action.type) {
              case 'set-prop':
                el.value = action.value;
                expectedValue = action.value;
                el.setDirty(action.value.length > 0);
                break;
              case 'set-attr':
                el.setAttribute('label', action.label);
                break;
              case 'toggle-disabled':
                el.disabled = action.disabled;
                expectedHostDisabled = action.disabled;
                break;
              case 'connect':
                containerA.appendChild(el);
                break;
              case 'disconnect':
                el.remove();
                break;
              case 'move':
                if (!el.isConnected) containerA.appendChild(el);
                containerB.appendChild(el);
                el.connectedMoveCallback();
                break;
              case 'form-disable':
                el.formDisabledCallback(action.disabled);
                expectedFormDisabled = action.disabled;
                expect(el.disabled).toBe(expectedHostDisabled);
                expect(el.hasCustomState('disabled')).toBe(expectedFormDisabled);
                break;
              case 'form-reset':
                el.formResetCallback();
                expectedValue = '';
                expect(el.hasCustomState('dirty')).toBe(false);
                break;
              case 'form-restore':
                el.formStateRestoreCallback(action.state, 'restore');
                expectedValue = action.state;
                break;
            }
          }

          if (el.isConnected) {
            await el.updateComplete;
            expect(el.firstConnectCalls).toBe(1);
            const input = el.shadowRoot?.querySelector('input');
            expect(input?.disabled).toBe(expectedHostDisabled || expectedFormDisabled);
            expect(el.value).toBe(expectedValue);
          }
        } finally {
          containerA.remove();
          containerB.remove();
        }
      }),
      { numRuns: 30 },
    );
  });

  it('satisfies SemVer comparison transitivity and runtime negotiation invariants across random 1.x versions', () => {
    const semverArb = fc
      .tuple(fc.integer({ min: 0, max: 20 }), fc.integer({ min: 0, max: 20 }))
      .map(([minor, patch]) => `1.${minor}.${patch}`);

    fc.assert(
      fc.property(fc.array(semverArb, { minLength: 2, maxLength: 10 }), (versions) => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const fakeGlobal: Record<symbol, unknown> = {};
        let maxVer = versions[0]!;

        try {
          for (const [idx, ver] of versions.entries()) {
            const rt = negotiateRuntime({
              version: ver,
              bundleId: `bundle-${idx}-${ver}`,
              hostGlobal: fakeGlobal,
            });
            if (compareSemver(ver, maxVer) > 0) {
              maxVer = ver;
            }
            expect(rt.version).toBe(maxVer);
            expect(rt.major).toBe(1);
          }
        } finally {
          warnSpy.mockRestore();
        }
      }),
      { numRuns: 40 },
    );
  });
});
