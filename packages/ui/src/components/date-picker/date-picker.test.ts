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
import { datePickerSpec } from './date-picker.spec.js';
import { MthDatePicker, registerMthDatePicker } from './index.js';

describe('<mth-date-picker>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes FormControlSuite, OverlaySuite, and selects calendar dates', async () => {
    const compiled = compileSpec(datePickerSpec);
    expect(compiled.docs).toContain('`<mth-date-picker>`');

    let mounted: MthDatePicker | null = null;
    const formControlAdapter = {
      mount: () => {
        mounted = document.createElement('mth-date-picker') as MthDatePicker;
        mounted.label = 'Start date';
        mounted.value = '2026-06-01';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const dp = el as MthDatePicker;
        await dp.updateComplete;
        const input = dp.shadowRoot!.querySelector('input')!;
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await dp.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthDatePicker).value,
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
        Boolean(el.shadowRoot!.querySelector('input')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthDatePicker).checkValidity(),
      defaultValue: '2026-06-01',
      nextValue: '2026-06-15',
    };

    const overlayAdapter = {
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open date';
        const overlay = document.createElement('mth-date-picker') as MthDatePicker;
        overlay.label = 'Deadline';
        return { overlay, trigger };
      },
      open: async (overlay: HTMLElement) => {
        await (overlay as MthDatePicker).show();
      },
      close: async (overlay: HTMLElement) => {
        await (overlay as MthDatePicker).hide();
      },
      isOpen: (overlay: HTMLElement) => (overlay as MthDatePicker).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    };

    const specReport = await runBehaviorSpecAssertions(datePickerSpec, {
      formControl: formControlAdapter,
      overlay: overlayAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);
    const overlayReport = await OverlaySuite.run(overlayAdapter);
    expect(overlayReport.failures).toEqual([]);

    const dp = document.createElement('mth-date-picker') as MthDatePicker;
    dp.value = '2026-05-10';
    document.body.appendChild(dp);
    await dp.updateComplete;
    await dp.show();
    await dp.updateComplete;

    const dayBtn = dp.shadowRoot!.querySelector('[data-iso="2026-05-20"]') as HTMLButtonElement;
    dayBtn.click();
    await dp.updateComplete;
    expect(dp.value).toBe('2026-05-20');
    expect(dp.open).toBe(false);
    expect(scanSameRootAria(dp).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-date-picker value="2026-05-01" label="Date"></mth-date-picker>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-date-picker>', 'hyd-date-picker>')
      .replaceAll('<mth-date-picker', '<hyd-date-picker');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDatePicker('hyd');
        customElements.upgrade(host);
        await (host as MthDatePicker).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
