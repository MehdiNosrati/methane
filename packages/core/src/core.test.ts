import { ContextProvider } from '@lit/context';
import * as fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import {
  LOCALE_CONTEXT,
  RUNTIME_SYMBOL,
  THEME_CONTEXT,
  UIElement,
  compareSemver,
  defineComponents,
  formatI18nMessage,
  getRuntime,
  html,
  negotiateRuntime,
  property,
  registerLocaleMessages,
  registerStyles,
  type MessageCatalog,
} from './index.js';

class TestControlElement extends UIElement {
  static formAssociated = true;

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
  restoreCalls: Array<{ state: unknown; mode: string }> = [];

  override onFirstConnect(): void {
    this.firstConnectCalls += 1;
  }

  override onMoveBefore(): void {
    this.moveBeforeCalls += 1;
  }

  override onFormReset(): void {
    this.resetCalls += 1;
    this.value = '';
    this.setCustomState('dirty', false);
  }

  override onFormStateRestore(state: File | string | FormData | null, mode: 'restore' | 'autocomplete'): void {
    this.restoreCalls.push({ state, mode });
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  setDirty(active: boolean): void {
    this.setCustomState('dirty', active);
  }

  readText(key: string, params?: Record<string, string | number>): string {
    return this.t(key, params);
  }

  get internalFormDisabled(): boolean {
    return this._formDisabled;
  }

  override render() {
    return html`<label id="lbl">${this.label}</label
      ><input aria-labelledby="lbl" .value=${this.value} ?disabled=${this.disabled || this._formDisabled} />`;
  }
}

if (!customElements.get('mth-test-control')) {
  customElements.define('mth-test-control', TestControlElement);
}

describe('@methane/core UIElement, runtime, i18n, and ContextProtocol', () => {
  it('negotiates global runtime singleton with SemVer skew protection and duplicate-core __DEV__ warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fakeGlobal: Record<symbol, unknown> = {};

    const rt1 = negotiateRuntime({ version: '1.0.0', bundleId: 'bundle-a', hostGlobal: fakeGlobal });
    expect(rt1.major).toBe(1);
    expect(rt1.version).toBe('1.0.0');
    expect(fakeGlobal[RUNTIME_SYMBOL]).toBe(rt1);

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
    // Existing coordinator state preserved across upgrade
    expect(rt2.overlays.size).toBe(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    // Lower version does not downgrade higher version
    const rt3 = negotiateRuntime({ version: '1.1.0', bundleId: 'bundle-c', hostGlobal: fakeGlobal });
    expect(rt3.version).toBe('1.3.0');

    // Incompatible major throws
    expect(() =>
      negotiateRuntime({ version: '2.0.0', bundleId: 'bundle-v2', hostGlobal: fakeGlobal }),
    ).toThrow(/Incompatible @methane\/core runtime major/);

    // Hotkey normalization preserves space/IME guards consistently
    let spaceHits = 0;
    const unsubSpace = rt1.hotkeys.register({
      id: 'space-cmd',
      combo: 'Ctrl+Space',
      handler: () => {
        spaceHits += 1;
      },
    });
    expect(
      rt1.hotkeys.handleKeydown(
        new KeyboardEvent('keydown', { key: ' ', ctrlKey: true, keyCode: 229 }),
      ),
    ).toBe(false);
    expect(
      rt1.hotkeys.handleKeydown(new KeyboardEvent('keydown', { key: ' ', ctrlKey: true })),
    ).toBe(true);
    expect(spaceHits).toBe(1);
    unsubSpace();

    warnSpy.mockRestore();
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

    // Re-registering the same constructor under another prefix subclasses cleanly without NotSupportedError
    const reDefined = defineComponents({
      prefix: 'beta',
      components: { 'mth-chip': CustomChip },
    });
    expect(reDefined).toEqual(['beta-chip']);
    expect(customElements.get('beta-chip')).toBeDefined();
    expect(customElements.get('beta-chip')).not.toBe(CustomChip);

    // Reset default prefix back to mth
    getRuntime().registry.prefix = 'mth';

    registerStyles('acme-chip', '.chip { color: red; }');
    const raw = getRuntime().styles.getRawCssForTag('acme-chip');
    expect(raw.some((cssText) => cssText.includes('@layer override'))).toBe(true);
  });

  it('formats i18n messages with Intl.PluralRules and \\u2068...\\u2069 RTL bidi isolation', () => {
    const formatted = formatI18nMessage(
      TestControlElement.messages['items']!,
      { count: 1 },
      'en',
    );
    expect(formatted).toBe('\u20681\u2069 item');

    const zero = formatI18nMessage(TestControlElement.messages['items']!, { count: 0 }, 'en');
    expect(zero).toBe('No items');

    const greeting = formatI18nMessage('Welcome, {user}!', { user: 'Mehdi' }, 'ar');
    expect(greeting).toBe('Welcome, \u2068Mehdi\u2069!');

    registerLocaleMessages('fr', 'mth-test-control', { greeting: 'Bonjour {name}' });
    const el = document.createElement('mth-test-control') as TestControlElement;
    el.setAttribute('lang', 'fr');
    expect(el.readText('greeting', { name: 'Ada' })).toBe('Bonjour \u2068Ada\u2069');
  });

  it('propagates versioned Community Context Protocol across Shadow/Light DOM boundaries', async () => {
    const host = document.createElement('div');
    new ContextProvider(host, {
      context: LOCALE_CONTEXT,
      initialValue: {
        version: 1,
        locale: 'ar',
        dir: 'rtl',
        messages: { 'mth-test-control': { greeting: 'مرحبا {name}' } },
      },
    });
    new ContextProvider(host, {
      context: THEME_CONTEXT,
      initialValue: { version: 1, theme: 'dark', density: 'compact', dir: 'rtl' },
    });

    const el = document.createElement('mth-test-control') as TestControlElement;
    host.appendChild(el);
    document.body.appendChild(host);
    await el.updateComplete;

    expect(el.readText('greeting', { name: 'MNS' })).toBe('مرحبا \u2068MNS\u2069');
    host.remove();
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
    el.remove();
  });

  it('emits __DEV__ diagnostics for cross-root ARIA IDs and delegatesFocus + host role conflict', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    class BadA11yElement extends UIElement {
      static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
      override render() {
        return html`<input aria-labelledby="missing-id" />`;
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

    bad.remove();
    warnSpy.mockRestore();
  });
});

describe('@methane/core fast-check property-based tests (ADR-001)', () => {
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
      fc.record({ type: fc.constant('set-attr' as const), label: fc.string({ minLength: 1, maxLength: 20 }) }),
      fc.record({ type: fc.constant('toggle-disabled' as const), disabled: fc.boolean() }),
      fc.constant({ type: 'connect' as const }),
      fc.constant({ type: 'disconnect' as const }),
      fc.constant({ type: 'move' as const }),
      fc.record({ type: fc.constant('form-disable' as const), disabled: fc.boolean() }),
      fc.constant({ type: 'form-reset' as const }),
      fc.record({ type: fc.constant('form-restore' as const), state: fc.string({ maxLength: 16 }) }),
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
                // ADR-014 invariant: formDisabledCallback NEVER mutates host disabled property/attribute
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
