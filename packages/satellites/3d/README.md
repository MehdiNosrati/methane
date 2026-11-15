# `@methane/3d`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap-first **Three.js** lazy WebGL/WebGPU 3D model viewer (`<mth-model-viewer>`) for **Methane UI** — featuring progressive poster fallback, orbital camera controls, keyboard orbit adjustments, URL validation, and deterministic GPU resource disposal on disconnect.

## Installation

```bash
pnpm add @methane/3d @methane/core @methane/tokens
# or
npm install @methane/3d @methane/core @methane/tokens
```

> **Peer dependency:** `@methane/core` (`^0.1.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane/3d` | Auto-registers `<mth-model-viewer>` and exports `MthModelViewer` & `registerAllComponents(prefix?)` |
| `@methane/3d/model-viewer` | Per-component auto-registering entrypoint |
| `@methane/3d/model-viewer/element` | Unregistered `MthModelViewer`, spec, styles, messages, and `registerMthModelViewer(prefix?)` |
| `@methane/3d/custom-elements.json` | Custom Elements Manifest (CEM) |

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
import '@methane/tokens/tokens.css';
import '@methane/3d/model-viewer';

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
