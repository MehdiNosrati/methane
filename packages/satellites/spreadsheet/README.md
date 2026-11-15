# `@methane/spreadsheet`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Virtualized spreadsheet grid (`<mth-spreadsheet>`) and synchronized formula bar (`<mth-formula-bar>`) with a clean-room MIT Formula AST evaluator supporting arithmetic, cell/range references, built-in aggregation functions, and circular dependency detection.

## Installation

```bash
pnpm add @methane/spreadsheet @methane/core @methane/tokens
# or
npm install @methane/spreadsheet @methane/core @methane/tokens
```

> **Peer dependency:** `@methane/core` (`^0.1.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane/spreadsheet` | Auto-registers `<mth-spreadsheet>` and `<mth-formula-bar>` and exports `registerAllComponents(prefix?)` |
| `@methane/spreadsheet/spreadsheet` / `@methane/spreadsheet/formula-bar` | Per-component tree-shakeable entrypoints |
| `@methane/spreadsheet/*/element` | Unregistered classes, specs, styles, messages, and `registerMth*()` |
| `@methane/spreadsheet/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-spreadsheet>` | `MthSpreadsheet` | `rows`, `cols`, `address-mode` (`A1` \| `R1C1`), `active-cell`, `row-height`, `readonly`, `label`, `.cells` | `mth-cell-select`, `mth-cell-change` |
| `<mth-formula-bar>` | `MthFormulaBar` | `name`, `value`, `cell-address`, `placeholder`, `disabled`, `required`, `readonly`, `label` | `mth-formula-input`, `mth-formula-commit` |

## Usage Examples

```html
<mth-formula-bar id="fx" cell-address="A1"></mth-formula-bar>
<mth-spreadsheet id="sheet" rows="25" cols="10" label="Quarterly Budget"></mth-spreadsheet>
```

```ts
import '@methane/tokens/tokens.css';
import '@methane/spreadsheet';

const sheet = document.getElementById('sheet') as any;
const fx = document.getElementById('fx') as any;

sheet.cells = {
  A1: '1200',
  A2: '850',
  A3: '=SUM(A1:A2)',
  A4: '=AVG(A1:A2)',
};

sheet.addEventListener('mth-cell-select', (ev: CustomEvent) => {
  fx.cellAddress = ev.detail.address;
  fx.value = ev.detail.raw;
});

fx.addEventListener('mth-formula-commit', (ev: CustomEvent) => {
  sheet.commitCellValue(ev.detail.cellAddress || sheet.activeCell, ev.detail.value);
});
```

## Formula Engine & Features

- **Supported Syntax**: Arithmetic (`+`, `-`, `*`, `/`, unary `-`, parentheses), comparisons (`=`, `<>`, `<`, `<=`, `>`, `>=`), cell refs (`A1`, lowercase `a1`), and range refs (`A1:B10`).
- **Built-in Functions**: `SUM`, `AVERAGE` / `AVG`, `MIN`, `MAX`, `COUNT`, `IF`, `ROUND`, `ABS`, `CONCAT`.
- **Error Reporting**: Returns explicit `#CYCLE!` for circular dependency chains, `#DIV/0!`, `#VALUE!`, `#REF!`, and `#ERROR!` for invalid syntax.

## Theming, A11y & SSR Notes

- **Theming**: Style cells, column/row headers, active editor input, and formula bar via `::part(base)`, `::part(grid)`, `::part(header)`, `::part(cell)`, `::part(editor)`, `::part(fx)`, and `--mth-*` tokens.
- **Accessibility & Keyboard**: `RovingFocusController` powers `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight` grid traversal; `Enter`/`F2` enters edit mode, `Enter` commits, `Escape` cancels, and `Tab` advances horizontally while respecting `readonly`.
- **SSR**: Evaluates formulas and cell markup deterministically in pure TypeScript without browser canvas dependencies.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
