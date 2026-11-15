# `@methane/charts`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap-first Apache ECharts (`echarts`) declarative data visualization Web Components for **Methane UI** — featuring lazy client-side engine mounting, accessible `fallback` table/summary toggle, and reactive CSS custom property theme adaptation.

## Installation

```bash
pnpm add @methane/charts @methane/core @methane/tokens
# or
npm install @methane/charts @methane/core @methane/tokens
```

> **Peer dependency:** `@methane/core` (`^0.1.0 || ^1.0.0`) is required. Bundles `echarts` as a lazy runtime dependency so SSR and core bundles stay lightweight.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane/charts` | Registers `<mth-chart>` and `<mth-chart-series>` and exports `registerAllComponents(prefix?)` |
| `@methane/charts/chart` / `@methane/charts/chart-series` | Per-component tree-shakeable entrypoints |
| `@methane/charts/*/element` | Unregistered component classes and `registerMth*()` helpers |
| `@methane/charts/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-chart>` | `MthChart` | `chart-title`, `subtitle`, `type`, `renderer` (`svg` \| `canvas`), `size`, `show-legend`, `show-tooltip`, `show-fallback`, `categories-json`, `data-json`, `loading`, `empty`, `.option`, `.data`, `.categories` | `mth-chart-ready`, `mth-chart-render`, `mth-point-select` |
| `<mth-chart-series>` | `MthChartSeries` | `name`, `type`, `data-json`, `stack`, `color`, `smooth`, `hidden`, `x-axis-index`, `y-axis-index`, `.data` | `mth-series-change` |

## Usage Examples

### Declarative HTML & Slotted Fallback Table

```html
<mth-chart
  chart-title="Quarterly Revenue"
  subtitle="USD (thousands)"
  type="bar"
  renderer="svg"
  categories-json='["Q1","Q2","Q3","Q4"]'
  show-legend
>
  <mth-chart-series name="2025" data-json="[120, 145, 162, 198]"></mth-chart-series>
  <mth-chart-series name="2026" data-json="[138, 170, 190, 230]"></mth-chart-series>

  <table slot="fallback">
    <thead><tr><th>Quarter</th><th>2025</th><th>2026</th></tr></thead>
    <tbody><tr><td>Q1</td><td>120</td><td>138</td></tr></tbody>
  </table>
</mth-chart>
```

### Programmatic ECharts Option Override

```ts
import '@methane/tokens/tokens.css';
import '@methane/charts';

const chart = document.querySelector('mth-chart')!;
chart.addEventListener('mth-chart-ready', (ev) => {
  console.log('Engine initialized:', (ev as CustomEvent).detail);
});
```

## Theming, A11y & SSR Lazy-Engine Notes

- **Theming**: Exposes `::part(base)`, `::part(header)`, `::part(title)`, `::part(subtitle)`, `::part(toggle)`, `::part(canvas)`, `::part(fallback)`, and `::part(status)`, adapting ECharts palette/axis colors to `--mth-*` tokens.
- **Accessibility**: Renders `role="img"` on the canvas container alongside an accessible `fallback` slot and toggle button (`aria-expanded`) for screen-reader and keyboard access to underlying data tables.
- **SSR & Lazy Engine**: Never executes `echarts.init()` on the server; renders the header, loading/empty status, and accessible `fallback` slot via Declarative Shadow DOM and initializes ECharts lazily after connect.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
