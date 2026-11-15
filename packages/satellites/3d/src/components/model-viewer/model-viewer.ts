import { UIElement, type PropertyValues } from '@methane/core';
import { MotionController, ObserverPoolController } from '@methane/primitives';
import { isSafeUrl, sanitizeUrl } from '@methane/sanitize';
import { html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import type * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { WebGPURenderer } from 'three/webgpu';
import { modelViewerMessages } from './model-viewer.messages.js';
import { modelViewerStyles } from './model-viewer.styles.js';

export type ModelRendererBackend = 'auto' | 'webgl' | 'webgpu';

export type MthModelRenderer = THREE.WebGLRenderer | WebGPURenderer;

export interface MthModelEngineHandle {
  readonly backend: 'webgpu' | 'webgl' | 'headless';
  readonly scene: THREE.Scene | null;
  readonly camera: THREE.PerspectiveCamera | null;
  readonly renderer: MthModelRenderer | null;
  readonly controls: OrbitControls | null;
  readonly effectiveAutoRotate: boolean;
  orbitBy(deltaThetaDeg: number, deltaPhiDeg: number): void;
  zoomBy(deltaDistance: number): void;
  resetCamera(): void;
  getAppliedToken(tokenName: string): string;
  dispose(): void;
  readonly disposed: boolean;
}

const MODEL_TOKEN_NAMES = [
  '--mth-color-accent',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-surface',
  '--mth-color-bg-subtle',
  '--mth-color-border',
] as const;

/**
 * `<mth-model-viewer>`: Wrap-first Three.js lazy WebGL/WebGPU 3D model viewer.
 */
export class MthModelViewer extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = modelViewerMessages;
  static override styles = modelViewerStyles;

  private readonly motionCtrl = new MotionController(this);
  private readonly observerPool = new ObserverPoolController(this);

  @property({ type: String, reflect: true })
  src = '';

  @property({ type: String, reflect: true })
  poster = '';

  @property({ type: String, reflect: true })
  alt = '';

  @property({ type: String, reflect: true, attribute: 'renderer-backend' })
  rendererBackend: ModelRendererBackend = 'auto';

  @property({ type: Boolean, reflect: true, attribute: 'auto-rotate' })
  autoRotate = false;

  @property({ type: Number, attribute: 'auto-rotate-speed' })
  autoRotateSpeed = 2;

  @property({ type: Number, attribute: 'camera-orbit-theta' })
  cameraOrbitTheta = 0;

  @property({ type: Number, attribute: 'camera-orbit-phi' })
  cameraOrbitPhi = 75;

  @property({ type: Number, attribute: 'camera-distance' })
  cameraDistance = 4;

  @property({ type: Number })
  exposure = 1;

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls = true;

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: String })
  error = '';

  @query('[part="canvas"]')
  private canvasEl?: HTMLCanvasElement | null;

  @query('[part="viewport"]')
  private viewportEl?: HTMLDivElement | null;

  @state()
  private modelLoaded = false;

  private _engine: MthModelEngineHandle | null = null;
  private _threeMod: typeof THREE | null = null;
  private _scene: THREE.Scene | null = null;
  private _camera: THREE.PerspectiveCamera | null = null;
  private _renderer: MthModelRenderer | null = null;
  private _controls: OrbitControls | null = null;
  private _modelGroup: THREE.Group | null = null;
  private _activeBackend: 'webgpu' | 'webgl' | 'headless' = 'headless';
  private _rafId = 0;
  private _attachTimer: ReturnType<typeof setTimeout> | undefined;
  private _observedViewportEl: HTMLElement | null = null;
  private _tokenCache: Map<string, string> = new Map();
  private _disposed = false;

  get engine(): MthModelEngineHandle | null {
    return this._engine;
  }

  get effectiveAutoRotate(): boolean {
    return this.autoRotate && !this.motionCtrl.isReducedMotion;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._disposed = false;
    this._syncTokens();
    this._initEngineHandle();
    if (this.hasUpdated) {
      this._bindViewportResizeObserver();
      this._scheduleLazyAttach();
    }
  }

  override disconnectedCallback(): void {
    this._disposed = true;
    if (this._attachTimer !== undefined) {
      clearTimeout(this._attachTimer);
      this._attachTimer = undefined;
    }
    this._observedViewportEl = null;
    this._disposeEngine();
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this._bindViewportResizeObserver();
    this._scheduleLazyAttach();
  }

  private _bindViewportResizeObserver(): void {
    if (!this.viewportEl || this._observedViewportEl === this.viewportEl) return;
    this._observedViewportEl = this.viewportEl;
    this.observerPool.observeResize(this.viewportEl, () => {
      this._resizeRenderer();
    });
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.setCustomState('loading', this.loading);
    this.setCustomState('error', this.error.length > 0);
    this.setCustomState('loaded', this.modelLoaded);
    this.setCustomState('auto-rotating', this.effectiveAutoRotate);
    this.setCustomState('reduced-motion', this.motionCtrl.isReducedMotion);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (
      changed.has('cameraOrbitTheta') ||
      changed.has('cameraOrbitPhi') ||
      changed.has('cameraDistance')
    ) {
      this._applyCameraSpherical();
    }
    if (this._controls) {
      this._controls.autoRotate = this.effectiveAutoRotate;
      this._controls.autoRotateSpeed = this.autoRotateSpeed;
    }
    if (this._renderer) {
      this._renderer.toneMappingExposure = this.exposure;
    }
    if (changed.has('src') && changed.get('src') !== undefined) {
      void this.loadModel();
    }
    if (changed.has('rendererBackend') && changed.get('rendererBackend') !== undefined) {
      this._scheduleLazyAttach();
    }
  }

  orbitBy(deltaThetaDeg: number, deltaPhiDeg: number): void {
    this.cameraOrbitTheta = (this.cameraOrbitTheta + deltaThetaDeg) % 360;
    this.cameraOrbitPhi = Math.min(165, Math.max(15, this.cameraOrbitPhi + deltaPhiDeg));
    this._applyCameraSpherical();
    this.emitEvent('mth-camera-change', {
      detail: {
        theta: this.cameraOrbitTheta,
        phi: this.cameraOrbitPhi,
        distance: this.cameraDistance,
      },
    });
  }

  zoomBy(deltaDistance: number): void {
    this.cameraDistance = Math.min(40, Math.max(1, Number((this.cameraDistance + deltaDistance).toFixed(2))));
    this._applyCameraSpherical();
    this.emitEvent('mth-camera-change', {
      detail: {
        theta: this.cameraOrbitTheta,
        phi: this.cameraOrbitPhi,
        distance: this.cameraDistance,
      },
    });
  }

  resetCamera(): void {
    this.cameraOrbitTheta = 0;
    this.cameraOrbitPhi = 75;
    this.cameraDistance = 4;
    this._applyCameraSpherical();
    this._controls?.update();
    this.emitEvent('mth-camera-change', {
      detail: {
        theta: this.cameraOrbitTheta,
        phi: this.cameraOrbitPhi,
        distance: this.cameraDistance,
      },
    });
  }

  getAppliedToken(tokenName: string): string {
    this._syncTokens();
    return this._tokenCache.get(tokenName) ?? '';
  }

  async loadModel(): Promise<void> {
    if (!this.isConnected || this._disposed) return;
    if (!this.src) return;

    if (!isSafeUrl(this.src)) {
      this.error = this.t('invalidUrlError');
      this.loading = false;
      this.emitEvent('mth-model-error', { detail: { message: this.error } });
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const three = await this._ensureSceneGraph();
      if (this._disposed || !this.isConnected || !this._scene) return;

      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      if (this._disposed || !this.isConnected || !this._scene) return;

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(this.src.trim());
      if (this._disposed || !this.isConnected || !this._scene) return;

      if (this._modelGroup) {
        this._scene.remove(this._modelGroup);
      }
      this._modelGroup = gltf.scene;
      const box = new three.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new three.Vector3());
      gltf.scene.position.sub(center);
      this._scene.add(gltf.scene);

      this.loading = false;
      this.modelLoaded = true;
      this.emitEvent('mth-model-load', {
        detail: { src: this.src, backend: this._activeBackend },
      });
    } catch (err: unknown) {
      if (this._disposed) return;
      this.loading = false;
      const message = err instanceof Error ? err.message : String(err);
      this.error = message;
      this.emitEvent('mth-model-error', { detail: { message } });
    }
  }

  private async _ensureSceneGraph(): Promise<typeof THREE> {
    if (!this._threeMod) {
      this._threeMod = await import('three');
    }
    const three = this._threeMod;
    if (!this._scene) {
      const scene = new three.Scene();
      const ambient = new three.AmbientLight(0xffffff, 0.7);
      const directional = new three.DirectionalLight(0xffffff, 1.1);
      directional.position.set(5, 8, 5);
      scene.add(ambient, directional);
      this._scene = scene;
      this._applySceneBackground();
    }
    if (!this._camera) {
      this._camera = new three.PerspectiveCamera(45, 16 / 9, 0.1, 100);
      this._applyCameraSpherical();
    }
    return three;
  }

  private _applySceneBackground(): void {
    if (!this._scene || !this._threeMod) return;
    const bg = this._tokenCache.get('--mth-color-bg-subtle');
    if (bg && !bg.startsWith('oklch')) {
      try {
        this._scene.background = new this._threeMod.Color(bg);
      } catch {
        // Keep default scene background when custom CSS color syntax is unsupported by Three.Color
      }
    }
  }

  private _syncTokens(): void {
    if (typeof window === 'undefined' || !this.isConnected) return;
    const computed = window.getComputedStyle(this);
    for (const tokenName of MODEL_TOKEN_NAMES) {
      const value =
        computed.getPropertyValue(tokenName).trim() ||
        this.style.getPropertyValue(tokenName).trim();
      if (value) {
        this._tokenCache.set(tokenName, value);
      }
    }
    this._applySceneBackground();
  }

  private _initEngineHandle(): void {
    if (this._engine && !this._engine.disposed) return;

    let disposed = false;
    const getBackend = (): 'webgpu' | 'webgl' | 'headless' => this._activeBackend;
    const getScene = (): THREE.Scene | null => this._scene;
    const getCamera = (): THREE.PerspectiveCamera | null => this._camera;
    const getRenderer = (): MthModelRenderer | null => this._renderer;
    const getControls = (): OrbitControls | null => this._controls;
    const getEffectiveRotate = (): boolean => this.effectiveAutoRotate;
    const cleanup = (): void => this._teardownThreeResources();

    this._engine = {
      get backend() {
        return getBackend();
      },
      get scene() {
        return getScene();
      },
      get camera() {
        return getCamera();
      },
      get renderer() {
        return getRenderer();
      },
      get controls() {
        return getControls();
      },
      get effectiveAutoRotate() {
        return getEffectiveRotate();
      },
      orbitBy: (dTheta: number, dPhi: number) => this.orbitBy(dTheta, dPhi),
      zoomBy: (dDist: number) => this.zoomBy(dDist),
      resetCamera: () => this.resetCamera(),
      getAppliedToken: (tokenName: string) => this.getAppliedToken(tokenName),
      dispose: () => {
        if (disposed) return;
        disposed = true;
        cleanup();
      },
      get disposed() {
        return disposed;
      },
    };
  }

  private _scheduleLazyAttach(): void {
    if (this._attachTimer !== undefined || !this.isConnected) return;
    this._attachTimer = setTimeout(() => {
      this._attachTimer = undefined;
      void this._attachRendererAndControls();
    }, 0);
  }

  private async _attachRendererAndControls(): Promise<void> {
    if (this._disposed || !this.isConnected || !this.canvasEl) {
      return;
    }

    const three = await this._ensureSceneGraph();
    if (this._disposed || !this.isConnected || !this.canvasEl || !this._scene || !this._camera) {
      return;
    }

    const canTryWebGpu =
      (this.rendererBackend === 'webgpu' || this.rendererBackend === 'auto') &&
      typeof navigator !== 'undefined' &&
      'gpu' in navigator;

    let attachedRenderer: MthModelRenderer | null = null;
    if (canTryWebGpu) {
      try {
        const { WebGPURenderer } = await import('three/webgpu');
        const gpuRenderer = new WebGPURenderer({
          canvas: this.canvasEl,
          antialias: true,
          alpha: true,
        });
        await gpuRenderer.init();
        if (this._disposed || !this.isConnected) {
          gpuRenderer.dispose();
          return;
        }
        attachedRenderer = gpuRenderer;
        this._activeBackend = 'webgpu';
      } catch {
        attachedRenderer = null;
      }
    }

    if (!attachedRenderer) {
      try {
        const gl = this.canvasEl.getContext('webgl2') || this.canvasEl.getContext('webgl');
        if (gl) {
          const webglRenderer = new three.WebGLRenderer({
            canvas: this.canvasEl,
            context: gl,
            antialias: true,
            alpha: true,
          });
          webglRenderer.toneMapping = three.ACESFilmicToneMapping;
          webglRenderer.toneMappingExposure = this.exposure;
          attachedRenderer = webglRenderer;
          this._activeBackend = 'webgl';
        }
      } catch {
        attachedRenderer = null;
      }
    }

    if (!attachedRenderer) {
      this._activeBackend = 'headless';
      if (this.src) await this.loadModel();
      return;
    }

    this._renderer = attachedRenderer;

    try {
      const { OrbitControls: OrbitControlsCtor } = await import(
        'three/examples/jsm/controls/OrbitControls.js'
      );
      if (this._disposed || !this.isConnected) {
        attachedRenderer.dispose();
        return;
      }

      const controls = new OrbitControlsCtor(this._camera, this.canvasEl);
      controls.enableDamping = true;
      controls.autoRotate = this.effectiveAutoRotate;
      controls.autoRotateSpeed = this.autoRotateSpeed;
      this._controls = controls;
      this._resizeRenderer();
      this._startRenderLoop();

      if (this.src) await this.loadModel();
    } catch {
      this._activeBackend = 'headless';
    }
  }

  private _startRenderLoop(): void {
    if (typeof requestAnimationFrame !== 'function' || this._rafId !== 0) return;
    const tick = (): void => {
      if (this._disposed || !this._renderer || !this._scene || !this._camera) {
        this._rafId = 0;
        return;
      }
      if (this._controls) {
        this._controls.autoRotate = this.effectiveAutoRotate;
        this._controls.update();
      }
      this._renderer.render(this._scene, this._camera);
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  private _resizeRenderer(): void {
    if (!this._renderer || !this._camera || !this.viewportEl) return;
    const width = Math.max(1, this.viewportEl.clientWidth || 640);
    const height = Math.max(1, this.viewportEl.clientHeight || 360);
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(width, height, false);
  }

  private _applyCameraSpherical(): void {
    if (!this._camera) return;
    const phiRad = (this.cameraOrbitPhi * Math.PI) / 180;
    const thetaRad = (this.cameraOrbitTheta * Math.PI) / 180;
    const r = Math.max(0.5, this.cameraDistance);
    const x = r * Math.sin(phiRad) * Math.sin(thetaRad);
    const y = r * Math.cos(phiRad);
    const z = r * Math.sin(phiRad) * Math.cos(thetaRad);
    this._camera.position.set(x, y, z);
    this._camera.lookAt(0, 0, 0);
  }

  private _teardownThreeResources(): void {
    if (this._rafId !== 0 && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
    if (this._controls) {
      this._controls.dispose();
      this._controls = null;
    }
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer = null;
    }
    this._modelGroup = null;
    this._scene = null;
    this._camera = null;
  }

  private _disposeEngine(): void {
    this._engine?.dispose();
    this._engine = null;
  }

  private _onViewportKeydown = (event: KeyboardEvent): void => {
    const dirSign = this.resolvedDir === 'rtl' ? -1 : 1;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.orbitBy(-15 * dirSign, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.orbitBy(15 * dirSign, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.orbitBy(0, -10);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.orbitBy(0, 10);
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomBy(-0.5);
        break;
      case '-':
        event.preventDefault();
        this.zoomBy(0.5);
        break;
      case 'Home':
      case 'r':
      case '0':
        event.preventDefault();
        this.resetCamera();
        break;
      case ' ':
        event.preventDefault();
        this.autoRotate = !this.autoRotate;
        break;
    }
  };

  override render() {
    const label = this.ariaLabel || this.alt || this.t('viewerLabel');
    const safePoster = this.poster && isSafeUrl(this.poster) ? sanitizeUrl(this.poster) : '';

    return html`
      <div part="base" class="base" dir=${this.resolvedDir}>
        <div
          part="viewport"
          class="viewport"
          tabindex="0"
          role="region"
          aria-label=${label}
          @keydown=${this._onViewportKeydown}
        >
          <canvas part="canvas" class="canvas" aria-label=${label}></canvas>
          <img
            part="poster"
            class="poster"
            src=${safePoster}
            alt=${label}
            ?hidden=${safePoster.length === 0 || this.modelLoaded}
          />
          <div part="status" class="status" role="status" ?hidden=${!this.loading && !this.error}>
            ${this.error || this.t('loadingLabel')}
          </div>
        </div>

        <div
          part="controls"
          class="controls"
          role="toolbar"
          aria-label=${this.t('controlsLabel')}
          ?hidden=${!this.showControls}
        >
          <button
            type="button"
            aria-label=${this.t('zoomIn')}
            @click=${() => this.zoomBy(-0.5)}
          >
            +
          </button>
          <button
            type="button"
            aria-label=${this.t('zoomOut')}
            @click=${() => this.zoomBy(0.5)}
          >
            −
          </button>
          <button
            type="button"
            aria-pressed=${this.effectiveAutoRotate ? 'true' : 'false'}
            @click=${() => {
              this.autoRotate = !this.autoRotate;
            }}
          >
            ${this.t('toggleAutoRotate')}
          </button>
          <button
            type="button"
            @click=${() => this.resetCamera()}
          >
            ${this.t('resetCamera')}
          </button>
        </div>

        <div part="fallback" class="fallback">
          <slot name="fallback"></slot>
        </div>
      </div>
    `;
  }
}
