import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthSlider, registerMthSlider, sliderSpec } from './index.js';

describe('<mth-slider>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(sliderSpec);
    expect(compiled.tests).toContain('<mth-slider>');

    let mounted: MthSlider | null = null;
    const specReport = await runBehaviorSpecAssertions(sliderSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-slider') as MthSlider;
          mounted.label = 'Volume';
          mounted.min = 0;
          mounted.max = 100;
          mounted.value = 25;
          mounted.defaultValue = 25;
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthSlider).value = Number(val);
          await (el as MthSlider).updateComplete;
        },
        getValue: (el) => String((el as MthSlider).value),
        defaultValue: '25',
        nextValue: '60',
        getFormDataValue: (formData, name) => {
          const nativeVal = formData.get(name);
          if (nativeVal !== null) return nativeVal;
          const hasNativeFace =
            typeof ElementInternals !== 'undefined' &&
            typeof ElementInternals.prototype.setFormValue === 'function';
          if (hasNativeFace || !mounted) return null;
          return mounted.isEffectivelyDisabled ? null : String(mounted.value);
        },
        getInternalDisabled: (el) =>
          (el as MthSlider).shadowRoot!.querySelector('[role="slider"]')?.getAttribute('aria-disabled') === 'true',
      },
    });
    expect(specReport.passed).toBe(true);

    const standalone = await FormControlSuite.run({
      mount: () => {
        mounted = document.createElement('mth-slider') as MthSlider;
        mounted.min = 0;
        mounted.max = 100;
        mounted.value = 10;
        mounted.defaultValue = 10;
        return mounted;
      },
      setValue: async (el, val) => {
        (el as MthSlider).value = Number(val);
        await (el as MthSlider).updateComplete;
      },
      getValue: (el) => String((el as MthSlider).value),
      defaultValue: '10',
      nextValue: '80',
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.isEffectivelyDisabled ? null : String(mounted.value);
      },
      getInternalDisabled: (el) =>
        (el as MthSlider).shadowRoot!.querySelector('[role="slider"]')?.getAttribute('aria-disabled') === 'true',
    });
    expect(standalone.passed).toBe(true);

    const ariaScan = scanSameRootAria(mounted!.shadowRoot!);
    expect(ariaScan.issues).toEqual([]);
  });

  it('supports keyboard stepping, Home/End, RTL direction reversal, and events', async () => {
    const slider = document.createElement('mth-slider') as MthSlider;
    slider.min = 0;
    slider.max = 100;
    slider.step = 5;
    slider.value = 50;
    slider.showValue = true;
    slider.formatValue = (v) => `${v}%`;
    document.body.appendChild(slider);
    await slider.updateComplete;

    const events: Array<{ type: string; value: number }> = [];
    slider.addEventListener('mth-input', (e) => events.push({ type: 'input', value: (e as CustomEvent<{ value: number }>).detail.value }));
    slider.addEventListener('mth-change', (e) => events.push({ type: 'change', value: (e as CustomEvent<{ value: number }>).detail.value }));

    const thumb = slider.shadowRoot!.querySelector<HTMLElement>('[role="slider"]')!;
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await slider.updateComplete;
    expect(slider.value).toBe(55);
    expect(thumb.getAttribute('aria-valuetext')).toBe('55%');

    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    await slider.updateComplete;
    expect(slider.value).toBe(5);

    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await slider.updateComplete;
    expect(slider.value).toBe(100);

    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await slider.updateComplete;
    expect(slider.value).toBe(0);

    slider.setAttribute('dir', 'rtl');
    slider.value = 50;
    await slider.updateComplete;
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await slider.updateComplete;
    expect(slider.value).toBe(55);
    expect(events.length).toBeGreaterThan(0);
  });

  it('hydrates cleanly under SSR DSD', async () => {
    registerMthSlider();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-slider name="brightness" label="Brightness" value="40"></mth-slider>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-slider>', 'hyd-slider>')
      .replaceAll('<mth-slider', '<hyd-slider');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSlider('hyd');
        customElements.upgrade(host);
        await (host as MthSlider).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
