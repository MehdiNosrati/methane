import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, SatelliteEngineSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthMap, mapSpec, registerMthMap } from './index.js';

describe('mth-map', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, and same-root ARIA checks', async () => {
    const compiled = compileSpec(mapSpec);
    expect(compiled.docs).toContain('`<mth-map>`');

    const specReport = await runBehaviorSpecAssertions(mapSpec);
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const engineReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-map') as MthMap,
      cycles: 50,
      tokenName: '--mth-color-accent',
      tokenValue: 'oklch(0.6 0.2 250)',
      readAppliedToken: (el, tokenName) => (el as MthMap).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(engineReport.failures).toEqual([]);
    expect(engineReport.passed).toBe(true);

    const el = document.createElement('mth-map') as MthMap;
    el.markers = [{ id: 'hq', lng: -122.4, lat: 37.78, label: 'HQ' }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-map><span slot="fallback">Map unavailable</span></mth-map>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-map>', 'hyd-map>').replaceAll('<mth-map', '<hyd-map');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMap('hyd');
        customElements.upgrade(host);
        await (host as MthMap).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('pans with Arrow keys (RTL-aware) and zooms via keyboard', async () => {
    const el = document.createElement('mth-map') as MthMap;
    el.setAttribute('dir', 'rtl');
    document.body.appendChild(el);
    await el.updateComplete;

    const base = el.shadowRoot!.querySelector('.base') as HTMLElement;
    const beforeLng = el.engine!.center[0];
    base.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.engine!.center[0]).toBeLessThan(beforeLng);

    const beforeZoom = el.engine!.zoom;
    base.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }));
    await el.updateComplete;
    expect(el.engine!.zoom).toBe(beforeZoom + 1);
  });

  it('activates markers and emits mth-marker-select', async () => {
    const el = document.createElement('mth-map') as MthMap;
    el.markers = [{ id: 'a', lng: -122.3, lat: 37.8, label: 'Spot A' }];
    document.body.appendChild(el);
    await el.updateComplete;

    const events: unknown[] = [];
    el.addEventListener('mth-marker-select', (e) => events.push((e as CustomEvent).detail));
    const btn = el.shadowRoot!.querySelector('[part="marker"]') as HTMLButtonElement;
    btn.click();
    expect(events).toEqual([{ id: 'a', lng: -122.3, lat: 37.8, label: 'Spot A' }]);
  });

  it('re-attaches canvas on same-instance reconnect, sanitizes mapStyle, and disables controls when non-interactive', async () => {
    const el = document.createElement('mth-map') as MthMap;
    el.mapStyle = 'javascript:alert(1)';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(typeof el.engine?.style).toBe('object');
    expect(el.engine?.container).toBeTruthy();

    el.mapStyle = 'https://tiles.example.com/style.json';
    await el.updateComplete;
    expect(el.engine?.style).toBe('https://tiles.example.com/style.json');

    el.interactive = false;
    await el.updateComplete;
    const ctrlBtns = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.control-btn'));
    expect(ctrlBtns.length).toBe(3);
    expect(ctrlBtns.every((b) => b.disabled)).toBe(true);

    el.remove();
    expect(el.engine).toBeNull();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.engine?.container).toBeTruthy();
  });
});
