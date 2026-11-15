import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { colorPickerSpec } from './color-picker.spec.js';
import { MthColorPicker, registerMthColorPicker } from './index.js';

describe('<mth-color-picker>', () => {
  afterEach(() => {
    delete (globalThis as { EyeDropper?: unknown }).EyeDropper;
    document.body.replaceChildren();
  });

  it('passes FormControlSuite, OverlaySuite, fallback HSL/swatches, and EyeDropper feature detection', async () => {
    const compiled = compileSpec(colorPickerSpec);
    expect(compiled.docs).toContain('`<mth-color-picker>`');

    let mounted: MthColorPicker | null = null;
    const formControlAdapter = {
      mount: () => {
        mounted = document.createElement('mth-color-picker') as MthColorPicker;
        mounted.label = 'Brand color';
        mounted.value = '#2563eb';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const picker = el as MthColorPicker;
        await picker.updateComplete;
        const input = picker.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await picker.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthColorPicker).value,
      getFormDataValue: (formData: FormData, name: string) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.effectivelyDisabled ? null : mounted.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean(el.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthColorPicker).checkValidity(),
      defaultValue: '#2563eb',
      nextValue: '#dc2626',
    };

    const overlayAdapter = {
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open color picker';
        const overlay = document.createElement('mth-color-picker') as MthColorPicker;
        overlay.label = 'Accent';
        return { overlay, trigger };
      },
      open: async (overlay: HTMLElement) => {
        await (overlay as MthColorPicker).show();
      },
      close: async (overlay: HTMLElement) => {
        await (overlay as MthColorPicker).hide();
      },
      isOpen: (overlay: HTMLElement) => (overlay as MthColorPicker).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    };

    const specReport = await runBehaviorSpecAssertions(colorPickerSpec, {
      formControl: formControlAdapter,
      overlay: overlayAdapter,
    });
    expect(specReport.failures).toEqual([]);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);

    const overlayReport = await OverlaySuite.run(overlayAdapter);
    expect(overlayReport.failures).toEqual([]);

    // Without EyeDropper: fallback sliders & swatches still work.
    const picker = document.createElement('mth-color-picker') as MthColorPicker;
    picker.label = 'Theme';
    document.body.appendChild(picker);
    await picker.updateComplete;
    expect(picker.eyeDropperSupported).toBe(false);
    expect(picker.shadowRoot!.querySelector('[part="eyedropper"]')).toBeNull();

    await picker.show();
    await picker.updateComplete;

    let changed = '';
    picker.addEventListener('mth-change', (e) => {
      changed = (e as CustomEvent<{ value: string }>).detail.value;
    });

    const swatches = Array.from(
      picker.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="swatch"]'),
    );
    swatches[1]!.click();
    await picker.updateComplete;
    expect(picker.value).toBe('#dc2626');
    expect(changed).toBe('#dc2626');

    // With EyeDropper present: button renders and samples color.
    (globalThis as { EyeDropper?: unknown }).EyeDropper = class {
      async open() {
        return { sRGBHex: '#16A34A' };
      }
    };
    picker.requestUpdate();
    await picker.updateComplete;
    const dropperBtn = picker.shadowRoot!.querySelector<HTMLButtonElement>('[part="eyedropper"]');
    expect(dropperBtn).not.toBeNull();
    dropperBtn!.click();
    await new Promise((r) => setTimeout(r, 0));
    await picker.updateComplete;
    expect(picker.value).toBe('#16a34a');

    expect(scanSameRootAria(picker).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-color-picker label="Color" value="#2563eb"></mth-color-picker>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-color-picker>', 'hyd-color-picker>')
      .replaceAll('<mth-color-picker', '<hyd-color-picker');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthColorPicker('hyd');
        customElements.upgrade(host);
        await (host as MthColorPicker).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
