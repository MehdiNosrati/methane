import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { modelViewerMessages } from './model-viewer.messages.js';

export const modelViewerSpec: ComponentBehaviorSpec = {
  tag: 'mth-model-viewer',
  package: '@methane/3d',
  conformance: ['satellite'],
  controllers: ['MotionController', 'ObserverPoolController'],
  focusModel: 'delegates-focus',
  states: ['loading', 'error', 'loaded', 'auto-rotating', 'reduced-motion'],
  keyboard: [
    { key: 'ArrowLeft', dir: 'ltr', when: '3D viewport is focused', expect: 'orbits camera left' },
    { key: 'ArrowRight', dir: 'ltr', when: '3D viewport is focused', expect: 'orbits camera right' },
    { key: 'ArrowUp', when: '3D viewport is focused', expect: 'tilts camera upward' },
    { key: 'ArrowDown', when: '3D viewport is focused', expect: 'tilts camera downward' },
    { key: '+', when: '3D viewport is focused', expect: 'zooms camera closer' },
    { key: '-', when: '3D viewport is focused', expect: 'zooms camera farther' },
    { key: 'Home', when: '3D viewport is focused', expect: 'resets camera orbit and distance' },
  ],
  props: [
    { name: 'src', attr: 'src', type: 'string', default: '' },
    { name: 'poster', attr: 'poster', type: 'string', default: '' },
    { name: 'alt', attr: 'alt', type: 'string', default: '' },
    { name: 'rendererBackend', attr: 'renderer-backend', type: "'auto' | 'webgl' | 'webgpu'", default: 'auto' },
    { name: 'autoRotate', attr: 'auto-rotate', type: 'boolean', default: false },
    { name: 'autoRotateSpeed', attr: 'auto-rotate-speed', type: 'number', default: 2 },
    { name: 'cameraOrbitTheta', attr: 'camera-orbit-theta', type: 'number', default: 0 },
    { name: 'cameraOrbitPhi', attr: 'camera-orbit-phi', type: 'number', default: 75 },
    { name: 'cameraDistance', attr: 'camera-distance', type: 'number', default: 4 },
    { name: 'exposure', attr: 'exposure', type: 'number', default: 1 },
    { name: 'showControls', attr: 'show-controls', type: 'boolean', default: true },
    { name: 'loading', attr: 'loading', type: 'boolean', default: false },
    { name: 'error', attr: 'error', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-model-load', cancelable: false, detailType: "{ src: string; backend: 'webgpu' | 'webgl' | 'headless' }" },
    { name: 'mth-camera-change', cancelable: false, detailType: '{ theta: number; phi: number; distance: number }' },
    { name: 'mth-model-error', cancelable: false, detailType: '{ message: string }' },
  ],
  slots: [
    { name: 'fallback', description: 'Accessible fallback content shown when 3D rendering is unavailable.' },
  ],
  parts: [
    { name: 'base', description: 'Outer 3D viewer frame.' },
    { name: 'viewport', description: 'Focusable 3D viewport container.' },
    { name: 'canvas', description: 'WebGL/WebGPU canvas surface.' },
    { name: 'poster', description: 'Optional poster preview image.' },
    { name: 'controls', description: 'Accessible camera orbit/zoom/reset controls.' },
    { name: 'status', description: 'Loading or error status region.' },
    { name: 'fallback', description: 'Slotted fallback container.' },
  ],
  messages: modelViewerMessages,
};

export const CEM_METADATA = {
  description:
    'Wrap-first Three.js `<mth-model-viewer>` component featuring lazy WebGL/WebGPU renderer attachment, keyboard orbit/zoom/reset controls, MotionController reduced-motion gating on `autoRotate`, URL sanitization, and poster/fallback slots.',
  propDescriptions: {
    src: 'glTF/GLB model URL (validated with @methane/sanitize isSafeUrl).',
    poster: 'Optional preview poster image URL shown until the 3D scene loads.',
    alt: 'Accessible description of the 3D model.',
    rendererBackend: 'Preferred Three.js rendering backend (`auto`, `webgl`, or `webgpu`).',
    autoRotate: 'Enables continuous camera turntable rotation (disabled automatically under prefers-reduced-motion: reduce).',
    autoRotateSpeed: 'Turntable rotation speed multiplier.',
    cameraOrbitTheta: 'Horizontal camera azimuth angle in degrees.',
    cameraOrbitPhi: 'Vertical camera polar angle in degrees.',
    cameraDistance: 'Camera orbit distance from origin.',
    exposure: 'Tone-mapping exposure multiplier.',
    showControls: 'Shows interactive accessible camera toolbar controls.',
    loading: 'Indicates active model/renderer loading.',
    error: 'Error message when model load or URL validation fails.',
  },
  eventDescriptions: {
    'mth-model-load': 'Emitted when the Three.js model finishes loading.',
    'mth-camera-change': 'Emitted when camera orbit or zoom updates.',
    'mth-model-error': 'Emitted when model URL validation or glTF load fails.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Surface background color.' },
    { name: '--mth-color-surface-raised', description: 'Controls bar background color.' },
    { name: '--mth-color-bg-subtle', description: 'Viewport background color.' },
    { name: '--mth-color-fg', description: 'Foreground text color.' },
    { name: '--mth-color-fg-muted', description: 'Muted status/fallback text color.' },
    { name: '--mth-color-border', description: 'Border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring color.' },
    { name: '--mth-color-accent', description: 'Active toggle button background color.' },
    { name: '--mth-color-accent-fg', description: 'Active toggle button text color.' },
  ],
};
