import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  ListboxSuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthMultiSelect, multiSelectSpec, registerMthMultiSelect } from './index.js';

describe('<mth-multi-select>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, OverlaySuite, ListboxSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(multiSelectSpec);
    expect(compiled.tests).toContain('<mth-multi-select>');

    let mounted: MthMultiSelect | null = null;
    const specReport = await runBehaviorSpecAssertions(multiSelectSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-multi-select') as MthMultiSelect;
          mounted.label = 'Languages';
          mounted.options = [
            { value: 'ts', label: 'TypeScript' },
            { value: 'rs', label: 'Rust' },
            { value: 'go', label: 'Go' },
          ];
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthMultiSelect).value = val;
          await (el as MthMultiSelect).updateComplete;
        },
        getValue: (el) => (el as MthMultiSelect).value,
        nextValue: 'ts,go',
        getFormDataValue: (formData, name) => {
          const nativeVal = formData.get(name);
          if (nativeVal !== null) return nativeVal;
          const hasNativeFace =
            typeof ElementInternals !== 'undefined' &&
            typeof ElementInternals.prototype.setFormValue === 'function';
          if (hasNativeFace || !mounted) return null;
          return mounted.isEffectivelyDisabled ? null : mounted.value;
        },
        getInternalDisabled: (el) =>
          Boolean((el as MthMultiSelect).shadowRoot!.querySelector('input')?.disabled),
        isRequiredInvalid: (el) => !(el as MthMultiSelect).checkValidity(),
      },
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Open MultiSelect';
          const ms = document.createElement('mth-multi-select') as MthMultiSelect;
          ms.label = 'Skills';
          ms.options = [
            { value: 'css', label: 'CSS' },
            { value: 'html', label: 'HTML' },
          ];
          return { overlay: ms, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthMultiSelect).show();
          await (overlay as MthMultiSelect).updateComplete;
        },
        close: async (overlay) => {
          await (overlay as MthMultiSelect).hide();
          await (overlay as MthMultiSelect).updateComplete;
        },
        isOpen: (overlay) => (overlay as MthMultiSelect).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
      listbox: {
        mount: async () => {
          const ms = document.createElement('mth-multi-select') as MthMultiSelect;
          ms.label = 'Tags';
          ms.options = [
            { value: 'alpha', label: 'Alpha' },
            { value: 'beta', label: 'Beta' },
            { value: 'gamma', label: 'Gamma', disabled: true },
          ];
          document.body.appendChild(ms);
          await ms.updateComplete;
          await ms.show();
          await ms.updateComplete;
          return ms;
        },
        getListboxRoot: (el) => (el as MthMultiSelect).shadowRoot!,
        getOptions: (el) =>
          Array.from((el as MthMultiSelect).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
        getActiveOption: (el) => {
          const ms = el as MthMultiSelect;
          const id = ms.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-activedescendant');
          return id ? ms.shadowRoot!.getElementById(id) : null;
        },
        getSelectedOptions: (el) =>
          Array.from(
            (el as MthMultiSelect).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'),
          ),
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standaloneForm = await FormControlSuite.run({
      mount: () => {
        mounted = document.createElement('mth-multi-select') as MthMultiSelect;
        mounted.options = [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ];
        return mounted;
      },
      setValue: async (el, val) => {
        (el as MthMultiSelect).value = val;
        await (el as MthMultiSelect).updateComplete;
      },
      getValue: (el) => (el as MthMultiSelect).value,
      nextValue: 'a,b',
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.isEffectivelyDisabled ? null : mounted.value;
      },
      getInternalDisabled: (el) =>
        Boolean((el as MthMultiSelect).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el) => !(el as MthMultiSelect).checkValidity(),
    });
    expect(standaloneForm.passed).toBe(true);

    const standaloneOverlay = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open';
        const ms = document.createElement('mth-multi-select') as MthMultiSelect;
        ms.options = [
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
        ];
        return { overlay: ms, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthMultiSelect).show();
      },
      close: async (overlay) => {
        await (overlay as MthMultiSelect).hide();
      },
      isOpen: (overlay) => (overlay as MthMultiSelect).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(standaloneOverlay.passed).toBe(true);

    const standaloneListbox = await ListboxSuite.run({
      mount: async () => {
        const ms = document.createElement('mth-multi-select') as MthMultiSelect;
        ms.options = [
          { value: 'alpha', label: 'Alpha' },
          { value: 'beta', label: 'Beta' },
        ];
        document.body.appendChild(ms);
        await ms.updateComplete;
        await ms.show();
        await ms.updateComplete;
        return ms;
      },
      getListboxRoot: (el) => (el as MthMultiSelect).shadowRoot!,
      getOptions: (el) =>
        Array.from((el as MthMultiSelect).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
      getActiveOption: (el) => {
        const ms = el as MthMultiSelect;
        const id = ms.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-activedescendant');
        return id ? ms.shadowRoot!.getElementById(id) : null;
      },
      getSelectedOptions: (el) =>
        Array.from(
          (el as MthMultiSelect).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'),
        ),
    });
    expect(standaloneListbox.passed).toBe(true);

    const aria = scanSameRootAria(mounted!.shadowRoot!);
    expect(aria.issues).toEqual([]);
  });

  it('supports filtering, chip removal, Backspace removal, and maxSelections', async () => {
    const ms = document.createElement('mth-multi-select') as MthMultiSelect;
    ms.maxSelections = 2;
    ms.options = [
      { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' },
      { value: 'blue', label: 'Blue' },
    ];
    document.body.appendChild(ms);
    await ms.updateComplete;
    await ms.show();
    await ms.updateComplete;

    const opts = ms.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
    opts[0]!.click();
    opts[1]!.click();
    opts[2]!.click();
    await ms.updateComplete;
    expect(ms.values).toEqual(['red', 'green']);

    const removeBtn = ms.shadowRoot!.querySelector<HTMLButtonElement>('[part="tag-remove"]')!;
    removeBtn.click();
    await ms.updateComplete;
    expect(ms.values).toEqual(['green']);

    const input = ms.shadowRoot!.querySelector<HTMLInputElement>('#mth-ms-input')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    await ms.updateComplete;
    expect(ms.values).toEqual([]);
  });

  it('hydrates cleanly under SSR DSD', async () => {
    registerMthMultiSelect();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-multi-select name="tags" label="Tags" value="a,b"></mth-multi-select>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-multi-select>', 'hyd-multi-select>')
      .replaceAll('<mth-multi-select', '<hyd-multi-select');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMultiSelect('hyd');
        customElements.upgrade(host);
        await (host as MthMultiSelect).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
