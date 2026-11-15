import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { cascaderSpec, MthCascader, registerMthCascader, type CascaderChangeDetail, type CascaderOption } from './index.js';

const SAMPLE_TREE: ReadonlyArray<CascaderOption> = [
  {
    value: 'us',
    label: 'United States',
    children: [
      {
        value: 'ca',
        label: 'California',
        children: [
          { value: 'sf', label: 'San Francisco' },
          { value: 'la', label: 'Los Angeles' },
        ],
      },
      {
        value: 'ny',
        label: 'New York',
        children: [{ value: 'nyc', label: 'New York City' }],
      },
    ],
  },
  {
    value: 'jp',
    label: 'Japan',
    children: [{ value: 'tokyo', label: 'Tokyo' }],
  },
];

describe('<mth-cascader>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, OverlaySuite, and same-root ARIA', async () => {
    const compiled = compileSpec(cascaderSpec);
    expect(compiled.tests).toContain('<mth-cascader>');

    let mounted: MthCascader | null = null;
    const specReport = await runBehaviorSpecAssertions(cascaderSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-cascader') as MthCascader;
          mounted.label = 'Location';
          mounted.options = SAMPLE_TREE;
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthCascader).value = val;
          await (el as MthCascader).updateComplete;
        },
        getValue: (el) => (el as MthCascader).value,
        nextValue: 'us/ca/sf',
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
          Boolean((el as MthCascader).shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')?.disabled),
        isRequiredInvalid: (el) => !(el as MthCascader).checkValidity(),
      },
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'External Trigger';
          const el = document.createElement('mth-cascader') as MthCascader;
          el.label = 'Region';
          el.options = SAMPLE_TREE;
          return { overlay: el, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthCascader).show();
        },
        close: async (overlay) => {
          await (overlay as MthCascader).hide();
        },
        isOpen: (overlay) => (overlay as MthCascader).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    let standaloneFormEl: MthCascader | null = null;
    const formReport = await FormControlSuite.run({
      mount: () => {
        standaloneFormEl = document.createElement('mth-cascader') as MthCascader;
        standaloneFormEl.label = 'Destination';
        standaloneFormEl.options = SAMPLE_TREE;
        return standaloneFormEl;
      },
      setValue: async (el, val) => {
        (el as MthCascader).value = val;
        await (el as MthCascader).updateComplete;
      },
      getValue: (el) => (el as MthCascader).value,
      nextValue: 'jp/tokyo',
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !standaloneFormEl) return null;
        return standaloneFormEl.isEffectivelyDisabled ? null : standaloneFormEl.value;
      },
      getInternalDisabled: (el) =>
        Boolean((el as MthCascader).shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')?.disabled),
      isRequiredInvalid: (el) => !(el as MthCascader).checkValidity(),
    });
    expect(formReport.passed).toBe(true);

    const overlayReport = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open Cascader';
        const el = document.createElement('mth-cascader') as MthCascader;
        el.label = 'Territory';
        el.options = SAMPLE_TREE;
        return { overlay: el, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthCascader).show();
      },
      close: async (overlay) => {
        await (overlay as MthCascader).hide();
      },
      isOpen: (overlay) => (overlay as MthCascader).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(overlayReport.passed).toBe(true);

    const ariaEl = document.createElement('mth-cascader') as MthCascader;
    ariaEl.label = 'Region';
    ariaEl.hint = 'Pick country and city';
    ariaEl.options = SAMPLE_TREE;
    ariaEl.value = 'us/ca/sf';
    document.body.append(ariaEl);
    await ariaEl.updateComplete;
    await ariaEl.show();
    await ariaEl.updateComplete;
    expect(scanSameRootAria(ariaEl.shadowRoot!).issues).toEqual([]);
  });

  it('drills through hierarchical columns, supports keyboard navigation, and emits mth-change', async () => {
    const el = document.createElement('mth-cascader') as MthCascader;
    el.label = 'Location';
    el.options = SAMPLE_TREE;
    document.body.append(el);
    await el.updateComplete;

    const changes: CascaderChangeDetail[] = [];
    el.addEventListener('mth-change', (e) => {
      changes.push((e as CustomEvent<CascaderChangeDetail>).detail);
    });

    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!;
    trigger.click();
    await el.updateComplete;
    expect(el.open).toBe(true);

    let columns = el.shadowRoot!.querySelectorAll('[part="column"]');
    expect(columns.length).toBe(1);

    const usOption = columns[0]!.querySelector<HTMLElement>('[data-value="us"]')!;
    usOption.click();
    await el.updateComplete;
    expect(el.open).toBe(true);
    expect(changes.length).toBe(0);

    columns = el.shadowRoot!.querySelectorAll('[part="column"]');
    expect(columns.length).toBe(2);

    const caOption = columns[1]!.querySelector<HTMLElement>('[data-value="ca"]')!;
    caOption.click();
    await el.updateComplete;

    columns = el.shadowRoot!.querySelectorAll('[part="column"]');
    expect(columns.length).toBe(3);

    const sfOption = columns[2]!.querySelector<HTMLElement>('[data-value="sf"]')!;
    sfOption.click();
    await el.updateComplete;

    expect(el.value).toBe('us/ca/sf');
    expect(el.open).toBe(false);
    expect(changes).toHaveLength(1);
    expect(changes[0]!.path).toEqual(['us', 'ca', 'sf']);
    expect(changes[0]!.selectedOptions.map((o) => o.label)).toEqual([
      'United States',
      'California',
      'San Francisco',
    ]);

    const clearBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="clear"]')!;
    clearBtn.click();
    await el.updateComplete;
    expect(el.value).toBe('');
    expect(changes).toHaveLength(2);
    expect(changes[1]!.path).toEqual([]);
  });

  it('supports keyboard drill-down across columns', async () => {
    const el = document.createElement('mth-cascader') as MthCascader;
    el.label = 'Keyboard Cascader';
    el.options = SAMPLE_TREE;
    document.body.append(el);
    await el.updateComplete;

    await el.show();
    await el.updateComplete;

    const popup = el.shadowRoot!.querySelector<HTMLElement>('[part="popup"]')!;
    popup.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('[part="column"]').length).toBe(2);

    popup.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('[part="column"]').length).toBe(3);

    popup.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('us/ca/sf');
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthCascader();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-cascader label="Region" placeholder="Choose region"></mth-cascader>`,
    );
    const ssrHtml = rawSsr.replaceAll('mth-cascader>', 'hyd-cascader>').replaceAll('<mth-cascader', '<hyd-cascader');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCascader('hyd');
        customElements.upgrade(host);
        await (host as MthCascader).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
