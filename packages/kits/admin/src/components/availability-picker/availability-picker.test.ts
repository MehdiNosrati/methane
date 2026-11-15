import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MthAvailabilityPicker,
  availabilityPickerSpec,
  registerMthAvailabilityPicker,
} from './index.js';

describe('<mth-availability-picker>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes FormControlSuite + RovingFocusSuite', async () => {
    registerMthAvailabilityPicker();
    const compiled = compileSpec(availabilityPickerSpec);
    expect(compiled.docs).toContain('`<mth-availability-picker>`');

    let mountedEl: MthAvailabilityPicker | null = null;
    const formAdapter = {
      mount: async () => {
        const el = document.createElement('mth-availability-picker') as MthAvailabilityPicker;
        el.name = 'availability';
        mountedEl = el;
        return el;
      },
      setValue: async (el: HTMLElement, val: string) => {
        (el as MthAvailabilityPicker).value = val;
        await (el as MthAvailabilityPicker).updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthAvailabilityPicker).value,
      getFormDataValue: (fd: FormData, name: string) => {
        const nativeVal = fd.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedEl) return null;
        if (mountedEl.effectivelyDisabled) return null;
        return mountedEl.value;
      },
      getInternalDisabled: (el: HTMLElement) =>
        Boolean((el as MthAvailabilityPicker).shadowRoot!.querySelector('button')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthAvailabilityPicker).checkValidity(),
      name: 'availability',
      defaultValue: '{}',
      nextValue: '{"mon":["09:00","10:00"]}',
    };

    const rovingAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-availability-picker') as MthAvailabilityPicker;
        el.dir = dir;
        el.days = ['mon'];
        el.slots = ['09:00', '10:00', '11:00', '14:00'];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.slot-cell')),
      orientation: 'horizontal' as const,
      loop: true,
    };

    const formReport = await FormControlSuite.run(formAdapter);
    expect(formReport.failures).toEqual([]);
    expect(formReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovingReport.failures).toEqual([]);
    expect(rovingReport.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(availabilityPickerSpec, {
      formControl: formAdapter,
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('supports click toggle, drag-painting across slots, and keyboard Space toggle', async () => {
    registerMthAvailabilityPicker();
    const el = document.createElement('mth-availability-picker') as MthAvailabilityPicker;
    el.days = ['mon', 'tue'];
    el.slots = ['09:00', '10:00', '11:00'];
    document.body.appendChild(el);
    await el.updateComplete;

    const mon09 = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '[data-day="mon"][data-slot="09:00"]',
    )!;
    const mon10 = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '[data-day="mon"][data-slot="10:00"]',
    )!;
    const tue09 = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '[data-day="tue"][data-slot="09:00"]',
    )!;

    mon09.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    mon10.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    window.dispatchEvent(new Event('pointerup'));
    await el.updateComplete;

    expect(el.getSchedule().mon).toEqual(['09:00', '10:00']);

    tue09.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await el.updateComplete;
    expect(el.getSchedule().tue).toEqual(['09:00']);

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-availability-picker name="schedule"></mth-availability-picker>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-availability-picker>', 'hyd-availability-picker>')
      .replaceAll('<mth-availability-picker', '<hyd-availability-picker');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAvailabilityPicker('hyd');
        customElements.upgrade(host);
        await (host as MthAvailabilityPicker).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
