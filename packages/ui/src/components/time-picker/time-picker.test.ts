import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { timePickerSpec } from './time-picker.spec.js';
import { MthTimePicker, registerMthTimePicker } from './index.js';

describe('<mth-time-picker>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes FormControlSuite, OverlaySuite, and selects time options', async () => {
    const compiled = compileSpec(timePickerSpec);
    expect(compiled.docs).toContain('`<mth-time-picker>`');

    let mounted: MthTimePicker | null = null;
    const formControlAdapter = {
      mount: () => {
        mounted = document.createElement('mth-time-picker') as MthTimePicker;
        mounted.label = 'Meeting time';
        mounted.value = '09:00';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const tp = el as MthTimePicker;
        await tp.updateComplete;
        const input = tp.shadowRoot!.querySelector('input')!;
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await tp.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthTimePicker).value,
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
      isRequiredInvalid: (el: HTMLElement) => !(el as MthTimePicker).checkValidity(),
      defaultValue: '09:00',
      nextValue: '14:30',
    };

    const overlayAdapter = {
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open time';
        const overlay = document.createElement('mth-time-picker') as MthTimePicker;
        overlay.label = 'Start';
        return { overlay, trigger };
      },
      open: async (overlay: HTMLElement) => {
        await (overlay as MthTimePicker).show();
      },
      close: async (overlay: HTMLElement) => {
        await (overlay as MthTimePicker).hide();
      },
      isOpen: (overlay: HTMLElement) => (overlay as MthTimePicker).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    };

    const specReport = await runBehaviorSpecAssertions(timePickerSpec, {
      formControl: formControlAdapter,
      overlay: overlayAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);
    const overlayReport = await OverlaySuite.run(overlayAdapter);
    expect(overlayReport.failures).toEqual([]);

    const tp = document.createElement('mth-time-picker') as MthTimePicker;
    document.body.appendChild(tp);
    await tp.updateComplete;
    await tp.show();
    await tp.updateComplete;

    (tp.shadowRoot!.querySelector('[data-value="10:30"]') as HTMLButtonElement).click();
    await tp.updateComplete;
    expect(tp.value).toBe('10:30');
    expect(tp.open).toBe(false);
    expect(scanSameRootAria(tp).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-time-picker value="08:00" label="Time"></mth-time-picker>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-time-picker>', 'hyd-time-picker>')
      .replaceAll('<mth-time-picker', '<hyd-time-picker');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTimePicker('hyd');
        customElements.upgrade(host);
        await (host as MthTimePicker).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
