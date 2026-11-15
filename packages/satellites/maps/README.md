# `@methane-ui/maps`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Spatial mapping, route visualization, GeoJSON drawing, clustering, indoor floor plans, location pickers, and venue seat maps for **Methane UI** — wrapping `maplibre-gl` with accessible SVG spatial layers and FACE form integration.

## Installation

```bash
pnpm add @methane-ui/maps @methane-ui/core @methane-ui/tokens
# or
npm install @methane-ui/maps @methane-ui/core @methane-ui/tokens
```

> **Peer dependency:** `@methane-ui/core` (`^0.1.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane-ui/maps` | Auto-registers all 7 map/spatial elements and exports `registerAllComponents(prefix?)` |
| `@methane-ui/maps/<slug>` | Per-component tree-shakeable import (e.g. `@methane-ui/maps/map`, `@methane-ui/maps/seat-map`) |
| `@methane-ui/maps/<slug>/element` | Unregistered component class, spec, styles, messages, and `registerMth*()` |
| `@methane-ui/maps/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-map>` | `MthMap` | `center-lat`, `center-lng`, `zoom`, `min-zoom`, `max-zoom`, `bearing`, `pitch`, `interactive`, `.markers` | `mth-map-move`, `mth-marker-select` |
| `<mth-map-cluster>` | `MthMapCluster` | `radius`, `zoom`, `max-zoom`, `label`, `.points` | `mth-cluster-expand`, `mth-cluster-select` |
| `<mth-map-draw>` | `MthMapDraw` | `mode`, `label`, `disabled`, `.features` | `mth-draw-change`, `mth-draw-mode` |
| `<mth-map-route>` | `MthMapRoute` | `unit`, `label`, `.waypoints` | `mth-route-fit`, `mth-waypoint-select` |
| `<mth-location-picker>` | `MthLocationPicker` | `name`, `value`, `default-value`, `label`, `step`, `required`, `disabled`, `readonly` | `input`, `change`, `mth-location-select` |
| `<mth-floor-plan>` | `MthFloorPlan` | `level`, `zoom`, `pan-x`, `pan-y`, `multiple`, `label`, `.rooms` | `mth-room-select`, `mth-floor-zoom` |
| `<mth-seat-map>` | `MthSeatMap` | `name`, `value`, `default-value`, `columns`, `multiple`, `required`, `disabled`, `readonly`, `.seats` | `input`, `change`, `mth-seat-select` |

## Usage Examples

```html
<mth-map id="city-map" center-lat="37.7749" center-lng="-122.4194" zoom="12" interactive></mth-map>
<mth-location-picker name="dropoff" label="Delivery pin" required></mth-location-picker>
```

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/maps/map';
import '@methane-ui/maps/location-picker';

const map = document.getElementById('city-map') as any;
map.markers = [{ id: 'hq', lat: 37.7749, lng: -122.4194, label: 'Headquarters' }];
```

## Theming, A11y & Lazy-Engine Notes

- **Theming**: Expose `::part(base)`, `::part(canvas)`, `::part(controls)`, `::part(marker)`, `::part(seat)`, and `--mth-*` styling variables.
- **Accessibility**: Interactive markers, floor-plan rooms, and seats expose keyboard focus navigation and ARIA labels; `<mth-location-picker>` and `<mth-seat-map>` implement full FACE form validation.
- **SSR & Lazy Engine**: `maplibre-gl` initializes lazily on the client while SVG/coordinate readouts render cleanly during SSR.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
