import { describe, expect, it } from 'vitest';
import {
  compileA11yChecklist,
  compileSpec,
  compileSpecDocs,
  compileSpecTests,
  runBehaviorSpecAssertions,
  validateBehaviorSpec,
  verifyCustomElementsManifest,
  type ComponentBehaviorSpec,
  type CustomElementsManifest,
} from './index.js';

const validComboboxSpec: ComponentBehaviorSpec = {
  tag: 'mth-combobox',
  package: '@methane-ui/ui',
  conformance: ['form-control', 'listbox', 'overlay'],
  controllers: ['FormControlController', 'ListboxController', 'OverlayController'],
  focusModel: 'delegates-focus',
  states: ['open', 'disabled', 'user-invalid'],
  keyboard: [
    { key: 'ArrowDown', when: 'closed', expect: 'opens popup and highlights first option' },
    { key: 'Escape', when: 'open', expect: 'closes popup and restores focus' },
  ],
  props: [
    { name: 'value', type: 'string', default: '' },
    { name: 'open', type: 'boolean', default: false },
    { name: 'options', attr: false, type: 'ComboboxOption[]' },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'change', cancelable: false, detailType: 'void' },
  ],
  slots: [
    { name: '', description: 'Declarative <mth-option> and <mth-option-group> items' },
    { name: 'label', description: 'Mirrored label slot' },
  ],
  parts: [
    { name: 'base', description: 'Root wrapper' },
    { name: 'control', description: 'Text input element' },
    { name: 'popup', description: 'Options listbox overlay' },
  ],
  messages: {
    noResults: 'No matching options',
    clear: 'Clear selection',
  },
};

