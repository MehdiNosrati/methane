import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  OverlaySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { monthPickerSpec } from './month-picker.spec.js';
import { MthMonthPicker, registerMthMonthPicker } from './index.js';

describe('<mth-month-picker>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes FormControlSuite, OverlaySuite, RovingFocusSuite, and selects YYYY-MM months', async () => {
    const compiled = compileSpec(monthPickerSpec);
    expect(compiled.docs).toContain('`<mth-month-picker>`');

    let mounted: MthMonthPicker | null = null;
    const formControlAdapter = {
      mount: () => {
        mounted = document.createElement('mth-month-picker') as MthMonthPicker;
        mounted.label = 'Billing cycle';
        mounted.value = '2026-02';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const mp = el as MthMonthPicker;
        await mp.updateComplete;
        const input = mp.shadowRoot!.querySelector('input')!;
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await mp.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthMonthPicker).value,
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
      isRequiredInvalid: (el: HTMLElement) => !(el as MthMonthPicker).checkValidity(),
      defaultValue: '2026-02',
      nextValue: '2026-11',
    };

    const overlayAdapter = {
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open month';
        const overlay = document.createElement('mth-month-picker') as MthMonthPicker;
        overlay.label = 'Month';
        return { overlay, trigger };
      },
      open: async (overlay: HTMLElement) => {
        await (overlay as MthMonthPicker).show();
      },
      close: async (overlay: HTMLElement) => {
        await (overlay as MthMonthPicker).hide();
      },
      isOpen: (overlay: HTMLElement) => (overlay as MthMonthPicker).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    };

    const rovingFocusAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-month-picker') as MthMonthPicker;
        el.dir = dir;
        document.body.appendChild(el);
        await el.updateComplete;
        await el.show();
        await el.updateComplete;
        return el;
      },
      getItems: (container: HTMLElement) =>
        Array.from(container.shadowRoot!.querySelectorAll<HTMLElement>('[part="month"]')),
      orientation: 'horizontal' as const,
      loop: true,
    };

    const specReport = await runBehaviorSpecAssertions(monthPickerSpec, {
      formControl: formControlAdapter,
      overlay: overlayAdapter,
      rovingFocus: rovingFocusAdapter,
    });
    expect(specReport.failures).toEqual([]);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);
    const overlayReport = await OverlaySuite.run(overlayAdapter);
    expect(overlayReport.failures).toEqual([]);
    const rovingReport = await RovingFocusSuite.run(rovingFocusAdapter);
    expect(rovingReport.failures).toEqual([]);

    const mp = document.createElement('mth-month-picker') as MthMonthPicker;
    mp.value = '2026-01';
    document.body.appendChild(mp);
    await mp.updateComplete;
    await mp.show();
    await mp.updateComplete;

    (mp.shadowRoot!.querySelector('[data-iso="2026-08"]') as HTMLButtonElement).click();
    await mp.updateComplete;
    expect(mp.value).toBe('2026-08');
    expect(mp.open).toBe(false);
    expect(scanSameRootAria(mp).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-month-picker value="2026-06" label="Month"></mth-month-picker>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-month-picker>', 'hyd-month-picker>')
      .replaceAll('<mth-month-picker', '<hyd-month-picker');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMonthPicker('hyd');
        customElements.upgrade(host);
        await (host as MthMonthPicker).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
