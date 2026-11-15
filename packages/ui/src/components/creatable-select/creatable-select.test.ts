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
import {
  MthCreatableSelect,
  creatableSelectSpec,
  registerMthCreatableSelect,
} from './index.js';

describe('<mth-creatable-select>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, OverlaySuite, ListboxSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(creatableSelectSpec);
    expect(compiled.tests).toContain('<mth-creatable-select>');

    let mounted: MthCreatableSelect | null = null;
    const specReport = await runBehaviorSpecAssertions(creatableSelectSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-creatable-select') as MthCreatableSelect;
          mounted.label = 'Framework';
          mounted.options = [
            { value: 'lit', label: 'Lit' },
            { value: 'solid', label: 'Solid' },
          ];
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthCreatableSelect).value = val;
          await (el as MthCreatableSelect).updateComplete;
        },
        getValue: (el) => (el as MthCreatableSelect).value,
        nextValue: 'solid',
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
          Boolean((el as MthCreatableSelect).shadowRoot!.querySelector('input')?.disabled),
        isRequiredInvalid: (el) => !(el as MthCreatableSelect).checkValidity(),
      },
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Open';
          const cs = document.createElement('mth-creatable-select') as MthCreatableSelect;
          cs.options = [
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ];
          return { overlay: cs, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthCreatableSelect).show();
        },
        close: async (overlay) => {
          await (overlay as MthCreatableSelect).hide();
        },
        isOpen: (overlay) => (overlay as MthCreatableSelect).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
      listbox: {
        mount: async () => {
          const cs = document.createElement('mth-creatable-select') as MthCreatableSelect;
          cs.options = [
            { value: 'alpha', label: 'Alpha' },
            { value: 'beta', label: 'Beta' },
          ];
          document.body.appendChild(cs);
          await cs.updateComplete;
          await cs.show();
          await cs.updateComplete;
          return cs;
        },
        getListboxRoot: (el) => (el as MthCreatableSelect).shadowRoot!,
        getOptions: (el) =>
          Array.from((el as MthCreatableSelect).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
        getActiveOption: (el) => {
          const cs = el as MthCreatableSelect;
          const id = cs.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-activedescendant');
          return id ? cs.shadowRoot!.getElementById(id) : null;
        },
        getSelectedOptions: (el) =>
          Array.from(
            (el as MthCreatableSelect).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'),
          ),
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standaloneForm = await FormControlSuite.run({
      mount: () => {
        mounted = document.createElement('mth-creatable-select') as MthCreatableSelect;
        mounted.options = [{ value: 'one', label: 'One' }];
        return mounted;
      },
      setValue: async (el, val) => {
        (el as MthCreatableSelect).value = val;
        await (el as MthCreatableSelect).updateComplete;
      },
      getValue: (el) => (el as MthCreatableSelect).value,
      nextValue: 'one',
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
        Boolean((el as MthCreatableSelect).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el) => !(el as MthCreatableSelect).checkValidity(),
    });
    expect(standaloneForm.passed).toBe(true);

    const standaloneOverlay = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        const cs = document.createElement('mth-creatable-select') as MthCreatableSelect;
        cs.options = [{ value: 'a', label: 'Alpha' }];
        return { overlay: cs, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthCreatableSelect).show();
      },
      close: async (overlay) => {
        await (overlay as MthCreatableSelect).hide();
      },
      isOpen: (overlay) => (overlay as MthCreatableSelect).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(standaloneOverlay.passed).toBe(true);

    const standaloneListbox = await ListboxSuite.run({
      mount: async () => {
        const cs = document.createElement('mth-creatable-select') as MthCreatableSelect;
        cs.options = [
          { value: 'alpha', label: 'Alpha' },
          { value: 'beta', label: 'Beta' },
        ];
        document.body.appendChild(cs);
        await cs.updateComplete;
        await cs.show();
        await cs.updateComplete;
        return cs;
      },
      getListboxRoot: (el) => (el as MthCreatableSelect).shadowRoot!,
      getOptions: (el) =>
        Array.from((el as MthCreatableSelect).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
      getActiveOption: (el) => {
        const cs = el as MthCreatableSelect;
        const id = cs.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-activedescendant');
        return id ? cs.shadowRoot!.getElementById(id) : null;
      },
      getSelectedOptions: (el) =>
        Array.from(
          (el as MthCreatableSelect).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'),
        ),
    });
    expect(standaloneListbox.passed).toBe(true);

    expect(scanSameRootAria(mounted!.shadowRoot!).issues).toEqual([]);
  });

  it('creates new options dynamically and fires mth-create', async () => {
    const cs = document.createElement('mth-creatable-select') as MthCreatableSelect;
    cs.options = [{ value: 'react', label: 'React' }];
    document.body.appendChild(cs);
    await cs.updateComplete;

    let createdDetail: { value: string; label: string } | null = null;
    cs.addEventListener('mth-create', (e) => {
      createdDetail = (e as CustomEvent<{ value: string; label: string }>).detail;
    });

    const input = cs.shadowRoot!.querySelector<HTMLInputElement>('#mth-cs-input')!;
    input.value = 'Svelte';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await cs.updateComplete;

    const createOpt = cs.shadowRoot!.querySelector<HTMLElement>('[part="create-option"]')!;
    expect(createOpt.textContent).toContain('Svelte');
    createOpt.click();
    await cs.updateComplete;

    expect(createdDetail).toEqual({ value: 'Svelte', label: 'Svelte' });
    expect(cs.value).toBe('Svelte');
    expect(cs.options.some((o) => o.value === 'Svelte')).toBe(true);
  });

  it('hydrates cleanly under SSR DSD', async () => {
    registerMthCreatableSelect();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-creatable-select name="fw" label="Framework" value="lit"></mth-creatable-select>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-creatable-select>', 'hyd-creatable-select>')
      .replaceAll('<mth-creatable-select', '<hyd-creatable-select');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCreatableSelect('hyd');
        customElements.upgrade(host);
        await (host as MthCreatableSelect).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
