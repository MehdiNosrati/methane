import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, SatelliteEngineSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { mapDrawSpec } from './map-draw.spec.js';
import { MthMapDraw, registerMthMapDraw } from './index.js';

describe('mth-map-draw', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, RovingFocusSuite, and same-root ARIA checks', async () => {
    const compiled = compileSpec(mapDrawSpec);
    expect(compiled.docs).toContain('`<mth-map-draw>`');

    const specReport = await runBehaviorSpecAssertions(mapDrawSpec);
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const engineReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-map-draw') as MthMapDraw,
      cycles: 50,
      tokenName: '--mth-color-accent',
      tokenValue: 'oklch(0.6 0.2 250)',
      readAppliedToken: (el, tokenName) => (el as MthMapDraw).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(engineReport.failures).toEqual([]);
    expect(engineReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run({
      orientation: 'horizontal',
      loop: true,
      mount: async (dir) => {
        const el = document.createElement('mth-map-draw') as MthMapDraw;
        if (dir) el.setAttribute('dir', dir);
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.tool-btn:not([disabled])')),
    });
    expect(rovingReport.failures).toEqual([]);
    expect(rovingReport.passed).toBe(true);

    const el = document.createElement('mth-map-draw') as MthMapDraw;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-map-draw><span slot="fallback">Draw fallback</span></mth-map-draw>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-map-draw>', 'hyd-map-draw>').replaceAll('<mth-map-draw', '<hyd-map-draw');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMapDraw('hyd');
        customElements.upgrade(host);
        await (host as MthMapDraw).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('draws polygons and supports undo/redo with GeoJSON output', async () => {
    const el = document.createElement('mth-map-draw') as MthMapDraw;
    document.body.appendChild(el);
    await el.updateComplete;

    el.setMode('polygon');
    el.addVertex(-122.4, 37.7);
    el.addVertex(-122.3, 37.7);
    el.addVertex(-122.35, 37.8);
    el.finishFeature();
    await el.updateComplete;

    expect(el.features.features.length).toBe(1);
    expect(el.features.features[0]?.geometry.type).toBe('Polygon');

    el.undo();
    expect(el.features.features.length).toBe(0);
    el.redo();
    expect(el.features.features.length).toBe(1);
  });

  it('supports keyboard drawing on surface and re-attaches container on reconnect', async () => {
    const el = document.createElement('mth-map-draw') as MthMapDraw;
    el.setMode('line');
    document.body.appendChild(el);
    await el.updateComplete;

    const surface = el.shadowRoot!.querySelector<SVGElement>('[part="surface"]')!;
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;

    expect(el.features.features.length).toBe(1);
    expect(el.features.features[0]?.geometry.type).toBe('LineString');

    surface.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await el.updateComplete;
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="status"]')?.textContent).toContain('0');

    el.remove();
    expect(el.engine).toBeNull();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.engine?.container).toBeTruthy();
  });
});
