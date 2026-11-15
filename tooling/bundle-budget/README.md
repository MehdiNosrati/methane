# `@methane-ui/bundle-budget`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Cold standalone and marginal gzip/brotli bundle budget analyzer for **Methane UI** — bundling entrypoints with `esbuild`, compressing via Node's `zlib.brotliCompressSync` / `gzipSync`, and formatting CI Markdown budget reports.

## Installation

```bash
pnpm add -D @methane-ui/bundle-budget
# or
npm install -D @methane-ui/bundle-budget
```

## Exported API

| Symbol | Description |
| --- | --- |
| `measureBundleBytes(entryPoint, options?)` | Bundles `entryPoint` with `esbuild` and returns `{ rawBytes, gzipBytes, brotliBytes }` |
| `measureComponentBudget(target)` | Measures both **cold** (standalone) and **marginal** (with `DEFAULT_SHARED_EXTERNALS` excluded) byte sizes against budget limits |
| `checkBundleBudgets(targets)` | Runs `measureComponentBudget` across all targets and produces `{ passed, results, markdown }` |
| `formatBundleBudgetMarkdown(results)` | Formats a GitHub-flavored Markdown comparison table suitable for PR comments |
| `compressSizes(buffer)` | Computes raw, gzip, and brotli sizes for any `Uint8Array` |
| `DEFAULT_SHARED_EXTERNALS` | Shared core externals (`lit`, `@methane-ui/core`, `@methane-ui/primitives`, `@methane-ui/tokens`, `@methane-ui/sanitize`, `@lit/context`) |

## Usage Examples

```ts
import { checkBundleBudgets, DEFAULT_SHARED_EXTERNALS } from '@methane-ui/bundle-budget';

const report = await checkBundleBudgets([
  {
    name: '@methane-ui/ui/button',
    entryPoint: 'packages/ui/dist/components/button/index.js',
    sharedExternals: DEFAULT_SHARED_EXTERNALS,
    maxMarginalBrotliBytes: 4096,
  },
  {
    name: '@methane-ui/ui/dialog',
    entryPoint: 'packages/ui/dist/components/dialog/index.js',
    sharedExternals: DEFAULT_SHARED_EXTERNALS,
    maxMarginalBrotliBytes: 8192,
  },
]);

console.log(report.markdown);
if (!report.passed) {
  process.exitCode = 1;
}
```

## Notes

- Built on `esbuild` and Node built-in `node:zlib` for deterministic cross-platform CI measurements without browser overhead.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
