import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, SatelliteEngineSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthLocationPicker, locationPickerSpec, registerMthLocationPicker } from './index.js';

describe('mth-location-picker', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, SatelliteEngineSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(locationPickerSpec);
    expect(compiled.docs).toContain('`<mth-location-picker>`');

    const specReport = await runBehaviorSpecAssertions(locationPickerSpec);
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const engineReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-location-picker') as MthLocationPicker,
      cycles: 50,
      tokenName: '--mth-color-accent',
      tokenValue: 'oklch(0.6 0.2 250)',
      readAppliedToken: (el, tokenName) => (el as MthLocationPicker).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(engineReport.failures).toEqual([]);
    expect(engineReport.passed).toBe(true);

    let mountedPicker: MthLocationPicker | null = null;
    const formReport = await FormControlSuite.run({
      name: 'coords',
      defaultValue: '37.774900,-122.419400',
      nextValue: '40.712800,-74.006000',
      mount: () => {
        const el = document.createElement('mth-location-picker') as MthLocationPicker;
        el.label = 'Pickup point';
        el.defaultValue = '37.774900,-122.419400';
        el.value = '37.774900,-122.419400';
        mountedPicker = el;
        return el;
      },
      setValue: async (el, value) => {
        const picker = el as MthLocationPicker;
        await picker.updateComplete;
        picker.value = value;
        await picker.updateComplete;
      },
      getValue: (el) => (el as MthLocationPicker).value,
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedPicker) return null;
        return mountedPicker.isDisabled ? null : mountedPicker.value;
      },
      getInternalDisabled: (el) => (el as MthLocationPicker).isDisabled,
      isRequiredInvalid: (el) => !(el as MthLocationPicker).checkValidity(),
    });
    expect(formReport.failures).toEqual([]);
    expect(formReport.passed).toBe(true);

    const el = document.createElement('mth-location-picker') as MthLocationPicker;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-location-picker label="Office"><span slot="fallback">Map fallback</span></mth-location-picker>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-location-picker>', 'hyd-location-picker>')
      .replaceAll('<mth-location-picker', '<hyd-location-picker');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthLocationPicker('hyd');
        customElements.upgrade(host);
        await (host as MthLocationPicker).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('nudges coordinates with RTL-aware Arrow keys and clears with Delete', async () => {
    const el = document.createElement('mth-location-picker') as MthLocationPicker;
    el.setAttribute('dir', 'rtl');
    el.value = '37.000000,-122.000000';
    el.step = 0.5;
    document.body.appendChild(el);
    await el.updateComplete;

    const pin = el.shadowRoot!.querySelector('.pin-target') as HTMLButtonElement;
    pin.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('37.000000,-122.500000');

    pin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('');
  });
});
