import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  DataConsumerSuite,
  FormControlSuite,
  HydrationPuritySuite,
  ListboxSuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import '@methane-ui/ui/field';
import '@methane-ui/ui/option';
import '@methane-ui/ui/option-group';
import { comboboxSpec } from './combobox.spec.js';
import { MthCombobox, registerMthCombobox } from './index.js';

describe('<mth-combobox>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(comboboxSpec);
    expect(compiled.docs).toContain('`<mth-combobox>`');
    expect(compiled.tests).toContain('<mth-combobox>');

    let mountedFormControl: MthCombobox | null = null;
    const formAdapter = {
      mount: () => {
        mountedFormControl = document.createElement('mth-combobox') as MthCombobox;
        mountedFormControl.label = 'Fruit';
        mountedFormControl.options = [
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ];
        return mountedFormControl;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const cb = el as MthCombobox;
        cb.value = value;
        await cb.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthCombobox).value,
      getFormDataValue: (formData: FormData, name: string) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedFormControl) return null;
        return mountedFormControl.isEffectivelyDisabled ? null : mountedFormControl.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean((el as MthCombobox).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthCombobox).checkValidity(),
    };

    const report = await runBehaviorSpecAssertions(comboboxSpec, {
      formControl: formAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const standaloneForm = await FormControlSuite.run(formAdapter);
    expect(standaloneForm.failures).toEqual([]);
    expect(standaloneForm.passed).toBe(true);

    const el = document.createElement('mth-combobox') as MthCombobox;
    el.label = 'City';
    el.options = [
      { value: 'nyc', label: 'New York', group: 'East' },
      { value: 'sf', label: 'San Francisco', group: 'West' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    await el.show();
    await el.updateComplete;

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid, JSON.stringify(aria.issues)).toBe(true);
  });

  it('passes ListboxSuite', async () => {
    const report = await ListboxSuite.run({
      mount: async () => {
        const cb = document.createElement('mth-combobox') as MthCombobox;
        cb.label = 'Letters';
        cb.options = [
          { value: 'alpha', label: 'Alpha' },
          { value: 'beta', label: 'Beta' },
          { value: 'gamma', label: 'Gamma', disabled: true },
        ];
        document.body.appendChild(cb);
        await cb.updateComplete;
        await cb.show();
        await cb.updateComplete;
        return cb;
      },
      getListboxRoot: (el) => el.shadowRoot!,
      getOptions: (el) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
      getActiveOption: (el) => {
        const listbox = el.shadowRoot!.querySelector<HTMLElement>('[role="listbox"]');
        const activeId = listbox?.getAttribute('aria-activedescendant');
        return activeId ? el.shadowRoot!.getElementById(activeId) : null;
      },
      getSelectedOptions: (el) =>
        Array.from(
          el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'),
        ),
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('passes OverlaySuite', async () => {
    const report = await OverlaySuite.run({
      supportsLightDismiss: true,
      supportsCancelableOpen: true,
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open Combobox';

        const overlay = document.createElement('mth-combobox') as MthCombobox;
        overlay.label = 'Numbers';
        overlay.options = [
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
        ];
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthCombobox).show();
        await (overlay as MthCombobox).updateComplete;
      },
      close: async (overlay) => {
        await (overlay as MthCombobox).hide('programmatic');
        await (overlay as MthCombobox).updateComplete;
      },
      isOpen: (overlay) => (overlay as MthCombobox).open,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('passes DataConsumerSuite', async () => {
    const report = await DataConsumerSuite.run({
      mount: async (source) => {
        const cb = document.createElement('mth-combobox') as MthCombobox;
        cb.label = 'Async';
        cb.dataSource = source as MthCombobox['dataSource'];
        document.body.appendChild(cb);
        await cb.updateComplete;
        return cb;
      },
      triggerQuery: async (el, queryText) => {
        await (el as MthCombobox).query(queryText ?? '');
        await (el as MthCombobox).updateComplete;
      },
      getState: (el) => (el as MthCombobox).dataState,
      getRenderedItemCount: (el) =>
        el.shadowRoot!.querySelectorAll('[role="option"]').length,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-combobox label="Country" value="us"></mth-combobox>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-combobox>', 'hyd-combobox>')
      .replaceAll('<mth-combobox', '<hyd-combobox');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCombobox('hyd');
        customElements.upgrade(host);
        await (host as MthCombobox).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('reconciles declarative <mth-option> and <mth-option-group> with .options JS array', async () => {
    const el = document.createElement('mth-combobox') as MthCombobox;

    const group = document.createElement('mth-option-group');
    group.setAttribute('label', 'Citrus');
    const opt1 = document.createElement('mth-option');
    opt1.setAttribute('value', 'lemon');
    opt1.textContent = 'Lemon';
    const opt2 = document.createElement('mth-option');
    opt2.setAttribute('value', 'lime');
    opt2.setAttribute('disabled', '');
    opt2.textContent = 'Lime';
    group.append(opt1, opt2);

    const opt3 = document.createElement('mth-option');
    opt3.setAttribute('value', 'apple');
    opt3.textContent = 'Apple';

    el.append(group, opt3);
    document.body.appendChild(el);
    await el.updateComplete;
    await el.show();
    await el.updateComplete;

    let rendered = Array.from(el.shadowRoot!.querySelectorAll('[role="option"]'));
    expect(rendered).toHaveLength(3);
    expect(rendered.map((r) => r.getAttribute('data-value'))).toEqual(['apple', 'lemon', 'lime']);
    expect(el.shadowRoot!.querySelector('[role="group"] [part="group-label"]')?.textContent).toBe(
      'Citrus',
    );

    el.selectValue('lemon');
    await el.updateComplete;
    expect(el.value).toBe('lemon');
    expect((opt1 as unknown as { selected: boolean }).selected).toBe(true);

    el.options = [{ value: 'js-only', label: 'Imperative Item' }];
    await el.updateComplete;
    rendered = Array.from(el.shadowRoot!.querySelectorAll('[role="option"]'));
    expect(rendered).toHaveLength(1);
    expect(rendered[0]?.getAttribute('data-value')).toBe('js-only');
  });

  it('guards Enter selection during IME composition and supports clearable', async () => {
    const el = document.createElement('mth-combobox') as MthCombobox;
    el.clearable = true;
    el.options = [
      { value: 'tokyo', label: 'Tokyo' },
      { value: 'kyoto', label: 'Kyoto' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    const input = el.shadowRoot!.querySelector<HTMLInputElement>('#mth-cb-input')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await el.updateComplete;
    expect(el.open).toBe(true);

    input.dispatchEvent(new CompositionEvent('compositionstart', { data: 'に' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('');

    input.value = 'Kyoto';
    input.dispatchEvent(new CompositionEvent('compositionend', { data: 'Kyoto' }));
    await el.updateComplete;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('kyoto');

    const clearBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="clear-button"]')!;
    clearBtn.click();
    await el.updateComplete;
    expect(el.value).toBe('');
  });

  it('verifies dual-path positioning (CSS Anchor and JS fallback)', async () => {
    const origCss = globalThis.CSS;

    try {
      Object.defineProperty(globalThis, 'CSS', {
        configurable: true,
        value: {
          supports: vi.fn((prop: string, val?: string) => prop === 'position-area' && Boolean(val)),
        },
      });

      const elAnchor = document.createElement('mth-combobox') as MthCombobox;
      elAnchor.options = [{ value: 'a', label: 'Alpha' }];
      document.body.appendChild(elAnchor);
      await elAnchor.updateComplete;
      await elAnchor.show();
      await elAnchor.updateComplete;
      expect(elAnchor.lastPositioningResult?.strategy).toBe('css-anchor');

      // 2. Explicit forceFallback path
      elAnchor.forceFallback = true;
      await elAnchor.updateComplete;
      expect(elAnchor.lastPositioningResult?.strategy).toBe('js-fallback');

      // Zero inline style attributes on the listbox shadow element (CSP style-src-attr 'none' compliance;
      // PositioningController mutates CSSOM .style on #mth-cb-control and #mth-cb-popup during show()).
      expect(elAnchor.shadowRoot!.querySelector('#mth-cb-listbox')!.hasAttribute('style')).toBe(false);
    } finally {
      Object.defineProperty(globalThis, 'CSS', {
        configurable: true,
        value: origCss,
      });
    }
  });

  it('consumes FieldContext (label, hint, error) from enclosing <mth-field> with same-root ARIA and zero inline styles', async () => {
    const field = document.createElement('mth-field');
    field.setAttribute('label', 'Country');
    field.setAttribute('hint', 'Pick a country');
    field.setAttribute('error', 'Selection required');

    const cb = document.createElement('mth-combobox') as MthCombobox;
    cb.options = [{ value: 'ca', label: 'Canada' }];
    field.appendChild(cb);
    document.body.appendChild(field);

    await (field as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    await cb.updateComplete;
    await Promise.resolve();
    await cb.updateComplete;

    const input = cb.shadowRoot!.querySelector<HTMLInputElement>('#mth-cb-input')!;
    expect(cb.shadowRoot!.querySelector('#mth-cb-label')?.textContent?.trim()).toBe('Country');
    expect(cb.shadowRoot!.querySelector('#mth-cb-error')?.textContent?.trim()).toBe(
      'Selection required',
    );
    expect(input.getAttribute('aria-labelledby')).toBe('mth-cb-label');
    expect(input.getAttribute('aria-errormessage')).toBe('mth-cb-error');
    expect(cb.shadowRoot!.querySelectorAll('[style]')).toHaveLength(0);
    expect(scanSameRootAria(cb.shadowRoot!).valid).toBe(true);
  });

  it('passes HydrationPuritySuite with slotted mth-option-group and mth-option and reconciles lazily on show()', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-combobox label="Framework" value="lit" clearable>
        <mth-option-group label="Web Standards">
          <mth-option value="lit">Lit 3</mth-option>
          <mth-option value="wc">Custom Elements</mth-option>
        </mth-option-group>
      </mth-combobox>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('<mth-combobox', '<hyd-slotted-combobox')
      .replaceAll('</mth-combobox>', '</hyd-slotted-combobox>');

    let hydratedHost: MthCombobox | null = null;
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        hydratedHost = host as MthCombobox;
        registerMthCombobox('hyd-slotted');
        customElements.upgrade(host);
        await (host as MthCombobox).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    expect(hydratedHost).not.toBeNull();
    document.body.appendChild(hydratedHost!);
    await hydratedHost!.show();
    await hydratedHost!.updateComplete;
    expect(
      Array.from(hydratedHost!.shadowRoot!.querySelectorAll('[role="option"]')).map((n) =>
        n.getAttribute('data-value'),
      ),
    ).toEqual(['lit', 'wc']);
  });

  it('supports keyboard navigation (ArrowDown/ArrowUp skipping disabled, wrap-around, Tab dismiss)', async () => {
    const el = document.createElement('mth-combobox') as MthCombobox;
    el.options = [
      { value: 'first', label: 'First' },
      { value: 'disabled', label: 'Disabled', disabled: true },
      { value: 'last', label: 'Last' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    const input = el.shadowRoot!.querySelector<HTMLInputElement>('#mth-cb-input')!;

    // ArrowUp when closed opens and activates last enabled option
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await vi.waitFor(async () => {
      await el.updateComplete;
      expect(el.open).toBe(true);
      const id = input.getAttribute('aria-activedescendant');
      expect(id).toBeTruthy();
      expect(el.shadowRoot!.getElementById(id!)?.getAttribute('data-value')).toBe('last');
    });
    let activeId: string | null;

    // ArrowDown wraps to first enabled, skipping disabled
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await el.updateComplete;
    activeId = input.getAttribute('aria-activedescendant');
    expect(el.shadowRoot!.getElementById(activeId!)?.getAttribute('data-value')).toBe('first');

    // ArrowDown skips disabled middle option to 'last'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await el.updateComplete;
    activeId = input.getAttribute('aria-activedescendant');
    expect(el.shadowRoot!.getElementById(activeId!)?.getAttribute('data-value')).toBe('last');

    // ArrowUp skips disabled back to 'first'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await el.updateComplete;
    activeId = input.getAttribute('aria-activedescendant');
    expect(el.shadowRoot!.getElementById(activeId!)?.getAttribute('data-value')).toBe('first');

    // Tab closes open popup
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await el.updateComplete;
    expect(el.open).toBe(false);
  });

  it('filters options locally, renders empty state on no match, and respects filterable=false', async () => {
    const el = document.createElement('mth-combobox') as MthCombobox;
    el.options = [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'jp', label: 'Japan' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    await el.query('can');
    await el.updateComplete;
    let rendered = Array.from(el.shadowRoot!.querySelectorAll('[role="option"]'));
    expect(rendered.map((r) => r.getAttribute('data-value'))).toEqual(['ca']);

    await el.query('zzz-nonexistent');
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(el.shadowRoot!.querySelector('[part="empty"]')).not.toBeNull();

    el.filterable = false;
    await el.query('can');
    await el.updateComplete;
    rendered = Array.from(el.shadowRoot!.querySelectorAll('[role="option"]'));
    expect(rendered).toHaveLength(3);
  });

  it('supports multiple selection, toggle-off, clearable events, and disabled option groups', async () => {
    const el = document.createElement('mth-combobox') as MthCombobox;
    el.multiple = true;
    el.clearable = true;

    const disabledGroup = document.createElement('mth-option-group');
    disabledGroup.setAttribute('label', 'Archived');
    disabledGroup.setAttribute('disabled', '');
    const archivedOpt = document.createElement('mth-option');
    archivedOpt.setAttribute('value', 'legacy');
    archivedOpt.textContent = 'Legacy';
    disabledGroup.appendChild(archivedOpt);

    const activeOpt1 = document.createElement('mth-option');
    activeOpt1.setAttribute('value', 'alpha');
    activeOpt1.textContent = 'Alpha';
    const activeOpt2 = document.createElement('mth-option');
    activeOpt2.setAttribute('value', 'beta');
    activeOpt2.textContent = 'Beta';

    el.append(disabledGroup, activeOpt1, activeOpt2);
    document.body.appendChild(el);
    await el.updateComplete;
    await el.show();
    await el.updateComplete;

    const changePayloads: Array<{ value: string; selectedValues: ReadonlyArray<string> }> = [];
    let clearCount = 0;
    el.addEventListener('mth-change', (ev) => {
      changePayloads.push((ev as CustomEvent<{ value: string; selectedValues: ReadonlyArray<string> }>).detail);
    });
    el.addEventListener('mth-clear', () => {
      clearCount += 1;
    });

    // Disabled group child cannot be selected
    el.selectValue('legacy');
    await el.updateComplete;
    expect(el.value).toBe('');

    // Selecting multiple options keeps popup open and joins values
    el.selectValue('alpha');
    el.selectValue('beta');
    await el.updateComplete;
    expect(el.open).toBe(true);
    expect(el.value).toBe('alpha,beta');
    expect(changePayloads.at(-1)).toEqual({
      value: 'alpha,beta',
      selectedValues: ['alpha', 'beta'],
    });

    // Toggling an already-selected option removes it
    el.selectValue('alpha');
    await el.updateComplete;
    expect(el.value).toBe('beta');

    // Clear resets value and emits mth-clear + mth-change
    el.clear();
    await el.updateComplete;
    expect(el.value).toBe('');
    expect(clearCount).toBe(1);
    expect(changePayloads.at(-1)).toEqual({ value: '', selectedValues: [] });
  });

  it('handles FACE form reset, fieldset disabled, Escape dismiss, and outside light dismiss', async () => {
    const form = document.createElement('form');
    const fieldset = document.createElement('fieldset');
    const el = document.createElement('mth-combobox') as MthCombobox;
    el.name = 'country';
    el.defaultValue = 'us';
    el.value = 'us';
    el.options = [
      { value: 'us', label: 'United States' },
      { value: 'fr', label: 'France' },
    ];
    fieldset.appendChild(el);
    form.appendChild(fieldset);
    document.body.appendChild(form);
    await el.updateComplete;

    el.selectValue('fr');
    await el.updateComplete;
    expect(el.value).toBe('fr');

    form.reset();
    await el.updateComplete;
    expect(el.value).toBe('us');

    // Escape closes popup
    await el.show();
    await el.updateComplete;
    expect(el.open).toBe(true);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('#mth-cb-input')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await el.updateComplete;
    expect(el.open).toBe(false);

    // Outside pointerdown closes popup
    await el.show();
    await el.updateComplete;
    expect(el.open).toBe(true);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.open).toBe(false);

    // FACE formDisabledCallback disables internal input and toggle
    (el as unknown as { formDisabledCallback(disabled: boolean): void }).formDisabledCallback(true);
    await el.updateComplete;
    expect(el.isEffectivelyDisabled).toBe(true);
    expect(input.disabled).toBe(true);
    expect(el.shadowRoot!.querySelector<HTMLButtonElement>('[part="toggle-button"]')?.disabled).toBe(true);
  });
});
