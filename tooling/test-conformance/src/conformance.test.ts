import { describe, expect, it } from 'vitest';
import {
  DataConsumerSuite,
  FormControlSuite,
  HydrationPuritySuite,
  ListboxSuite,
  OverlaySuite,
  RovingFocusSuite,
  SatelliteEngineSuite,
  scanSameRootAria,
  type ConformanceDataSource,
} from './index.js';

describe('@methane-ui/test-conformance same-root ARIA scanner (ADR-003)', () => {
  it('passes when all aria-* IDREFs resolve inside the same DOM root (including ShadowRoot)', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });

    const label = document.createElement('label');
    label.id = 'lbl-1';
    label.textContent = 'Username';
    const input = document.createElement('input');
    input.setAttribute('aria-labelledby', 'lbl-1');
    input.setAttribute('aria-describedby', 'hint-1 err-1');
    const hint = document.createElement('span');
    hint.id = 'hint-1';
    const err = document.createElement('span');
    err.id = 'err-1';

    shadow.append(label, input, hint, err);
    document.body.appendChild(host);

    const report = scanSameRootAria(host);
    expect(report.valid).toBe(true);
    expect(report.rootsScanned).toBe(2);
    expect(report.referencesChecked).toBe(3);
    expect(report.issues).toHaveLength(0);
    host.remove();
  });

  it('detects cross-root and dangling aria-* IDREFs', () => {
    const outerLabel = document.createElement('span');
    outerLabel.id = 'outer-label';
    document.body.appendChild(outerLabel);

    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const control = document.createElement('input');
    control.setAttribute('aria-labelledby', 'outer-label missing-id');
    shadow.appendChild(control);
    document.body.appendChild(host);

    const report = scanSameRootAria(host);
    expect(report.valid).toBe(false);
    expect(report.issues).toHaveLength(2);
    expect(report.issues[0]).toMatchObject({
      attribute: 'aria-labelledby',
      targetId: 'outer-label',
      reason: 'cross-root',
      rootKind: 'shadow-root',
    });
    expect(report.issues[1]).toMatchObject({
      attribute: 'aria-labelledby',
      targetId: 'missing-id',
      reason: 'dangling',
      rootKind: 'shadow-root',
    });

    outerLabel.remove();
    host.remove();
  });

  it('classifies light-DOM <-> shadow-DOM ID leaks as cross-root even on detached subtrees', () => {
    const detachedHost = document.createElement('div');
    const lightLabel = document.createElement('span');
    lightLabel.id = 'detached-light-lbl';
    detachedHost.appendChild(lightLabel);

    const shadow = detachedHost.attachShadow({ mode: 'open' });
    const shadowInput = document.createElement('input');
    shadowInput.setAttribute('aria-labelledby', 'detached-light-lbl');
    shadow.appendChild(shadowInput);

    const report = scanSameRootAria(detachedHost);
    expect(report.valid).toBe(false);
    expect(report.issues).toHaveLength(1);
    expect(report.issues[0]).toMatchObject({
      attribute: 'aria-labelledby',
      targetId: 'detached-light-lbl',
      reason: 'cross-root',
      rootKind: 'shadow-root',
    });
  });
});

