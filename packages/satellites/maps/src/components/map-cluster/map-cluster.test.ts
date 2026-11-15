import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, SatelliteEngineSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthMapCluster, mapClusterSpec, registerMthMapCluster } from './index.js';

describe('mth-map-cluster', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, RovingFocusSuite, and same-root ARIA checks', async () => {
    const compiled = compileSpec(mapClusterSpec);
    expect(compiled.docs).toContain('`<mth-map-cluster>`');

    const specReport = await runBehaviorSpecAssertions(mapClusterSpec);
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const engineReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-map-cluster') as MthMapCluster,
      cycles: 50,
      tokenName: '--mth-color-accent',
      tokenValue: 'oklch(0.6 0.2 250)',
      readAppliedToken: (el, tokenName) => (el as MthMapCluster).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(engineReport.failures).toEqual([]);
    expect(engineReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run({
      orientation: 'horizontal',
      loop: true,
      mount: async (dir) => {
        const el = document.createElement('mth-map-cluster') as MthMapCluster;
        if (dir) el.setAttribute('dir', dir);
        el.zoom = 18;
        el.points = [
          { id: '1', lng: -122.41, lat: 37.77, label: 'P1' },
          { id: '2', lng: 2.35, lat: 48.85, label: 'P2' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.cluster-btn')),
    });
    expect(rovingReport.failures).toEqual([]);
    expect(rovingReport.passed).toBe(true);

    const el = document.createElement('mth-map-cluster') as MthMapCluster;
    el.points = [{ id: '1', lng: -122.41, lat: 37.77, label: 'P1' }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-map-cluster><span slot="fallback">Cluster fallback</span></mth-map-cluster>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-map-cluster>', 'hyd-map-cluster>').replaceAll('<mth-map-cluster', '<hyd-map-cluster');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMapCluster('hyd');
        customElements.upgrade(host);
        await (host as MthMapCluster).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('clusters nearby points and expands zoom on cluster click', async () => {
    const el = document.createElement('mth-map-cluster') as MthMapCluster;
    el.zoom = 2;
    el.points = [
      { id: 'a', lng: -122.4, lat: 37.7 },
      { id: 'b', lng: -122.45, lat: 37.75 },
      { id: 'c', lng: 2.35, lat: 48.85, label: 'Paris' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.clusters.length).toBe(2);

    const expanded: unknown[] = [];
    el.addEventListener('mth-cluster-expand', (e) => expanded.push((e as CustomEvent).detail));
    const btn = el.shadowRoot!.querySelector('.cluster-btn') as HTMLButtonElement;
    btn.click();
    await el.updateComplete;

    expect(expanded.length).toBe(1);
    expect(el.engine!.zoom).toBe(4);
  });
});
