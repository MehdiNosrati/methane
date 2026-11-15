import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
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
import { selectSpec } from './select.spec.js';
import { MthSelect, registerMthSelect } from './index.js';

describe('<mth-select>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(selectSpec);
    expect(compiled.docs).toContain('`<mth-select>`');
    expect(compiled.tests).toContain('<mth-select>');

    let mounted: MthSelect | null = null;
    const formAdapter = {
      mount: () => {
        mounted = document.createElement('mth-select') as MthSelect;
        mounted.label = 'Fruit';
        mounted.options = [
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ];
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const sel = el as MthSelect;
        sel.value = value;
        await sel.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthSelect).value,
      getFormDataValue: (formData: FormData, name: string) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.isEffectivelyDisabled ? null : mounted.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean(
          (el as MthSelect).shadowRoot!.querySelector<HTMLButtonElement>('#mth-select-trigger')
            ?.disabled,
        ),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthSelect).checkValidity(),
    };

    const report = await runBehaviorSpecAssertions(selectSpec, {
      formControl: formAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const standalone = await FormControlSuite.run(formAdapter);
    expect(standalone.failures).toEqual([]);
    expect(standalone.passed).toBe(true);

    const el = document.createElement('mth-select') as MthSelect;
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
        const sel = document.createElement('mth-select') as MthSelect;
        sel.label = 'Letters';
        sel.options = [
          { value: 'alpha', label: 'Alpha' },
          { value: 'beta', label: 'Beta' },
          { value: 'gamma', label: 'Gamma', disabled: true },
        ];
        document.body.appendChild(sel);
        await sel.updateComplete;
        await sel.show();
        await sel.updateComplete;
        return sel;
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

  it('passes OverlaySuite in fallback mode and with native popover support', async () => {
    const fallbackReport = await OverlaySuite.run({
      supportsLightDismiss: true,
      supportsCancelableOpen: true,
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open Fallback';

        const overlay = document.createElement('mth-select') as MthSelect;
        overlay.label = 'Numbers';
        overlay.forceFallback = true;
        overlay.options = [
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
        ];
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthSelect).show();
        await (overlay as MthSelect).updateComplete;
      },
      close: async (overlay) => {
        await (overlay as MthSelect).hide('programmatic');
        await (overlay as MthSelect).updateComplete;
      },
      isOpen: (overlay) => (overlay as MthSelect).open,
    });
    expect(fallbackReport.failures).toEqual([]);
    expect(fallbackReport.passed).toBe(true);

    const origShow = HTMLElement.prototype.showPopover;
    const origHide = HTMLElement.prototype.hidePopover;
    HTMLElement.prototype.showPopover = function () {
      this.setAttribute('data-popover-open', 'true');
    };
    HTMLElement.prototype.hidePopover = function () {
      this.removeAttribute('data-popover-open');
    };

    try {
      const nativeReport = await OverlaySuite.run({
        supportsLightDismiss: true,
        supportsCancelableOpen: true,
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Open Native';

          const overlay = document.createElement('mth-select') as MthSelect;
          overlay.label = 'Colors';
          overlay.options = [
            { value: 'red', label: 'Red' },
            { value: 'blue', label: 'Blue' },
          ];
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthSelect).show();
          await (overlay as MthSelect).updateComplete;
        },
        close: async (overlay) => {
          await (overlay as MthSelect).hide('programmatic');
          await (overlay as MthSelect).updateComplete;
        },
        isOpen: (overlay) => (overlay as MthSelect).open,
      });
      expect(nativeReport.failures).toEqual([]);
      expect(nativeReport.passed).toBe(true);
    } finally {
      HTMLElement.prototype.showPopover = origShow;
      HTMLElement.prototype.hidePopover = origHide;
    }
  });

  it('detects progressive appearance: base-select support and supports force-fallback', async () => {
    const origCss = globalThis.CSS;
    const origShowPicker = (
      HTMLSelectElement.prototype as HTMLSelectElement & { showPicker?: () => void }
    ).showPicker;

    try {
      Object.defineProperty(globalThis, 'CSS', {
        configurable: true,
        value: {
          supports: vi.fn(
            (prop: string, val?: string) => prop === 'appearance' && val === 'base-select',
          ),
        },
      });
      (
        HTMLSelectElement.prototype as HTMLSelectElement & { showPicker?: () => void }
      ).showPicker = vi.fn();

      const el = document.createElement('mth-select') as MthSelect;
      el.label = 'Browser';
      el.options = [
        { value: 'chrome', label: 'Chrome' },
        { value: 'firefox', label: 'Firefox' },
      ];
      document.body.appendChild(el);
      await el.updateComplete;

      expect(el.renderMode).toBe('base-select');
      const nativeSelect = el.shadowRoot!.querySelector<HTMLSelectElement>('#mth-select-native');
      expect(nativeSelect).not.toBeNull();

      nativeSelect!.value = 'firefox';
      nativeSelect!.dispatchEvent(new Event('change', { bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('firefox');

      el.forceFallback = true;
      await el.updateComplete;
      expect(el.renderMode).toBe('fallback');
      expect(el.shadowRoot!.querySelector('#mth-select-native')).toBeNull();
      expect(el.shadowRoot!.querySelector('#mth-select-trigger')).not.toBeNull();
    } finally {
      Object.defineProperty(globalThis, 'CSS', {
        configurable: true,
        value: origCss,
      });
      if (origShowPicker === undefined) {
        Reflect.deleteProperty(HTMLSelectElement.prototype, 'showPicker');
      } else {
        (
          HTMLSelectElement.prototype as HTMLSelectElement & { showPicker?: () => void }
        ).showPicker = origShowPicker;
      }
    }
  });

  it('reconciles declarative <mth-option> and <mth-option-group> and passes Positioning + FieldContext', async () => {
    const field = document.createElement('mth-field');
    field.setAttribute('label', 'Region');
    field.setAttribute('hint', 'Pick a region');
    field.setAttribute('error', 'Required');

    const el = document.createElement('mth-select') as MthSelect;
    const group = document.createElement('mth-option-group');
    group.setAttribute('label', 'Americas');
    const opt1 = document.createElement('mth-option');
    opt1.setAttribute('value', 'us');
    opt1.textContent = 'United States';
    const opt2 = document.createElement('mth-option');
    opt2.setAttribute('value', 'ca');
    opt2.setAttribute('disabled', '');
    opt2.textContent = 'Canada';
    group.append(opt1, opt2);
    el.appendChild(group);

    field.appendChild(el);
    document.body.appendChild(field);

    await (field as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;

    await el.show();
    await el.updateComplete;

    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>('#mth-select-trigger')!;
    expect(trigger.getAttribute('aria-labelledby')).toBe('mth-select-label');
    expect(trigger.getAttribute('aria-errormessage')).toBe('mth-select-error');
    expect(el.shadowRoot!.querySelector('#mth-select-listbox')!.hasAttribute('style')).toBe(false);
    expect(el.lastPositioningResult?.strategy).toBe('css-anchor');
    el.forceFallback = true;
    await el.updateComplete;
    expect(el.lastPositioningResult?.strategy).toBe('js-fallback');

    el.selectValue('us');
    await el.updateComplete;
    expect(el.value).toBe('us');
    expect((opt1 as unknown as { selected: boolean }).selected).toBe(true);
    expect(el.open).toBe(false);
    expect(scanSameRootAria(el.shadowRoot!).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-select label="Country" value="us"></mth-select>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-select>', 'hyd-select>')
      .replaceAll('<mth-select', '<hyd-select');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSelect('hyd');
        customElements.upgrade(host);
        await (host as MthSelect).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('renders crisp SVG caret, selected checkmark, clear icon, and supports keyboard navigation', async () => {
    const sel = document.createElement('mth-select') as MthSelect;
    sel.label = 'Framework';
    sel.clearable = true;
    sel.options = [
      { value: 'lit', label: 'Lit' },
      { value: 'solid', label: 'SolidJS' },
      { value: 'svelte', label: 'Svelte' },
    ];
    document.body.appendChild(sel);
    await sel.updateComplete;

    const caretSvg = sel.shadowRoot!.querySelector('[part="caret"] svg');
    expect(caretSvg).not.toBeNull();
    expect(caretSvg?.getAttribute('width')).toBe('16');
    expect(caretSvg?.getAttribute('height')).toBe('16');

    const trigger = sel.shadowRoot!.querySelector<HTMLButtonElement>('#mth-select-trigger')!;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await Promise.resolve();
    await sel.updateComplete;
    await Promise.resolve();
    await sel.updateComplete;
    expect(sel.open).toBe(true);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await sel.updateComplete;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await Promise.resolve();
    await sel.updateComplete;
    expect(sel.value).toBe('solid');
    expect(sel.open).toBe(false);

    const clearBtn = sel.shadowRoot!.querySelector<HTMLButtonElement>('[part="clear-button"]');
    expect(clearBtn).not.toBeNull();
    expect(clearBtn?.querySelector('svg')).not.toBeNull();

    await sel.show();
    await sel.updateComplete;
    const selectedOpt = sel.shadowRoot!.querySelector('[part="option"][aria-selected="true"]');
    expect(selectedOpt).not.toBeNull();
    expect(selectedOpt?.querySelector('svg')).not.toBeNull();

    clearBtn!.click();
    await sel.updateComplete;
    expect(sel.value).toBe('');
    expect(sel.shadowRoot!.querySelector('[part="clear-button"]')).toBeNull();

    await sel.show();
    await sel.updateComplete;
    expect(sel.open).toBe(true);
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await Promise.resolve();
    await sel.updateComplete;
    await Promise.resolve();
    expect(sel.open).toBe(false);
  });
});
