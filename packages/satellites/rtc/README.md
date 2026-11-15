# `@methane/rtc`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap-first WebRTC, `navigator.mediaDevices`, `getDisplayMedia`, and `MediaRecorder` satellite components for **Methane UI** — audio recorder with live level meter, camera snapshot/stream capture, screen recorder, and multi-participant video grid.

## Installation

```bash
pnpm add @methane/rtc @methane/core @methane/tokens
# or
npm install @methane/rtc @methane/core @methane/tokens
```

> **Peer dependency:** `@methane/core` (`^0.1.0 || ^1.0.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane/rtc` | Auto-registers all 4 RTC elements and exports `registerAllComponents(prefix?)` |
| `@methane/rtc/<slug>` | Per-component tree-shakeable import (e.g. `@methane/rtc/video-grid`) |
| `@methane/rtc/<slug>/element` | Unregistered component class, spec, styles, messages, and `registerMth*()` |
| `@methane/rtc/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-audio-recorder>` | `MthAudioRecorder` | `mime-type`, `max-duration`, `disabled`, `label` | `mth-state-change`, `mth-record-complete`, `mth-level`, `mth-error` |
| `<mth-camera-capture>` | `MthCameraCapture` | `facing-mode`, `device-id`, `mime-type`, `quality`, `disabled`, `label` | `mth-capture`, `mth-permission-change`, `mth-device-change`, `mth-error` |
| `<mth-screen-recorder>` | `MthScreenRecorder` | `system-audio`, `mime-type`, `disabled`, `label` | `mth-state-change`, `mth-record-complete`, `mth-error` |
| `<mth-video-grid>` | `MthVideoGrid` | `layout` (`grid` \| `spotlight`), `pinned-id`, `active-speaker-id`, `columns`, `label`, `.participants` | `mth-pin-change`, `mth-layout-change` |

## Usage Examples

```html
<mth-audio-recorder id="voice-note" max-duration="60" label="Record voice note"></mth-audio-recorder>
<mth-video-grid id="call-grid" layout="grid" columns="2"></mth-video-grid>
```

```ts
import '@methane/tokens/tokens.css';
import '@methane/rtc/audio-recorder';
import '@methane/rtc/video-grid';

document.getElementById('voice-note')?.addEventListener('mth-record-complete', (ev) => {
  const { blob, duration } = (ev as CustomEvent<{ blob: Blob; duration: number }>).detail;
  console.log('Recorded clip:', blob.size, duration);
});
```

## Theming, A11y & Browser Permission Notes

- **Theming**: Style meters, tiles, and controls via `::part(base)`, `::part(controls)`, `::part(meter)`, `::part(timer)`, `::part(tile)`, `::part(stage)`, and `--mth-*` tokens.
- **Accessibility**: Toolbar buttons support `RovingFocusController` keyboard navigation and screen-reader status announcements on recording/permission changes.
- **Browser Safety & Cleanup**: `disconnectedCallback()` automatically stops active `MediaStream` tracks and `MediaRecorder` instances. Permission denials and missing media APIs surface via `mth-error` rather than uncaught rejections; SSR outputs static disabled/ready controls cleanly.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
