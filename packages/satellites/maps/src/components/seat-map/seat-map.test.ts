import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthSeatMap, seatMapSpec, registerMthSeatMap, type SeatDefinition } from './index.js';

const SAMPLE_SEATS: ReadonlyArray<SeatDefinition> = [
  { id: 'A1', label: 'A1', tier: 'vip' },
  { id: 'A2', label: 'A2', tier: 'vip' },
  { id: 'A3', label: 'A3', status: 'occupied' },
  { id: 'B1', label: 'B1' },
  { id: 'B2', label: 'B2' },
  { id: 'B3', label: 'B3' },
];

describe('mth-seat-map', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, FormControlSuite, RovingFocusSuite (2D), SatelliteEngineSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(seatMapSpec);
    expect(compiled.docs).toContain('`<mth-seat-map>`');

    const specReport = await runBehaviorSpecAssertions(seatMapSpec);
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const engineReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-seat-map') as MthSeatMap,
      cycles: 50,
      tokenName: '--mth-color-accent',
      tokenValue: 'oklch(0.6 0.2 250)',
      readAppliedToken: (el, tokenName) => (el as MthSeatMap).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(engineReport.failures).toEqual([]);
    expect(engineReport.passed).toBe(true);

    const horizontalReport = await RovingFocusSuite.run({
      orientation: 'horizontal',
      loop: false,
      mount: async (dir) => {
        const el = document.createElement('mth-seat-map') as MthSeatMap;
        if (dir) el.setAttribute('dir', dir);
        el.columns = 3;
        el.seats = SAMPLE_SEATS;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.seat-btn')),
    });
    expect(horizontalReport.failures).toEqual([]);
    expect(horizontalReport.passed).toBe(true);

    const verticalReport = await RovingFocusSuite.run({
      orientation: 'vertical',
      loop: false,
      mount: async (dir) => {
        const el = document.createElement('mth-seat-map') as MthSeatMap;
        if (dir) el.setAttribute('dir', dir);
        el.columns = 1;
        el.seats = SAMPLE_SEATS.filter((s) => !s.status).slice(0, 3);
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.seat-btn')),
    });
    expect(verticalReport.failures).toEqual([]);
    expect(verticalReport.passed).toBe(true);

    let mountedMap: MthSeatMap | null = null;
    const formReport = await FormControlSuite.run({
      name: 'seats',
      defaultValue: 'A1',
      nextValue: 'B1,B2',
      mount: () => {
        const el = document.createElement('mth-seat-map') as MthSeatMap;
        el.columns = 3;
        el.seats = SAMPLE_SEATS;
        el.defaultValue = 'A1';
        el.value = 'A1';
        mountedMap = el;
        return el;
      },
      setValue: async (el, value) => {
        const mapEl = el as MthSeatMap;
        await mapEl.updateComplete;
        mapEl.value = value;
        await mapEl.updateComplete;
      },
      getValue: (el) => (el as MthSeatMap).value,
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedMap) return null;
        return mountedMap.isDisabled ? null : mountedMap.value;
      },
      getInternalDisabled: (el) => (el as MthSeatMap).isDisabled,
      isRequiredInvalid: (el) => !(el as MthSeatMap).checkValidity(),
    });
    expect(formReport.failures).toEqual([]);
    expect(formReport.passed).toBe(true);

    const el = document.createElement('mth-seat-map') as MthSeatMap;
    el.columns = 3;
    el.seats = SAMPLE_SEATS;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-seat-map label="Theater"><span slot="fallback">Seat map</span></mth-seat-map>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-seat-map>', 'hyd-seat-map>').replaceAll('<mth-seat-map', '<hyd-seat-map');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSeatMap('hyd');
        customElements.upgrade(host);
        await (host as MthSeatMap).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('navigates 2D rows with ArrowDown and ignores occupied seats on selection', async () => {
    const el = document.createElement('mth-seat-map') as MthSeatMap;
    el.columns = 3;
    el.seats = SAMPLE_SEATS;
    document.body.appendChild(el);
    await el.updateComplete;

    const btns = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.seat-btn'));
    btns[0]!.focus();
    btns[0]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
    );
    await el.updateComplete;
    expect(el.shadowRoot!.activeElement).toBe(btns[3]);

    // A3 is occupied, B1 is available
    btns[2]!.click();
    btns[3]!.click();
    await el.updateComplete;
    expect(el.selectedSeats).toEqual(['B1']);
    expect(el.value).toBe('B1');
  });
});
