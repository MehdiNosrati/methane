# `@methane/media`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap-first media satellite components for **Methane UI** — `@lottiefiles/dotlottie-web` animation player (`<mth-lottie>`), interactive audio waveform scrubber (`<mth-waveform>`), and SVG vector image annotator with undo/redo (`<mth-image-annotator>`).

## Installation

```bash
pnpm add @methane/media @methane/core @methane/tokens
# or
npm install @methane/media @methane/core @methane/tokens
```

> **Peer dependency:** `@methane/core` (`^0.1.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane/media` | Auto-registers all 3 media elements and exports `registerAllComponents(prefix?)` |
| `@methane/media/<slug>` | Per-component tree-shakeable import (`lottie`, `waveform`, `image-annotator`) |
| `@methane/media/<slug>/element` | Unregistered classes, specs, styles, messages, and `registerMth*()` helpers |
| `@methane/media/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-lottie>` | `MthLottie` | `src`, `autoplay`, `loop`, `speed`, `playing`, `controls`, `disabled`, `label` | `mth-play`, `mth-pause`, `mth-stop`, `mth-error` |
| `<mth-waveform>` | `MthWaveform` | `src`, `playing`, `disabled`, `current-time`, `duration`, `bar-count`, `label`, `.peaks` | `mth-play`, `mth-pause`, `mth-seek`, `mth-error` |
| `<mth-image-annotator>` | `MthImageAnnotator` | `src`, `alt`, `tool` (`rect` \| `ellipse` \| `arrow` \| `text` \| `freehand`), `disabled`, `readonly`, `label`, `.annotations` | `mth-annotation-add`, `mth-annotation-change`, `mth-annotation-select`, `mth-tool-change` |

## Usage Examples

```html
<mth-waveform
  id="podcast-wave"
  src="/audio/episode-12.mp3"
  duration="184"
  bar-count="48"
  label="Episode 12 audio waveform"
></mth-waveform>

<mth-lottie src="/animations/success.lottie" autoplay loop controls></mth-lottie>
```

```ts
import '@methane/tokens/tokens.css';
import '@methane/media/waveform';
import '@methane/media/image-annotator';

const annotator = document.querySelector('mth-image-annotator')!;
annotator.addEventListener('mth-annotation-add', (ev) => {
  console.log('Added shape:', (ev as CustomEvent).detail);
});
```

## Theming, A11y & Security Notes

- **Theming**: Customize via `::part(base)`, `::part(controls)`, `::part(scrubber)`, `::part(bars)`, `::part(progress)`, `::part(stage)`, and `--mth-*` tokens.
- **Security**: Media `src` attributes reject unsafe `javascript:` / untrusted `data:` protocols via `@methane/sanitize`, and `<mth-image-annotator>` sanitizes text labels before SVG rendering.
- **Accessibility & Reduced Motion**: `<mth-waveform>` exposes slider/button keyboard controls (`ArrowLeft`/`ArrowRight` seeking); `<mth-lottie>` suppresses `autoplay` under `prefers-reduced-motion: reduce`.
- **SSR & Lazy Engine**: `DotLottie` and `AudioContext` / Web Audio decoding run lazily on client connect so SSR emits clean interactive shells.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
