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
import { datetimePickerSpec } from './datetime-picker.spec.js';
import { MthDatetimePicker, registerMthDatetimePicker } from './index.js';

describe('<mth-datetime-picker>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes FormControlSuite, OverlaySuite, and combines date + time into ISO value', async () => {
    const compiled = compileSpec(datetimePickerSpec);
    expect(compiled.docs).toContain('`<mth-datetime-picker>`');

    let mounted: MthDatetimePicker | null = null;
    const formControlAdapter = {
      mount: () => {
        mounted = document.createElement('mth-datetime-picker') as MthDatetimePicker;
        mounted.label = 'Event start';
        mounted.value = '2026-01-15T09:00';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const dtp = el as MthDatetimePicker;
        await dtp.updateComplete;
        const input = dtp.shadowRoot!.querySelector('input')!;
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await dtp.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthDatetimePicker).value,
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
      isRequiredInvalid: (el: HTMLElement) => !(el as MthDatetimePicker).checkValidity(),
      defaultValue: '2026-01-15T09:00',
      nextValue: '2026-01-20T16:45',
    };

    const overlayAdapter = {
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open datetime';
        const overlay = document.createElement('mth-datetime-picker') as MthDatetimePicker;
        overlay.label = 'Publish at';
        return { overlay, trigger };
      },
      open: async (overlay: HTMLElement) => {
        await (overlay as MthDatetimePicker).show();
      },
      close: async (overlay: HTMLElement) => {
        await (overlay as MthDatetimePicker).hide();
      },
      isOpen: (overlay: HTMLElement) => (overlay as MthDatetimePicker).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    };

    const specReport = await runBehaviorSpecAssertions(datetimePickerSpec, {
      formControl: formControlAdapter,
      overlay: overlayAdapter,
    });
    expect(specReport.failures).toEqual([]);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);
    const overlayReport = await OverlaySuite.run(overlayAdapter);
    expect(overlayReport.failures).toEqual([]);

    const dtp = document.createElement('mth-datetime-picker') as MthDatetimePicker;
    dtp.value = '2026-01-10T09:00';
    document.body.appendChild(dtp);
    await dtp.updateComplete;
    await dtp.show();
    await dtp.updateComplete;

    (dtp.shadowRoot!.querySelector('[data-iso="2026-01-18"]') as HTMLButtonElement).click();
    await dtp.updateComplete;
    expect(dtp.value).toBe('2026-01-18T09:00');
    expect(scanSameRootAria(dtp).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-datetime-picker value="2026-01-01T10:00" label="Start"></mth-datetime-picker>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-datetime-picker>', 'hyd-datetime-picker>')
      .replaceAll('<mth-datetime-picker', '<hyd-datetime-picker');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDatetimePicker('hyd');
        customElements.upgrade(host);
        await (host as MthDatetimePicker).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('supports RTL-aware grid keyboard navigation and selects focused day with Enter', async () => {
    const dtp = document.createElement('mth-datetime-picker') as MthDatetimePicker;
    dtp.value = '2026-01-10T09:00';
    dtp.setAttribute('dir', 'rtl');
    document.body.appendChild(dtp);
    await dtp.updateComplete;
    await dtp.show();
    await dtp.updateComplete;

    const grid = dtp.shadowRoot!.querySelector<HTMLElement>('[part="grid"]')!;
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }));
    await dtp.updateComplete;
    expect(dtp.shadowRoot!.querySelector('[data-iso="2026-01-11"]')?.getAttribute('tabindex')).toBe('0');

    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await dtp.updateComplete;
    expect(dtp.shadowRoot!.querySelector('[data-iso="2026-01-18"]')?.getAttribute('tabindex')).toBe('0');

    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await dtp.updateComplete;
    expect(dtp.value).toBe('2026-01-18T09:00');
  });
});
