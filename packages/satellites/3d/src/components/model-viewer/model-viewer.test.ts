import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MthModelViewer,
  modelViewerSpec,
  registerMthModelViewer,
} from './index.js';

describe('<mth-model-viewer>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('compiles spec and passes behavior spec assertions', async () => {
    registerMthModelViewer();
    const compiled = compileSpec(modelViewerSpec);
    expect(compiled.docs).toContain('`<mth-model-viewer>`');

    const report = await runBehaviorSpecAssertions(modelViewerSpec, {
      satellite: {
        createElement: () => document.createElement('mth-model-viewer') as MthModelViewer,
        cycles: 5,
        tokenName: '--mth-color-accent',
        tokenValue: 'oklch(0.6 0.2 250)',
        readAppliedToken: (el, tokenName) => (el as MthModelViewer).getAppliedToken(tokenName),
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('supports keyboard orbit/zoom/reset, blocks unsafe URLs, and disables autoRotate under reduced-motion', async () => {
    registerMthModelViewer();

    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      const viewer = document.createElement('mth-model-viewer') as MthModelViewer;
      viewer.alt = 'Engine block';
      viewer.autoRotate = true;
      viewer.src = 'javascript:alert(1)';
      document.body.appendChild(viewer);
      await viewer.updateComplete;

      // MotionController gates autoRotate when prefers-reduced-motion: reduce is active
      expect(viewer.effectiveAutoRotate).toBe(false);
      expect(viewer.engine?.effectiveAutoRotate).toBe(false);

      await viewer.loadModel();
      expect(viewer.error).toContain('Blocked');

      const viewport = viewer.shadowRoot!.querySelector('[part="viewport"]') as HTMLDivElement;
      viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(viewer.cameraOrbitTheta).toBe(15);

      viewport.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }));
      expect(viewer.cameraDistance).toBe(3.5);

      viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(viewer.cameraOrbitTheta).toBe(0);
      expect(viewer.cameraDistance).toBe(4);

      const aria = scanSameRootAria(viewer.shadowRoot!);
      expect(aria.valid).toBe(true);
      expect(aria.issues).toEqual([]);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('passes SatelliteEngineSuite 50x mount/unmount disposal and token sync checks', async () => {
    registerMthModelViewer();
    const result = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-model-viewer') as MthModelViewer,
      cycles: 50,
      tokenName: '--mth-color-accent',
      tokenValue: 'oklch(0.6 0.2 250)',
      readAppliedToken: (el, tokenName) => (el as MthModelViewer).getAppliedToken(tokenName),
    });
    expect(result.failures).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('passes HydrationPuritySuite with poster and fallback slot', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-model-viewer alt="Satellite dish" poster="/poster.png"><p slot="fallback">3D preview unavailable</p></mth-model-viewer>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-model-viewer>', 'hyd-model-viewer>')
      .replaceAll('<mth-model-viewer', '<hyd-model-viewer');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthModelViewer('hyd');
        customElements.upgrade(host);
        await (host as MthModelViewer).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
