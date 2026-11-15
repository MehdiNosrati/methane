import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { modelViewerSpec } from './model-viewer.spec.js';
import { MthModelViewer, registerMthModelViewer } from './index.js';

async function mountModelViewer(
  props: Partial<
    Pick<
      MthModelViewer,
      | 'src'
      | 'poster'
      | 'alt'
      | 'rendererBackend'
      | 'autoRotate'
      | 'autoRotateSpeed'
      | 'cameraOrbitTheta'
      | 'cameraOrbitPhi'
      | 'cameraDistance'
      | 'exposure'
      | 'showControls'
      | 'loading'
      | 'dir'
    >
  > = {},
): Promise<MthModelViewer> {
  registerMthModelViewer();
  const viewer = document.createElement('mth-model-viewer') as MthModelViewer;
  Object.assign(viewer, props);
  document.body.appendChild(viewer);
  await viewer.updateComplete;
  return viewer;
}

describe('<mth-model-viewer>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock('three/examples/jsm/loaders/GLTFLoader.js');
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

  it('reflects src, poster, alt, renderer-backend, auto-rotate, and loading attributes', async () => {
    const viewer = await mountModelViewer({
      src: '/models/chassis.glb',
      poster: '/images/chassis.png',
      alt: 'Vehicle chassis',
      rendererBackend: 'webgl',
      autoRotate: true,
      loading: true,
    });

    expect(viewer.getAttribute('src')).toBe('/models/chassis.glb');
    expect(viewer.getAttribute('poster')).toBe('/images/chassis.png');
    expect(viewer.getAttribute('alt')).toBe('Vehicle chassis');
    expect(viewer.getAttribute('renderer-backend')).toBe('webgl');
    expect(viewer.hasAttribute('auto-rotate')).toBe(true);
    expect(viewer.hasAttribute('loading')).toBe(true);

    viewer.setAttribute('alt', 'Updated turbine');
    viewer.setAttribute('renderer-backend', 'webgpu');
    viewer.removeAttribute('auto-rotate');
    await viewer.updateComplete;

    expect(viewer.alt).toBe('Updated turbine');
    expect(viewer.rendererBackend).toBe('webgpu');
    expect(viewer.autoRotate).toBe(false);
  });

  it('configures camera, exposure, and auto-rotate-speed attributes and properties', async () => {
    const viewer = await mountModelViewer({
      cameraOrbitTheta: 45,
      cameraOrbitPhi: 60,
      cameraDistance: 6,
      exposure: 1.4,
      autoRotateSpeed: 4,
    });

    expect(viewer.cameraOrbitTheta).toBe(45);
    expect(viewer.cameraOrbitPhi).toBe(60);
    expect(viewer.cameraDistance).toBe(6);
    expect(viewer.exposure).toBe(1.4);
    expect(viewer.autoRotateSpeed).toBe(4);

    viewer.setAttribute('camera-orbit-theta', '90');
    viewer.setAttribute('camera-orbit-phi', '40');
    viewer.setAttribute('camera-distance', '8');
    await viewer.updateComplete;

    expect(viewer.cameraOrbitTheta).toBe(90);
    expect(viewer.cameraOrbitPhi).toBe(40);
    expect(viewer.cameraDistance).toBe(8);
  });

  it('toggles controls bar visibility via showControls and exposes accessible toolbar buttons', async () => {
    const viewer = await mountModelViewer({ showControls: true });
    const controls = viewer.shadowRoot!.querySelector<HTMLElement>('[part="controls"]')!;
    expect(controls.hidden).toBe(false);
    expect(controls.querySelectorAll('button').length).toBe(4);

    viewer.showControls = false;
    await viewer.updateComplete;
    expect(controls.hidden).toBe(true);
  });

  it('handles interactive control clicks for zoom-in, zoom-out, auto-rotate toggle, and camera reset', async () => {
    const viewer = await mountModelViewer({ cameraDistance: 4, autoRotate: false });
    const buttons = Array.from(
      viewer.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="controls"] button'),
    );
    const [zoomInBtn, zoomOutBtn, rotateToggleBtn, resetBtn] = buttons as [
      HTMLButtonElement,
      HTMLButtonElement,
      HTMLButtonElement,
      HTMLButtonElement,
    ];

    const cameraEvents: Array<{ theta: number; phi: number; distance: number }> = [];
    viewer.addEventListener('mth-camera-change', (ev) => {
      cameraEvents.push(
        (ev as CustomEvent<{ theta: number; phi: number; distance: number }>).detail,
      );
    });

    zoomInBtn.click();
    expect(viewer.cameraDistance).toBe(3.5);

    zoomOutBtn.click();
    expect(viewer.cameraDistance).toBe(4);

    expect(rotateToggleBtn.getAttribute('aria-pressed')).toBe('false');
    rotateToggleBtn.click();
    await viewer.updateComplete;
    expect(viewer.autoRotate).toBe(true);
    expect(rotateToggleBtn.getAttribute('aria-pressed')).toBe('true');
    expect(viewer.hasCustomState('auto-rotating')).toBe(true);

    viewer.orbitBy(30, 15);
    expect(viewer.cameraOrbitTheta).toBe(30);
    expect(viewer.cameraOrbitPhi).toBe(90);

    resetBtn.click();
    expect(viewer.cameraOrbitTheta).toBe(0);
    expect(viewer.cameraOrbitPhi).toBe(75);
    expect(viewer.cameraDistance).toBe(4);
    expect(cameraEvents.length).toBe(4);
  });

  it('clamps cameraOrbitPhi within [15..165] and cameraDistance within [1..40]', async () => {
    const viewer = await mountModelViewer({ cameraOrbitPhi: 75, cameraDistance: 4 });

    viewer.orbitBy(370, 500);
    expect(viewer.cameraOrbitTheta).toBe(10);
    expect(viewer.cameraOrbitPhi).toBe(165);

    viewer.orbitBy(0, -500);
    expect(viewer.cameraOrbitPhi).toBe(15);

    viewer.zoomBy(-100);
    expect(viewer.cameraDistance).toBe(1);

    viewer.zoomBy(100);
    expect(viewer.cameraDistance).toBe(40);
  });

  it('supports full keyboard navigation (arrows, +, =, -, Home, r, 0, Space) and RTL arrow reversal', async () => {
    const viewer = await mountModelViewer({ dir: 'rtl' });
    const viewport = viewer.shadowRoot!.querySelector<HTMLDivElement>('[part="viewport"]')!;

    // In RTL, ArrowRight orbits -15 and ArrowLeft orbits +15
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(viewer.cameraOrbitTheta).toBe(-15);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(viewer.cameraOrbitTheta).toBe(0);

    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(viewer.cameraOrbitPhi).toBe(65);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(viewer.cameraOrbitPhi).toBe(75);

    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: '=', bubbles: true }));
    expect(viewer.cameraDistance).toBe(3.5);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: '-', bubbles: true }));
    expect(viewer.cameraDistance).toBe(4);

    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(viewer.autoRotate).toBe(true);

    viewer.orbitBy(45, 10);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
    expect(viewer.cameraOrbitTheta).toBe(0);
    expect(viewer.cameraOrbitPhi).toBe(75);

    viewer.zoomBy(2);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }));
    expect(viewer.cameraDistance).toBe(4);
  });

  it('supports keyboard orbit/zoom/reset, blocks unsafe URLs, and disables autoRotate under reduced-motion', async () => {
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
      const viewer = await mountModelViewer({
        alt: 'Engine block',
        autoRotate: true,
        src: 'javascript:alert(1)',
      });

      expect(viewer.effectiveAutoRotate).toBe(false);
      expect(viewer.engine?.effectiveAutoRotate).toBe(false);
      expect(viewer.hasCustomState('reduced-motion')).toBe(true);

      await viewer.loadModel();
      expect(viewer.error).toContain('Blocked');
      expect(viewer.hasCustomState('error')).toBe(true);

      const viewport = viewer.shadowRoot!.querySelector<HTMLDivElement>('[part="viewport"]')!;
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

  it('rejects unsafe javascript: and data: URLs for both src and poster', async () => {
    const viewer = await mountModelViewer({ poster: 'javascript:alert(1)' });
    const posterImg = viewer.shadowRoot!.querySelector<HTMLImageElement>('[part="poster"]')!;
    expect(posterImg.hidden).toBe(true);
    expect(posterImg.getAttribute('src')).toBe('');

    const errorDetails: Array<{ message: string }> = [];
    viewer.addEventListener('mth-model-error', (ev) => {
      errorDetails.push((ev as CustomEvent<{ message: string }>).detail);
    });

    viewer.src = 'data:text/html,<script>alert(1)</script>';
    await viewer.updateComplete;
    await viewer.loadModel();

    expect(viewer.error).toContain('Blocked');
    expect(errorDetails.length).toBeGreaterThanOrEqual(1);
  });

  it('renders safe poster image and degrades gracefully to headless backend when WebGL is unavailable', async () => {
    const viewer = await mountModelViewer({
      poster: 'https://example.com/poster.webp',
      alt: 'Jet turbine',
    });

    await new Promise((r) => setTimeout(r, 25));
    await viewer.updateComplete;

    const posterImg = viewer.shadowRoot!.querySelector<HTMLImageElement>('[part="poster"]')!;
    expect(posterImg.hidden).toBe(false);
    expect(posterImg.getAttribute('src')).toBe('https://example.com/poster.webp');
    expect(posterImg.getAttribute('alt')).toBe('Jet turbine');
    expect(viewer.engine?.backend).toBe('headless');
  });

  it('positions Three.js PerspectiveCamera on spherical orbit coordinates and emits mth-model-load on glTF load', async () => {
    const three = await import('three');
    const loaderMod = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const mockGroup = new three.Group();
    const mesh = new three.Mesh(new three.BoxGeometry(2, 2, 2), new three.MeshBasicMaterial());
    mesh.position.set(4, 2, 0);
    mockGroup.add(mesh);

    vi.spyOn(loaderMod.GLTFLoader.prototype, 'loadAsync').mockResolvedValue({
      scene: mockGroup,
    } as never);

    const loadEvents: Array<{ src: string; backend: string }> = [];
    const viewer = await mountModelViewer({
      cameraOrbitTheta: 90,
      cameraOrbitPhi: 90,
      cameraDistance: 5,
    });
    await new Promise((r) => setTimeout(r, 10));
    viewer.addEventListener('mth-model-load', (ev) => {
      loadEvents.push((ev as CustomEvent<{ src: string; backend: string }>).detail);
    });

    viewer.src = '/models/cube.glb';
    await viewer.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    await viewer.updateComplete;

    expect(viewer.loading).toBe(false);
    expect(viewer.error).toBe('');
    expect(viewer.hasCustomState('loaded')).toBe(true);
    expect(loadEvents).toEqual([{ src: '/models/cube.glb', backend: 'headless' }]);
    expect(viewer.engine?.scene).not.toBeNull();
    expect(viewer.engine?.camera).not.toBeNull();
    expect(viewer.engine!.camera!.position.x).toBeCloseTo(5, 3);
    expect(viewer.engine!.camera!.position.y).toBeCloseTo(0, 3);

    // Poster hides once model is loaded
    viewer.poster = '/poster.png';
    await viewer.updateComplete;
    const posterImg = viewer.shadowRoot!.querySelector<HTMLImageElement>('[part="poster"]')!;
    expect(posterImg.hidden).toBe(true);
  });

  it('emits mth-model-error when GLTFLoader.loadAsync rejects', async () => {
    const loaderMod = await import('three/examples/jsm/loaders/GLTFLoader.js');
    vi.spyOn(loaderMod.GLTFLoader.prototype, 'loadAsync').mockRejectedValue(
      new Error('404 model not found'),
    );

    const errorEvents: Array<{ message: string }> = [];
    const viewer = await mountModelViewer();
    await new Promise((r) => setTimeout(r, 10));
    viewer.addEventListener('mth-model-error', (ev) => {
      errorEvents.push((ev as CustomEvent<{ message: string }>).detail);
    });

    viewer.src = '/models/missing.glb';
    await viewer.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    await viewer.updateComplete;

    expect(viewer.loading).toBe(false);
    expect(viewer.error).toBe('404 model not found');
    expect(viewer.hasCustomState('error')).toBe(true);
    expect(errorEvents).toEqual([{ message: '404 model not found' }]);
  });

  it('disposes Three.js renderer, controls, and scene on disconnectedCallback and supports reconnect', async () => {
    const viewer = await mountModelViewer();
    const engineBefore = viewer.engine!;
    expect(engineBefore.disposed).toBe(false);

    // Trigger scene creation by loading a mocked model
    const three = await import('three');
    const loaderMod = await import('three/examples/jsm/loaders/GLTFLoader.js');
    vi.spyOn(loaderMod.GLTFLoader.prototype, 'loadAsync').mockResolvedValue({
      scene: new three.Group(),
    } as never);
    viewer.src = '/models/part.glb';
    await viewer.loadModel();
    expect(engineBefore.scene).not.toBeNull();

    viewer.remove();
    expect(viewer.engine).toBeNull();
    expect(engineBefore.disposed).toBe(true);
    expect(engineBefore.scene).toBeNull();
    expect(engineBefore.camera).toBeNull();

    document.body.appendChild(viewer);
    await viewer.updateComplete;
    expect(viewer.engine).not.toBeNull();
    expect(viewer.engine?.disposed).toBe(false);
  });

  it('delegates orbitBy, zoomBy, and resetCamera through engine handle', async () => {
    const viewer = await mountModelViewer();
    viewer.engine!.orbitBy(45, -15);
    expect(viewer.cameraOrbitTheta).toBe(45);
    expect(viewer.cameraOrbitPhi).toBe(60);

    viewer.engine!.zoomBy(3);
    expect(viewer.cameraDistance).toBe(7);

    viewer.engine!.resetCamera();
    expect(viewer.cameraOrbitTheta).toBe(0);
    expect(viewer.cameraOrbitPhi).toBe(75);
    expect(viewer.cameraDistance).toBe(4);
  });

  it('renders fallback slot and sets accessible region label from alt', async () => {
    registerMthModelViewer();
    const viewer = document.createElement('mth-model-viewer') as MthModelViewer;
    viewer.alt = 'CAD assembly';
    const fallback = document.createElement('p');
    fallback.slot = 'fallback';
    fallback.textContent = 'WebGL unavailable';
    viewer.appendChild(fallback);
    document.body.appendChild(viewer);
    await viewer.updateComplete;

    const viewport = viewer.shadowRoot!.querySelector<HTMLElement>('[part="viewport"]')!;
    expect(viewport.getAttribute('aria-label')).toBe('CAD assembly');
    const slot = viewer.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="fallback"]')!;
    expect(slot.assignedElements()).toEqual([fallback]);
  });

  it('applies non-oklch --mth-color-bg-subtle token to Three.js scene background', async () => {
    const viewer = await mountModelViewer();
    viewer.style.setProperty('--mth-color-bg-subtle', '#112233');
    const three = await import('three');
    const loaderMod = await import('three/examples/jsm/loaders/GLTFLoader.js');
    vi.spyOn(loaderMod.GLTFLoader.prototype, 'loadAsync').mockResolvedValue({
      scene: new three.Group(),
    } as never);

    viewer.src = '/models/bg.glb';
    await viewer.loadModel();

    expect(viewer.getAppliedToken('--mth-color-bg-subtle')).toBe('#112233');
    expect(viewer.engine?.scene?.background).toBeInstanceOf(three.Color);
  });

  it('shows status region when loading or error is set and hides when idle', async () => {
    const viewer = await mountModelViewer();
    const status = viewer.shadowRoot!.querySelector<HTMLElement>('[part="status"]')!;
    expect(status.hidden).toBe(true);

    viewer.loading = true;
    await viewer.updateComplete;
    expect(status.hidden).toBe(false);
    expect(status.textContent?.trim()).toContain('Loading');

    viewer.loading = false;
    viewer.error = 'Failed to parse GLB';
    await viewer.updateComplete;
    expect(status.hidden).toBe(false);
    expect(status.textContent?.trim()).toBe('Failed to parse GLB');
  });

  it('cancels animation frame and disposes custom renderer when attached', async () => {
    const viewer = await mountModelViewer();
    const disposeSpy = vi.fn();
    const renderSpy = vi.fn();
    // Simulate an active attached renderer via internal field check through disconnect
    const rafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    (viewer as unknown as { _renderer: { dispose: () => void; render: () => void }; _rafId: number })._renderer = {
      dispose: disposeSpy,
      render: renderSpy,
    };
    (viewer as unknown as { _rafId: number })._rafId = 42;

    viewer.remove();
    expect(rafSpy).toHaveBeenCalledWith(42);
    expect(disposeSpy).toHaveBeenCalledTimes(1);
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
