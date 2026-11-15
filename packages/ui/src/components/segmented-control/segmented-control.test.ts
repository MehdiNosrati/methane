import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import {
  MthSegmentedControl,
  registerMthSegmentedControl,
  segmentedControlSpec,
} from './index.js';

describe('<mth-segmented-control>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, RovingFocusSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(segmentedControlSpec);
    expect(compiled.tests).toContain('<mth-segmented-control>');

    let mounted: MthSegmentedControl | null = null;
    const specReport = await runBehaviorSpecAssertions(segmentedControlSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-segmented-control') as MthSegmentedControl;
          mounted.label = 'View';
          mounted.options = [
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ];
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthSegmentedControl).value = val;
          await (el as MthSegmentedControl).updateComplete;
        },
        getValue: (el) => (el as MthSegmentedControl).value,
        nextValue: 'week',
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
          Array.from(
            (el as MthSegmentedControl).shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="segment"]'),
          ).every((b) => b.disabled),
        isRequiredInvalid: (el) => !(el as MthSegmentedControl).checkValidity(),
      },
      rovingFocus: {
        mount: async (dir) => {
          const sc = document.createElement('mth-segmented-control') as MthSegmentedControl;
          if (dir) sc.setAttribute('dir', dir);
          sc.options = [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
            { value: 'c', label: 'C' },
          ];
          document.body.appendChild(sc);
          await sc.updateComplete;
          return sc;
        },
        getItems: (el) =>
          Array.from((el as MthSegmentedControl).shadowRoot!.querySelectorAll<HTMLElement>('[part="segment"]')),
        orientation: 'horizontal',
        loop: true,
      },
    });
    expect(specReport.passed).toBe(true);

    const standaloneFc = await FormControlSuite.run({
      mount: () => {
        mounted = document.createElement('mth-segmented-control') as MthSegmentedControl;
        mounted.options = [
          { value: 'list', label: 'List' },
          { value: 'grid', label: 'Grid' },
        ];
        return mounted;
      },
      setValue: async (el, val) => {
        (el as MthSegmentedControl).value = val;
        await (el as MthSegmentedControl).updateComplete;
      },
      getValue: (el) => (el as MthSegmentedControl).value,
      nextValue: 'grid',
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
        Array.from(
          (el as MthSegmentedControl).shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="segment"]'),
        ).every((b) => b.disabled),
      isRequiredInvalid: (el) => !(el as MthSegmentedControl).checkValidity(),
    });
    expect(standaloneFc.passed).toBe(true);

    const standaloneRoving = await RovingFocusSuite.run({
      mount: async (dir) => {
        const sc = document.createElement('mth-segmented-control') as MthSegmentedControl;
        if (dir) sc.setAttribute('dir', dir);
        sc.options = [
          { value: '1', label: 'One' },
          { value: '2', label: 'Two' },
          { value: '3', label: 'Three' },
        ];
        document.body.appendChild(sc);
        await sc.updateComplete;
        return sc;
      },
      getItems: (el) =>
        Array.from((el as MthSegmentedControl).shadowRoot!.querySelectorAll<HTMLElement>('[part="segment"]')),
      orientation: 'horizontal',
      loop: true,
    });
    expect(standaloneRoving.passed).toBe(true);

    const ariaScan = scanSameRootAria(mounted!.shadowRoot!);
    expect(ariaScan.issues).toEqual([]);
  });

  it('supports slotted items, indicator updates, and mth-change events', async () => {
    const sc = document.createElement('mth-segmented-control') as MthSegmentedControl;
    const b1 = document.createElement('button');
    b1.dataset.value = 'monthly';
    b1.textContent = 'Monthly';
    const b2 = document.createElement('button');
    b2.dataset.value = 'yearly';
    b2.textContent = 'Yearly';
    sc.append(b1, b2);
    document.body.appendChild(sc);
    await sc.updateComplete;

    let changedValue = '';
    sc.addEventListener('mth-change', (e) => {
      changedValue = (e as CustomEvent<{ value: string }>).detail.value;
    });

    const segments = sc.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="segment"]');
    expect(segments.length).toBe(2);
    segments[1]!.click();
    await sc.updateComplete;
    expect(sc.value).toBe('yearly');
    expect(changedValue).toBe('yearly');
    expect(sc.dataset.hasSelection).toBe('true');
  });

  it('hydrates cleanly under SSR DSD', async () => {
    registerMthSegmentedControl();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-segmented-control name="plan" label="Plan"></mth-segmented-control>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-segmented-control>', 'hyd-segmented-control>')
      .replaceAll('<mth-segmented-control', '<hyd-segmented-control');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSegmentedControl('hyd');
        customElements.upgrade(host);
        await (host as MthSegmentedControl).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