describe('@methane-ui/spec-compiler', () => {
  it('validates a compliant ComponentBehaviorSpec', () => {
    const result = validateBehaviorSpec(validComboboxSpec);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects ADR-014 focusModel="delegates-focus" paired with host role, bad tag prefix, and unprefixed custom events', () => {
    const invalid: ComponentBehaviorSpec = {
      ...validComboboxSpec,
      tag: 'bad-tag' as `mth-${string}`,
      role: 'combobox',
      events: [{ name: 'opened', cancelable: false, detailType: 'void' }],
    };
    const result = validateBehaviorSpec(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'tag')).toBe(true);
    expect(result.errors.some((e) => e.path === 'role')).toBe(true);
    expect(result.errors.some((e) => e.path.startsWith('events['))).toBe(true);
  });

  it('compiles real DOM/Vitest spec tests, Markdown API/APG docs, and a11y checklist', () => {
    const artifacts = compileSpec(validComboboxSpec);
    expect(artifacts.tests).toContain("describe('<mth-combobox> behavior spec conformance'");
    expect(artifacts.tests).toContain("document.createElement(\"mth-combobox\")");
    expect(artifacts.tests).toContain('customElements.get("mth-combobox")');
    expect(artifacts.tests).toContain('delegatesFocusEnabled');
    expect(artifacts.tests).toContain('scanSameRootAria(el)');
    expect(artifacts.tests).toContain("new KeyboardEvent('keydown'");
    expect(artifacts.tests).toContain('runFormControlSuite');
    expect(artifacts.tests).toContain('runListboxSuite');
    expect(artifacts.tests).toContain('runOverlaySuite');
    expect(artifacts.tests).toContain('el.hasAttribute("options")');

    const withImports = compileSpecTests(validComboboxSpec, {
      elementImportPath: './combobox.js',
      adapterImportPath: './combobox.adapter.js',
    });
    expect(withImports).toContain('import "./combobox.js";');
    expect(withImports).toContain('import { specAdapter } from "./combobox.adapter.js";');

    expect(artifacts.docs).toContain('# `<mth-combobox>`');
    expect(artifacts.docs).toContain('## APG Keyboard Interactions');
    expect(artifacts.docs).toContain('`ArrowDown`');
    expect(artifacts.docs).toContain('`::part()`');
    expect(artifacts.docs).toContain('`:state(open)`');

    expect(artifacts.a11yChecklist.items.some((i) => i.id === 'same-root-aria')).toBe(true);
    expect(artifacts.a11yChecklist.markdown).toContain('Accessibility Checklist: `<mth-combobox>`');
  });

  it('executes runBehaviorSpecAssertions against a real registered <mth-*> fixture', async () => {
    class MthSpecCanary extends HTMLElement {
      static shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
      value = '';
      open = false;
      options: string[] = [];
      dispatchedKeys: string[] = [];

      constructor() {
        super();
        const shadow = this.attachShadow(MthSpecCanary.shadowRootOptions);
        const lbl = document.createElement('label');
        lbl.id = 'lbl';
        const input = document.createElement('input');
        input.setAttribute('aria-labelledby', 'lbl');
        shadow.append(lbl, input);
        this.addEventListener('keydown', (e) => {
          this.dispatchedKeys.push(`${this.getAttribute('dir') ?? 'ltr'}:${e.key}`);
        });
      }
    }

    if (!customElements.get('mth-spec-canary')) {
      customElements.define('mth-spec-canary', MthSpecCanary);
    }

    const canarySpec: ComponentBehaviorSpec = {
      ...validComboboxSpec,
      tag: 'mth-spec-canary',
      conformance: [],
      props: [
        { name: 'value', type: 'string', default: '' },
        { name: 'open', type: 'boolean', default: false },
        { name: 'options', attr: false, type: 'string[]' },
      ],
    };

    const observedKeys: string[] = [];
    const report = await runBehaviorSpecAssertions(canarySpec, {
      onKeyboardCheck: (el, binding) => {
        observedKeys.push(`${el.getAttribute('dir')}:${binding.key}`);
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
    expect(observedKeys).toEqual(['ltr:ArrowDown', 'ltr:Escape']);
  });

  it('verifies custom-elements.json against ComponentBehaviorSpec', () => {
    const matchingManifest: CustomElementsManifest = {
      schemaVersion: '1.0.0',
      modules: [
        {
          path: 'src/combobox/combobox.ts',
          declarations: [
            {
              tagName: 'mth-combobox',
              name: 'MthCombobox',
              members: [
                { kind: 'field', name: 'value' },
                { kind: 'field', name: 'open' },
                { kind: 'field', name: 'options' },
              ],
              attributes: [{ name: 'value' }, { name: 'open' }],
              events: [{ name: 'mth-open' }, { name: 'change' }],
              slots: [{ name: '' }, { name: 'label' }],
              cssParts: [{ name: 'base' }, { name: 'control' }, { name: 'popup' }],
            },
          ],
        },
      ],
    };

    expect(verifyCustomElementsManifest(validComboboxSpec, matchingManifest)).toEqual({
      valid: true,
      tag: 'mth-combobox',
      missing: [],
      mismatched: [],
    });

    const incompleteManifest: CustomElementsManifest = {
      modules: [
        {
          path: 'src/combobox/combobox.ts',
          declarations: [
            {
              tagName: 'mth-combobox',
              members: [{ kind: 'field', name: 'value' }],
              attributes: [{ name: 'value' }, { name: 'options' }],
              events: [],
              slots: [],
              cssParts: [],
            },
          ],
        },
      ],
    };

    const mismatch = verifyCustomElementsManifest(validComboboxSpec, incompleteManifest);
    expect(mismatch.valid).toBe(false);
    expect(mismatch.missing).toContain('attr:open');
    expect(mismatch.missing).toContain('event:mth-open');
    expect(mismatch.missing).toContain('cssPart:popup');
    expect(mismatch.mismatched).toContain('attr:options declared in CEM despite spec attr: false');
  });

  it('emits warning when horizontal roving-focus spec omits dir="rtl" keyboard test', () => {
    const tabsSpec: ComponentBehaviorSpec = {
      tag: 'mth-tabs',
      package: '@methane-ui/ui',
      conformance: ['roving-focus'],
      controllers: ['RovingFocusController'],
      focusModel: 'host',
      role: 'tablist',
      states: [],
      keyboard: [{ key: 'ArrowRight', when: 'tab focused', expect: 'moves focus to next tab' }],
      props: [],
      events: [],
      slots: [],
      parts: [],
      messages: {},
    };
    const res = validateBehaviorSpec(tabsSpec);
    expect(res.valid).toBe(true);
    expect(res.warnings).toHaveLength(1);
    expect(compileSpecTests(tabsSpec)).toContain('runRovingFocusSuite');
    expect(compileSpecDocs(tabsSpec)).toContain('`host`');
    expect(compileA11yChecklist(tabsSpec).items.some((i) => i.id === 'apg-keyboard')).toBe(true);
  });
});
