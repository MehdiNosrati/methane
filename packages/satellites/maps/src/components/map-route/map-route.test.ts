import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, SatelliteEngineSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthMapRoute, mapRouteSpec, registerMthMapRoute } from './index.js';

describe('mth-map-route', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, and same-root ARIA checks', async () => {
    const compiled = compileSpec(mapRouteSpec);
    expect(compiled.docs).toContain('`<mth-map-route>`');

    const specReport = await runBehaviorSpecAssertions(mapRouteSpec);
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const engineReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-map-route') as MthMapRoute,
      cycles: 50,
      tokenName: '--mth-color-accent',
      tokenValue: 'oklch(0.6 0.2 250)',
      readAppliedToken: (el, tokenName) => (el as MthMapRoute).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(engineReport.failures).toEqual([]);
    expect(engineReport.passed).toBe(true);

    const el = document.createElement('mth-map-route') as MthMapRoute;
    el.origin = { lng: -122.4194, lat: 37.7749, label: 'SF' };
    el.destination = { lng: -122.2711, lat: 37.8044, label: 'Oakland' };
    document.body.appendChild(el);
    await el.updateComplete;
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-map-route><span slot="fallback">Route fallback</span></mth-map-route>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-map-route>', 'hyd-map-route>').replaceAll('<mth-map-route', '<hyd-map-route');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMapRoute('hyd');
        customElements.upgrade(host);
        await (host as MthMapRoute).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('computes route distance and fits engine bounds', async () => {
    const el = document.createElement('mth-map-route') as MthMapRoute;
    el.origin = { lng: -122.4194, lat: 37.7749, label: 'SF' };
    el.waypoints = [{ lng: -122.35, lat: 37.79, label: 'Bay Bridge' }];
    el.destination = { lng: -122.2711, lat: 37.8044, label: 'Oakland' };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.totalDistanceKm).toBeGreaterThan(10);
    const fitEvents: unknown[] = [];
    el.addEventListener('mth-route-fit', (e) => fitEvents.push((e as CustomEvent).detail));
    el.fitRouteBounds();
    expect(fitEvents.length).toBe(1);

    el.remove();
    expect(el.engine).toBeNull();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.engine?.container).toBeTruthy();
  });
});