describe('@methane-ui/test-conformance Class & Satellite Suites', () => {
  it('runs FormControlSuite against a compliant FACE harness and rejects host disabled mutation', async () => {
    class MockFormInput extends HTMLElement {
      static formAssociated = true;
      internalDisabled = false;
      private _value = '';
      private _hiddenInput: HTMLInputElement;

      constructor() {
        super();
        this._hiddenInput = document.createElement('input');
        this._hiddenInput.type = 'hidden';
      }

      connectedCallback() {
        this._hiddenInput.name = this.getAttribute('name') ?? 'field';
        this._hiddenInput.value = this._value;
        if (!this._hiddenInput.parentNode) {
          this.appendChild(this._hiddenInput);
        }
        const fs = this.closest('fieldset');
        const form = this.closest('form');
        if (fs) {
          this.syncFieldsetState();
          new MutationObserver(() => this.syncFieldsetState()).observe(fs, {
            attributes: true,
            attributeFilter: ['disabled'],
          });
        }
        if (form) {
          form.addEventListener('reset', () => {
            this.value = '';
          });
        }
      }

      set value(v: string) {
        this._value = v;
        this._hiddenInput.value = v;
      }

      get value(): string {
        return this._value;
      }

      syncFieldsetState() {
        const fs = this.closest('fieldset');
        this.internalDisabled = fs ? fs.disabled : false;
        this._hiddenInput.disabled = this.internalDisabled;
      }
    }

    if (!customElements.get('mock-form-input')) {
      customElements.define('mock-form-input', MockFormInput);
    }

    const report = await FormControlSuite.run({
      mount: () => document.createElement('mock-form-input') as MockFormInput,
      setValue: (el, v) => {
        (el as MockFormInput).value = v;
      },
      getValue: (el) => (el as MockFormInput).value,
      getFormDataValue: (fd, name) => fd.get(name),
      getInternalDisabled: (el) => (el as MockFormInput).internalDisabled,
      isRequiredInvalid: (el) => el.hasAttribute('required') && (el as MockFormInput).value === '',
    });

    expect(report.passed).toBe(true);
    expect(report.checks.length).toBeGreaterThanOrEqual(7);
  });

  it('runs OverlaySuite on compliant overlay lifecycle and focus restoration', async () => {
    const report = await OverlaySuite.run({
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
      mount: () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open';
        const overlay = document.createElement('div');
        overlay.tabIndex = -1;
        const setOpen = (next: boolean) => {
          const currentlyOpen = overlay.dataset['open'] === 'true';
          if (next === currentlyOpen) return;
          const ev = new CustomEvent(next ? 'mth-open' : 'mth-close', { cancelable: true });
          if (!overlay.dispatchEvent(ev)) return;
          overlay.dataset['open'] = String(next);
          if (!next) trigger.focus();
          overlay.dispatchEvent(new CustomEvent(next ? 'mth-after-open' : 'mth-after-close'));
        };
        overlay.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') setOpen(false);
        });
        document.body.addEventListener('click', (e) => {
          if (
            overlay.dataset['open'] === 'true' &&
            !overlay.contains(e.target as Node) &&
            e.target !== trigger
          ) {
            setOpen(false);
          }
        });
        return { overlay, trigger };
      },
      open: (overlay) => {
        const ev = new CustomEvent('mth-open', { cancelable: true });
        if (!overlay.dispatchEvent(ev)) return;
        overlay.dataset['open'] = 'true';
        overlay.focus();
        overlay.dispatchEvent(new CustomEvent('mth-after-open'));
      },
      close: (overlay) => {
        const ev = new CustomEvent('mth-close', { cancelable: true });
        if (!overlay.dispatchEvent(ev)) return;
        overlay.dataset['open'] = 'false';
        overlay.dispatchEvent(new CustomEvent('mth-after-close'));
      },
      isOpen: (overlay) => overlay.dataset['open'] === 'true',
    });

    expect(report.passed).toBe(true);
  });

  it('runs RovingFocusSuite including LTR and RTL axis flip', async () => {
    const report = await RovingFocusSuite.run({
      orientation: 'horizontal',
      loop: true,
      mount: (dir = 'ltr') => {
        const container = document.createElement('div');
        container.setAttribute('dir', dir);
        const items = ['One', 'Two', 'Three'].map((label, idx) => {
          const btn = document.createElement('button');
          btn.textContent = label;
          btn.tabIndex = idx === 0 ? 0 : -1;
          return btn;
        });
        container.append(...items);

        const moveTo = (idx: number) => {
          const wrapped = (idx + items.length) % items.length;
          items.forEach((b, i) => {
            b.tabIndex = i === wrapped ? 0 : -1;
          });
          items[wrapped]?.focus();
        };

        container.addEventListener('keydown', (e) => {
          const cur = items.findIndex((b) => b.tabIndex === 0);
          const isRtl = container.getAttribute('dir') === 'rtl';
          const forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
          const backKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
          if (e.key === forwardKey) moveTo(cur + 1);
          else if (e.key === backKey) moveTo(cur - 1);
          else if (e.key === 'Home') moveTo(0);
          else if (e.key === 'End') moveTo(items.length - 1);
        });

        return container;
      },
      getItems: (container) => Array.from(container.querySelectorAll('button')),
    });

    expect(report.passed).toBe(true);
  });

  it('runs ListboxSuite with same-root ARIA, selection, and typeahead', async () => {
    const report = await ListboxSuite.run({
      mount: () => {
        const listbox = document.createElement('div');
        listbox.setAttribute('role', 'listbox');
        listbox.tabIndex = 0;

        const options = ['Apple', 'Banana', 'Cherry'].map((text, idx) => {
          const opt = document.createElement('div');
          opt.id = `opt-${idx}`;
          opt.setAttribute('role', 'option');
          opt.setAttribute('aria-selected', 'false');
          opt.textContent = text;
          return opt;
        });
        listbox.append(...options);

        let activeIdx = -1;
        const setActive = (idx: number) => {
          activeIdx = idx;
          const opt = options[idx];
          if (opt) listbox.setAttribute('aria-activedescendant', opt.id);
        };

        listbox.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            setActive((activeIdx + 1) % options.length);
          } else if (e.key === 'Enter' && activeIdx >= 0) {
            options.forEach((o, i) => o.setAttribute('aria-selected', String(i === activeIdx)));
          } else if (e.key.length === 1) {
            const found = options.findIndex((o) =>
              o.textContent?.toLowerCase().startsWith(e.key.toLowerCase()),
            );
            if (found >= 0) setActive(found);
          }
        });
        return listbox;
      },
      getListboxRoot: (el) => el,
      getOptions: (el) => Array.from(el.querySelectorAll('[role="option"]')),
      getActiveOption: (el) => {
        const id = el.getAttribute('aria-activedescendant');
        return id ? el.querySelector(`#${id}`) : null;
      },
      getSelectedOptions: (el) => Array.from(el.querySelectorAll('[aria-selected="true"]')),
    });

    expect(report.passed).toBe(true);
  });

  it('runs ListboxSuite when roles are exposed via ElementInternals/ARIAMixin `.role` properties', async () => {
    const report = await ListboxSuite.run({
      mount: () => {
        const listbox = document.createElement('div');
        Object.defineProperty(listbox, 'role', { value: 'listbox', configurable: true });
        listbox.tabIndex = 0;

        const options = ['Alpha', 'Beta'].map((text, idx) => {
          const opt = document.createElement('div');
          opt.id = `aria-opt-${idx}`;
          Object.defineProperty(opt, 'role', { value: 'option', configurable: true });
          opt.setAttribute('aria-selected', 'false');
          opt.textContent = text;
          return opt;
        });
        listbox.append(...options);

        let activeIdx = -1;
        listbox.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            activeIdx = (activeIdx + 1) % options.length;
            listbox.setAttribute('aria-activedescendant', options[activeIdx]!.id);
          } else if (e.key === 'Enter' && activeIdx >= 0) {
            options.forEach((o, i) => o.setAttribute('aria-selected', String(i === activeIdx)));
          } else if (e.key.length === 1) {
            const idx = options.findIndex((o) =>
              o.textContent?.toLowerCase().startsWith(e.key.toLowerCase()),
            );
            if (idx >= 0) {
              activeIdx = idx;
              listbox.setAttribute('aria-activedescendant', options[idx]!.id);
            }
          }
        });
        return listbox;
      },
      getListboxRoot: (el) => el,
      getOptions: (el) => Array.from(el.children) as HTMLElement[],
      getActiveOption: (el) => {
        const id = el.getAttribute('aria-activedescendant');
        return id ? el.querySelector(`#${id}`) : null;
      },
      getSelectedOptions: (el) => Array.from(el.querySelectorAll('[aria-selected="true"]')),
    });

    expect(report.passed).toBe(true);
  });

  it('runs DataConsumerSuite verifying AbortController cancellation and states', async () => {
    interface Item {
      id: string;
      label: string;
    }
    let currentState: 'idle' | 'loading' | 'refreshing' | 'empty' | 'error' | 'ready' = 'idle';
    let currentItems: readonly Item[] = [];
    let activeAbort: AbortController | null = null;
    let sourceRef: ConformanceDataSource<Item> | null = null;

    const report = await DataConsumerSuite.run<Item>({
      mount: (ds) => {
        sourceRef = ds;
        currentState = 'idle';
        currentItems = [];
        return document.createElement('div');
      },
      triggerQuery: async (_el, filter) => {
        activeAbort?.abort();
        activeAbort = new AbortController();
        const signal = activeAbort.signal;
        currentState = currentItems.length > 0 ? 'refreshing' : 'loading';
        try {
          const res = await sourceRef!.query({ filter, signal });
          if (signal.aborted) return;
          currentItems = res.items;
          currentState = res.items.length === 0 ? 'empty' : 'ready';
        } catch (err) {
          if ((err as { name?: string }).name === 'AbortError') return;
          currentState = 'error';
        }
      },
      getState: () => currentState,
      getRenderedItemCount: () => currentItems.length,
    });

    expect(report.passed).toBe(true);
  });

  it('runs SatelliteEngineSuite (50x mount/unmount leak check + token sync)', async () => {
    class MockSatellite extends HTMLElement {
      engine: { destroyed: boolean } | null = null;
      connectedCallback() {
        this.engine = { destroyed: false };
      }
      disconnectedCallback() {
        if (this.engine) this.engine.destroyed = true;
        this.engine = null;
      }
    }
    if (!customElements.get('mock-satellite')) {
      customElements.define('mock-satellite', MockSatellite);
    }

    const report = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mock-satellite') as MockSatellite,
    });
    expect(report.passed).toBe(true);
  });

  it('runs HydrationPuritySuite confirming zero shadow child mutations on upgrade', async () => {
    const report = await HydrationPuritySuite.run({
      ssrHtml: `<mth-canary><template shadowrootmode="open"><span id="lbl">Hi</span><input aria-labelledby="lbl"></template></mth-canary>`,
      upgradeElement: async (host) => {
        // Clean hydration attaches behavior without mutating shadow DOM children
        host.setAttribute('data-upgraded', 'true');
      },
    });
    expect(report.passed).toBe(true);
  });

  it('rejects impure hydration that mutates shadow DOM children and host disabled mutation', async () => {
    const dirtyHydration = await HydrationPuritySuite.run({
      throwOnFailure: false,
      ssrHtml: `<mth-canary><template shadowrootmode="open"><span>SSR</span></template></mth-canary>`,
      upgradeElement: async (host) => {
        host.shadowRoot?.appendChild(document.createElement('div'));
      },
    });
    expect(dirtyHydration.passed).toBe(false);
    expect(dirtyHydration.failures[0]).toContain('zero-shadow-child-mutations-on-upgrade');

    const badFormReport = await FormControlSuite.run({
      throwOnFailure: false,
      mount: () => {
        const el = document.createElement('div');
        queueMicrotask(() => {
          const fs = el.closest('fieldset');
          if (fs) {
            new MutationObserver(() => {
              el.setAttribute('disabled', '');
            }).observe(fs, { attributes: true, attributeFilter: ['disabled'] });
          }
        });
        return el;
      },
      setValue: () => undefined,
      getValue: () => '',
      getFormDataValue: () => null,
      getInternalDisabled: (el) => el.hasAttribute('disabled'),
    });
    expect(badFormReport.passed).toBe(false);
    expect(
      badFormReport.failures.some((f) => f.includes('fieldset-disabled-without-host-mutation')),
    ).toBe(true);
  });
});
