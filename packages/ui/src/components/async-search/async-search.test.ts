import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  DataConsumerSuite,
  FormControlSuite,
  HydrationPuritySuite,
  ListboxSuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthAsyncSearch, asyncSearchSpec, registerMthAsyncSearch } from './index.js';

describe('<mth-async-search>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, OverlaySuite, ListboxSuite, DataConsumerSuite, and ARIA', async () => {
    const compiled = compileSpec(asyncSearchSpec);
    expect(compiled.tests).toContain('<mth-async-search>');

    let mounted: MthAsyncSearch | null = null;
    const specReport = await runBehaviorSpecAssertions(asyncSearchSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-async-search') as MthAsyncSearch;
          mounted.label = 'User';
          mounted.options = [
            { value: 'u1', label: 'Alice' },
            { value: 'u2', label: 'Bob' },
          ];
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthAsyncSearch).value = val;
          await (el as MthAsyncSearch).updateComplete;
        },
        getValue: (el) => (el as MthAsyncSearch).value,
        nextValue: 'u2',
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
          Boolean((el as MthAsyncSearch).shadowRoot!.querySelector('input')?.disabled),
        isRequiredInvalid: (el) => !(el as MthAsyncSearch).checkValidity(),
      },
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          const asEl = document.createElement('mth-async-search') as MthAsyncSearch;
          asEl.options = [{ value: 'a', label: 'Alpha' }];
          return { overlay: asEl, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthAsyncSearch).show();
        },
        close: async (overlay) => {
          await (overlay as MthAsyncSearch).hide();
        },
        isOpen: (overlay) => (overlay as MthAsyncSearch).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
      listbox: {
        mount: async () => {
          const asEl = document.createElement('mth-async-search') as MthAsyncSearch;
          asEl.options = [
            { value: 'alpha', label: 'Alpha' },
            { value: 'beta', label: 'Beta' },
          ];
          document.body.appendChild(asEl);
          await asEl.updateComplete;
          await asEl.show();
          await asEl.updateComplete;
          return asEl;
        },
        getListboxRoot: (el) => (el as MthAsyncSearch).shadowRoot!,
        getOptions: (el) =>
          Array.from((el as MthAsyncSearch).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
        getActiveOption: (el) => {
          const asEl = el as MthAsyncSearch;
          const id = asEl.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-activedescendant');
          return id ? asEl.shadowRoot!.getElementById(id) : null;
        },
        getSelectedOptions: (el) =>
          Array.from(
            (el as MthAsyncSearch).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'),
          ),
      },
      dataConsumer: {
        mount: async (source) => {
          const asEl = document.createElement('mth-async-search') as MthAsyncSearch;
          asEl.label = 'Search users';
          asEl.dataSource = source as MthAsyncSearch['dataSource'];
          document.body.appendChild(asEl);
          await asEl.updateComplete;
          return asEl;
        },
        triggerQuery: async (el, queryText) => {
          await (el as MthAsyncSearch).query(queryText ?? '');
          await (el as MthAsyncSearch).updateComplete;
        },
        getState: (el) => (el as MthAsyncSearch).dataStatus,
        getRenderedItemCount: (el) =>
          (el as MthAsyncSearch).shadowRoot!.querySelectorAll('[role="option"]').length,
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standaloneForm = await FormControlSuite.run({
      mount: () => {
        mounted = document.createElement('mth-async-search') as MthAsyncSearch;
        mounted.options = [{ value: 'x', label: 'X' }];
        return mounted;
      },
      setValue: async (el, val) => {
        (el as MthAsyncSearch).value = val;
        await (el as MthAsyncSearch).updateComplete;
      },
      getValue: (el) => (el as MthAsyncSearch).value,
      nextValue: 'x',
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
        Boolean((el as MthAsyncSearch).shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el) => !(el as MthAsyncSearch).checkValidity(),
    });
    expect(standaloneForm.passed).toBe(true);

    const standaloneOverlay = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        const asEl = document.createElement('mth-async-search') as MthAsyncSearch;
        asEl.options = [{ value: 'a', label: 'Alpha' }];
        return { overlay: asEl, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthAsyncSearch).show();
      },
      close: async (overlay) => {
        await (overlay as MthAsyncSearch).hide();
      },
      isOpen: (overlay) => (overlay as MthAsyncSearch).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(standaloneOverlay.passed).toBe(true);

    const standaloneListbox = await ListboxSuite.run({
      mount: async () => {
        const asEl = document.createElement('mth-async-search') as MthAsyncSearch;
        asEl.options = [
          { value: 'alpha', label: 'Alpha' },
          { value: 'beta', label: 'Beta' },
        ];
        document.body.appendChild(asEl);
        await asEl.updateComplete;
        await asEl.show();
        await asEl.updateComplete;
        return asEl;
      },
      getListboxRoot: (el) => (el as MthAsyncSearch).shadowRoot!,
      getOptions: (el) =>
        Array.from((el as MthAsyncSearch).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
      getActiveOption: (el) => {
        const asEl = el as MthAsyncSearch;
        const id = asEl.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-activedescendant');
        return id ? asEl.shadowRoot!.getElementById(id) : null;
      },
      getSelectedOptions: (el) =>
        Array.from(
          (el as MthAsyncSearch).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'),
        ),
    });
    expect(standaloneListbox.passed).toBe(true);

    const standaloneData = await DataConsumerSuite.run({
      mount: async (source) => {
        const asEl = document.createElement('mth-async-search') as MthAsyncSearch;
        asEl.dataSource = source as MthAsyncSearch['dataSource'];
        document.body.appendChild(asEl);
        await asEl.updateComplete;
        return asEl;
      },
      triggerQuery: async (el, queryText) => {
        await (el as MthAsyncSearch).query(queryText ?? '');
        await (el as MthAsyncSearch).updateComplete;
      },
      getState: (el) => (el as MthAsyncSearch).dataStatus,
      getRenderedItemCount: (el) =>
        (el as MthAsyncSearch).shadowRoot!.querySelectorAll('[role="option"]').length,
    });
    expect(standaloneData.passed).toBe(true);

    expect(scanSameRootAria(mounted!.shadowRoot!).issues).toEqual([]);
  });

  it('hydrates cleanly under SSR DSD', async () => {
    registerMthAsyncSearch();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-async-search name="query" label="Lookup"></mth-async-search>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-async-search>', 'hyd-async-search>')
      .replaceAll('<mth-async-search', '<hyd-async-search');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAsyncSearch('hyd');
        customElements.upgrade(host);
        await (host as MthAsyncSearch).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
