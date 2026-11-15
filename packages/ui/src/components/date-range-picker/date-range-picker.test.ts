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
import { dateRangePickerSpec } from './date-range-picker.spec.js';
import { MthDateRangePicker, registerMthDateRangePicker } from './index.js';

describe('<mth-date-range-picker>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes FormControlSuite, OverlaySuite, and selects two-click date ranges', async () => {
    const compiled = compileSpec(dateRangePickerSpec);
    expect(compiled.docs).toContain('`<mth-date-range-picker>`');

    let mounted: MthDateRangePicker | null = null;
    const formControlAdapter = {
      mount: () => {
        mounted = document.createElement('mth-date-range-picker') as MthDateRangePicker;
        mounted.label = 'Stay dates';
        mounted.value = '2026-03-01/2026-03-05';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const drp = el as MthDateRangePicker;
        await drp.updateComplete;
        const input = drp.shadowRoot!.querySelector('input')!;
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await drp.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthDateRangePicker).value,
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
      isRequiredInvalid: (el: HTMLElement) => !(el as MthDateRangePicker).checkValidity(),
      defaultValue: '2026-03-01/2026-03-05',
      nextValue: '2026-03-10/2026-03-15',
    };

    const overlayAdapter = {
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open range';
        const overlay = document.createElement('mth-date-range-picker') as MthDateRangePicker;
        overlay.label = 'Window';
        return { overlay, trigger };
      },
      open: async (overlay: HTMLElement) => {
        await (overlay as MthDateRangePicker).show();
      },
      close: async (overlay: HTMLElement) => {
        await (overlay as MthDateRangePicker).hide();
      },
      isOpen: (overlay: HTMLElement) => (overlay as MthDateRangePicker).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    };

    const specReport = await runBehaviorSpecAssertions(dateRangePickerSpec, {
      formControl: formControlAdapter,
      overlay: overlayAdapter,
    });
    expect(specReport.failures).toEqual([]);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);
    const overlayReport = await OverlaySuite.run(overlayAdapter);
    expect(overlayReport.failures).toEqual([]);

    const drp = document.createElement('mth-date-range-picker') as MthDateRangePicker;
    drp.value = '2026-04-01/2026-04-02';
    document.body.appendChild(drp);
    await drp.updateComplete;
    await drp.show();
    await drp.updateComplete;

    (drp.shadowRoot!.querySelector('[data-iso="2026-04-05"]') as HTMLButtonElement).click();
    await drp.updateComplete;
    (drp.shadowRoot!.querySelector('[data-iso="2026-04-12"]') as HTMLButtonElement).click();
    await drp.updateComplete;

    expect(drp.value).toBe('2026-04-05/2026-04-12');
    expect(drp.startDate).toBe('2026-04-05');
    expect(drp.endDate).toBe('2026-04-12');
    expect(drp.open).toBe(false);
    expect(scanSameRootAria(drp).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-date-range-picker value="2026-04-01/2026-04-08" label="Period"></mth-date-range-picker>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-date-range-picker>', 'hyd-date-range-picker>')
      .replaceAll('<mth-date-range-picker', '<hyd-date-range-picker');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDateRangePicker('hyd');
        customElements.upgrade(host);
        await (host as MthDateRangePicker).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('syncs startDate/endDate changes and supports RTL-aware grid keyboard navigation', async () => {
    const drp = document.createElement('mth-date-range-picker') as MthDateRangePicker;
    drp.startDate = '2026-05-03';
    drp.endDate = '2026-05-07';
    document.body.appendChild(drp);
    await drp.updateComplete;
    expect(drp.value).toBe('2026-05-03/2026-05-07');

    drp.setAttribute('dir', 'rtl');
    await drp.show();
    await drp.updateComplete;

    const grid = drp.shadowRoot!.querySelector<HTMLElement>('[part="grid"]')!;
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }));
    await drp.updateComplete;
    expect(drp.shadowRoot!.querySelector('[data-iso="2026-05-04"]')?.getAttribute('tabindex')).toBe('0');

    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await drp.updateComplete;
    expect(drp.startDate).toBe('2026-05-04');

    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await drp.updateComplete;
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await drp.updateComplete;
    expect(drp.value).toBe('2026-05-04/2026-05-11');
  });
});
