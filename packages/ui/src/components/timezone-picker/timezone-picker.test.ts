import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  ListboxSuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { timezonePickerSpec } from './timezone-picker.spec.js';
import { MthTimezonePicker, registerMthTimezonePicker } from './index.js';

describe('<mth-timezone-picker>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes FormControlSuite, OverlaySuite, ListboxSuite, and filters/selects IANA zones', async () => {
    const compiled = compileSpec(timezonePickerSpec);
    expect(compiled.docs).toContain('`<mth-timezone-picker>`');

    let mounted: MthTimezonePicker | null = null;
    const formControlAdapter = {
      mount: () => {
        mounted = document.createElement('mth-timezone-picker') as MthTimezonePicker;
        mounted.label = 'Timezone';
        mounted.value = 'UTC';
        return mounted;
      },
      setValue: async (el: HTMLElement, value: string) => {
        const tz = el as MthTimezonePicker;
        await tz.updateComplete;
        const input = tz.shadowRoot!.querySelector('input')!;
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await tz.updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthTimezonePicker).value,
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
      isRequiredInvalid: (el: HTMLElement) => !(el as MthTimezonePicker).checkValidity(),
      defaultValue: 'UTC',
      nextValue: 'America/New_York',
    };

    const overlayAdapter = {
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open tz';
        const overlay = document.createElement('mth-timezone-picker') as MthTimezonePicker;
        overlay.label = 'Zone';
        return { overlay, trigger };
      },
      open: async (overlay: HTMLElement) => {
        await (overlay as MthTimezonePicker).show();
      },
      close: async (overlay: HTMLElement) => {
        await (overlay as MthTimezonePicker).hide();
      },
      isOpen: (overlay: HTMLElement) => (overlay as MthTimezonePicker).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    };

    const listboxAdapter = {
      mount: async () => {
        const tz = document.createElement('mth-timezone-picker') as MthTimezonePicker;
        tz.zones = ['UTC', 'America/New_York', 'Europe/London'];
        document.body.appendChild(tz);
        await tz.updateComplete;
        await tz.show();
        await tz.updateComplete;
        return tz;
      },
      getListboxRoot: (el: HTMLElement) => el.shadowRoot!.querySelector('[role="listbox"]')!,
      getOptions: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
      getActiveOption: (el: HTMLElement) => {
        const id = el.shadowRoot!
          .querySelector('[role="listbox"]')!
          .getAttribute('aria-activedescendant');
        return id ? el.shadowRoot!.getElementById(id) : null;
      },
      getSelectedOptions: (el: HTMLElement) =>
        Array.from(
          el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'),
        ),
      multiple: false,
    };

    const specReport = await runBehaviorSpecAssertions(timezonePickerSpec, {
      formControl: formControlAdapter,
      overlay: overlayAdapter,
      listbox: listboxAdapter,
    });
    expect(specReport.failures).toEqual([]);

    const formReport = await FormControlSuite.run(formControlAdapter);
    expect(formReport.failures).toEqual([]);
    const overlayReport = await OverlaySuite.run(overlayAdapter);
    expect(overlayReport.failures).toEqual([]);
    const listboxReport = await ListboxSuite.run(listboxAdapter);
    expect(listboxReport.failures).toEqual([]);

    const tz = document.createElement('mth-timezone-picker') as MthTimezonePicker;
    tz.zones = ['UTC', 'Europe/Berlin', 'Asia/Tokyo'];
    document.body.appendChild(tz);
    await tz.updateComplete;
    expect(scanSameRootAria(tz).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-timezone-picker value="UTC" label="Zone"></mth-timezone-picker>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-timezone-picker>', 'hyd-timezone-picker>')
      .replaceAll('<mth-timezone-picker', '<hyd-timezone-picker');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTimezonePicker('hyd');
        customElements.upgrade(host);
        await (host as MthTimezonePicker).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
