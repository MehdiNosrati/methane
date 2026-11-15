import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, SatelliteEngineSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthFloorPlan, floorPlanSpec, registerMthFloorPlan } from './index.js';

describe('mth-floor-plan', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, RovingFocusSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(floorPlanSpec);
    expect(compiled.docs).toContain('`<mth-floor-plan>`');

    const specReport = await runBehaviorSpecAssertions(floorPlanSpec);
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const engineReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-floor-plan') as MthFloorPlan,
      cycles: 50,
      tokenName: '--mth-color-accent',
      tokenValue: 'oklch(0.6 0.2 250)',
      readAppliedToken: (el, tokenName) => (el as MthFloorPlan).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(engineReport.failures).toEqual([]);
    expect(engineReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run({
      orientation: 'horizontal',
      loop: true,
      mount: async (dir) => {
        const el = document.createElement('mth-floor-plan') as MthFloorPlan;
        if (dir) el.setAttribute('dir', dir);
        el.rooms = [
          { id: 'r1', name: 'Conf A', x: 10, y: 10, width: 80, height: 60 },
          { id: 'r2', name: 'Conf B', x: 110, y: 10, width: 80, height: 60 },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.room-btn')),
    });
    expect(rovingReport.failures).toEqual([]);
    expect(rovingReport.passed).toBe(true);

    const el = document.createElement('mth-floor-plan') as MthFloorPlan;
    el.rooms = [{ id: 'r1', name: 'Conf A', x: 10, y: 10, width: 80, height: 60 }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-floor-plan level="2"><span slot="fallback">Floor plan</span></mth-floor-plan>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-floor-plan>', 'hyd-floor-plan>').replaceAll('<mth-floor-plan', '<hyd-floor-plan');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFloorPlan('hyd');
        customElements.upgrade(host);
        await (host as MthFloorPlan).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('selects rooms and zooms floor plan cleanly', async () => {
    const el = document.createElement('mth-floor-plan') as MthFloorPlan;
    el.rooms = [
      { id: 'r1', name: 'Lobby', x: 10, y: 10, width: 90, height: 60 },
      { id: 'r2', name: 'Vault', x: 110, y: 10, width: 90, height: 60, disabled: true },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    const events: unknown[] = [];
    el.addEventListener('mth-room-select', (e) => events.push((e as CustomEvent).detail));
    const btns = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.room-btn');
    btns[0]!.click();
    btns[1]!.click();
    await el.updateComplete;

    expect(el.selectedIds).toEqual(['r1']);
    expect(events.length).toBe(1);

    el.zoomIn();
    expect(el.zoom).toBe(1.25);

    const floorFirstDisabled = document.createElement('mth-floor-plan') as MthFloorPlan;
    floorFirstDisabled.rooms = [
      { id: 'r1', name: 'Locked', x: 10, y: 10, width: 90, height: 60, disabled: true },
      { id: 'r2', name: 'Open', x: 110, y: 10, width: 90, height: 60 },
    ];
    document.body.appendChild(floorFirstDisabled);
    await floorFirstDisabled.updateComplete;
    const roomBtns = floorFirstDisabled.shadowRoot!.querySelectorAll<HTMLButtonElement>('.room-btn');
    expect(roomBtns[0]?.getAttribute('tabindex')).toBe('-1');
    expect(roomBtns[1]?.getAttribute('tabindex')).toBe('0');
  });
});
