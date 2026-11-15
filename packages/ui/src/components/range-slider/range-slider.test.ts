import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { rangeSliderSpec } from './range-slider.spec.js';
import { MthRangeSlider, registerMthRangeSlider } from './index.js';

describe('<mth-range-slider>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(rangeSliderSpec);
    expect(compiled.tests).toContain('<mth-range-slider>');

    let mounted: MthRangeSlider | null = null;
    const specReport = await runBehaviorSpecAssertions(rangeSliderSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-range-slider') as MthRangeSlider;
          mounted.label = 'Price';
          mounted.value = '20,80';
          mounted.defaultValue = '20,80';
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthRangeSlider).value = val;
          await (el as MthRangeSlider).updateComplete;
        },
        getValue: (el) => (el as MthRangeSlider).value,
        defaultValue: '20,80',
        nextValue: '30,70',
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
          Array.from((el as MthRangeSlider).shadowRoot!.querySelectorAll('[role="slider"]')).every(
            (t) => t.getAttribute('aria-disabled') === 'true',
          ),
      },
    });
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run({
      mount: () => {
        mounted = document.createElement('mth-range-slider') as MthRangeSlider;
        mounted.value = '10,90';
        mounted.defaultValue = '10,90';
        return mounted;
      },
      setValue: async (el, val) => {
        (el as MthRangeSlider).value = val;
        await (el as MthRangeSlider).updateComplete;
      },
      getValue: (el) => (el as MthRangeSlider).value,
      defaultValue: '10,90',
      nextValue: '40,60',
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
        Array.from((el as MthRangeSlider).shadowRoot!.querySelectorAll('[role="slider"]')).every(
          (t) => t.getAttribute('aria-disabled') === 'true',
        ),
    });
    expect(standalone.passed).toBe(true);

    const ariaScan = scanSameRootAria(mounted!.shadowRoot!);
    expect(ariaScan.issues).toEqual([]);
  });

  it('enforces minDistance, independent thumb keyboard stepping, and RTL direction', async () => {
    const rs = document.createElement('mth-range-slider') as MthRangeSlider;
    rs.min = 0;
    rs.max = 100;
    rs.step = 5;
    rs.minDistance = 10;
    rs.start = 40;
    rs.end = 60;
    rs.showValue = true;
    document.body.appendChild(rs);
    await rs.updateComplete;

    const thumbs = rs.shadowRoot!.querySelectorAll<HTMLElement>('[role="slider"]');
    const startThumb = thumbs[0]!;
    const endThumb = thumbs[1]!;

    startThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await rs.updateComplete;
    expect(rs.start).toBe(50);

    endThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await rs.updateComplete;
    expect(rs.end).toBe(65);
    expect(rs.value).toBe('50,65');

    rs.setAttribute('dir', 'rtl');
    endThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await rs.updateComplete;
    expect(rs.end).toBe(70);
  });

  it('hydrates cleanly under SSR DSD', async () => {
    registerMthRangeSlider();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-range-slider name="price" label="Price" value="25,75"></mth-range-slider>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-range-slider>', 'hyd-range-slider>')
      .replaceAll('<mth-range-slider', '<hyd-range-slider');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthRangeSlider('hyd');
        customElements.upgrade(host);
        await (host as MthRangeSlider).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
