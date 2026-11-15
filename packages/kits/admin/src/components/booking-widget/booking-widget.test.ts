import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MthBookingWidget,
  bookingWidgetSpec,
  registerMthBookingWidget,
} from './index.js';

describe('<mth-booking-widget>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes FormControlSuite', async () => {
    registerMthBookingWidget();
    const compiled = compileSpec(bookingWidgetSpec);
    expect(compiled.docs).toContain('`<mth-booking-widget>`');

    let mountedEl: MthBookingWidget | null = null;
    const formAdapter = {
      mount: async () => {
        const el = document.createElement('mth-booking-widget') as MthBookingWidget;
        el.name = 'bookingSlot';
        mountedEl = el;
        return el;
      },
      setValue: async (el: HTMLElement, val: string) => {
        (el as MthBookingWidget).value = val;
        await (el as MthBookingWidget).updateComplete;
      },
      getValue: (el: HTMLElement) => (el as MthBookingWidget).value,
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
        Boolean((el as MthBookingWidget).shadowRoot!.querySelector('button')?.disabled),
      isRequiredInvalid: (el: HTMLElement) => !(el as MthBookingWidget).checkValidity(),
      name: 'bookingSlot',
      defaultValue: '',
      nextValue: '2026-11-18T10:30',
    };

    const formReport = await FormControlSuite.run(formAdapter);
    expect(formReport.failures).toEqual([]);
    expect(formReport.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(bookingWidgetSpec, {
      formControl: formAdapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('selects date and time slot, updates value, and emits mth-confirm', async () => {
    registerMthBookingWidget();
    const el = document.createElement('mth-booking-widget') as MthBookingWidget;
    document.body.appendChild(el);
    await el.updateComplete;

    let confirmed = '';
    el.addEventListener('mth-confirm', ((e: CustomEvent) => {
      confirmed = e.detail.value;
    }) as EventListener);

    el.selectSlot('2026-11-20', '14:30');
    await el.updateComplete;
    expect(el.value).toBe('2026-11-20T14:30');

    el.confirm();
    expect(confirmed).toBe('2026-11-20T14:30');

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-booking-widget name="slot"></mth-booking-widget>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-booking-widget>', 'hyd-booking-widget>')
      .replaceAll('<mth-booking-widget', '<hyd-booking-widget');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBookingWidget('hyd');
        customElements.upgrade(host);
        await (host as MthBookingWidget).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
