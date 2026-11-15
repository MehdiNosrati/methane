# `@methane-ui/3d`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap-first **Three.js** lazy WebGL/WebGPU 3D model viewer (`<mth-model-viewer>`) for **Methane UI** — featuring progressive poster fallback, orbital camera controls, keyboard orbit adjustments, URL validation, and deterministic GPU resource disposal on disconnect.

## Installation

```bash
pnpm add @methane-ui/3d @methane-ui/core @methane-ui/tokens
# or
npm install @methane-ui/3d @methane-ui/core @methane-ui/tokens
```

> **Peer dependency:** `@methane-ui/core` (`^0.1.2`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane-ui/3d` | Tree-shakeable barrel re-exporting component classes, styles, messages, `registerMth*` helpers, and `registerAllComponents(prefix?)` without side effects |
| `@methane-ui/3d/define` | Side-effect entrypoint that auto-registers all 3d custom elements and exports `registerAllComponents` |
| `@methane-ui/3d/model-viewer` | Per-component auto-registering entrypoint |
| `@methane-ui/3d/model-viewer/element` | Unregistered `MthModelViewer`, styles, messages, and `registerMthModelViewer(prefix?)` |
| `@methane-ui/3d/custom-elements.json` | Custom Elements Manifest (CEM) |

## Component API (`<mth-model-viewer>`)

| Prop / Attribute | Type | Description |
| --- | --- | --- |
| `src` | `string` | Safe URL to a glTF / GLB asset |
| `poster` | `string` | Poster image URL displayed before WebGL mount or when WebGL is unavailable |
| `alt` | `string` | Accessible alternative description for the 3D scene |
| `renderer-backend` | `'webgl' \| 'webgpu' \| 'auto'` | Preferred rendering backend |
| `auto-rotate` | `boolean` | Enables continuous orbital turntable rotation |
| `auto-rotate-speed` | `number` | Rotation speed multiplier |
| `camera-orbit-theta` | `number` | Horizontal azimuth angle (degrees) |
| `camera-orbit-phi` | `number` | Polar elevation angle (degrees) |
| `camera-distance` | `number` | Camera radius from target |
| `exposure` | `number` | Tone-mapping exposure value |
| `show-controls` | `boolean` | Displays built-in orbit reset / auto-rotate toolbar |

**Events:** `mth-model-load`, `mth-camera-change`, `mth-model-error`.

## Usage Examples

```html
<mth-model-viewer
  src="/models/chassis.glb"
  poster="/models/chassis-poster.webp"
  alt="Interactive 3D chassis assembly"
  auto-rotate
  show-controls
  exposure="1.1"
></mth-model-viewer>
```

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/3d/model-viewer';

const viewer = document.querySelector('mth-model-viewer')!;
viewer.addEventListener('mth-camera-change', (ev) => {
  console.log('Camera:', (ev as CustomEvent).detail);
});
```

## Theming, A11y & Lazy-Engine Notes

- **Theming**: Style slots and controls via `::part(base)`, `::part(viewport)`, `::part(canvas)`, `::part(poster)`, `::part(controls)`, `::part(status)`, and `--mth-*` tokens.
- **Accessibility & Keyboard**: Exposes `alt` labeling on the interactive stage and supports arrow-key orbit adjustments + `prefers-reduced-motion` suppression of `auto-rotate`.
- **SSR & Resource Lifecycle**: SSR emits the accessible `poster` and `alt` fallback with zero WebGL calls. When WebGL is unavailable in headless/constrained browsers, falls back gracefully to the poster state without throwing. `disconnectedCallback()` cancels animation frames and disposes Three.js geometries, materials, and renderers.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
