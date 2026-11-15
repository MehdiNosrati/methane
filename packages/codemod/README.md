# `@methane/codemod`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Idempotent AST codemod CLI (`methane-codemod`) and programmatic migration runner for transforming custom element tag prefixes, CSS `--mth-*` tokens, attributes, slots, and React/HTML event names across HTML, TypeScript/TSX/JSX, and CSS files.

## Installation

```bash
pnpm add -D @methane/codemod typescript
# or
npm install -D @methane/codemod typescript
```

> **Peer dependency:** `typescript >= 5.0.0` is required for TypeScript/TSX/JSX AST transformations.

## Package Exports & CLI Binary

| Export / Binary | Purpose |
| --- | --- |
| `methane-codemod` (CLI bin) | Interactive/CI codemod CLI (`npx methane-codemod ...`) |
| `@methane/codemod` | Full runner, manifest compiler, unified diff generator, and per-language AST transforms (`runCodemod`, `transformCode`, `createPrefixManifest`, `createUnifiedDiff`, `transformHtml`, `transformTypeScript`, `transformCss`) |
| `@methane/codemod/cli` | Programmatic CLI entry (`runCli`, `parseCliArgs`, `CLI_VERSION`) |
| `@methane/codemod/manifest` | Manifest schema parser and validator (`parseMigrationManifest`, `compileManifest`, `validateMigrationManifest`, `createPrefixManifest`, `toReactEventPropName`) |

## CLI Reference

```bash
methane-codemod [options] <paths...>
```

| Flag | Description |
| --- | --- |
| `-m, --manifest <file>` | Path to a JSON `MigrationManifest` file |
| `--from-prefix <prefix>` | Source element tag prefix (default: `"mth-"`) |
| `--to-prefix <prefix>` | Target element tag prefix (e.g. `"acme-"`) |
| `--from-token-prefix <pref>` | Source CSS custom property prefix (default: `"--mth-"`) |
| `--to-token-prefix <pref>` | Target CSS custom property prefix (e.g. `"--acme-"`) |
| `-d, --dry-run` | Preview unified diffs without writing files |
| `--check` | Exit with code `1` if any file would change (implies `--dry-run`) |
| `--json` | Emit machine-readable JSON `CodemodRunReport` instead of human diff output |
| `-h, --help` | Show CLI usage help |
| `-v, --version` | Show CLI version |

## Usage Examples

### White-Labeling Tag & Token Prefixes in One Command

```bash
# Preview changes across src/ without writing
npx methane-codemod --to-prefix acme- --to-token-prefix --acme- --dry-run src/

# CI check (exits 1 if unmigrated tags/tokens remain)
npx methane-codemod --manifest ./migrations/v2.json --check src/
```

### Applying a Version Migration Manifest Programmatically

```ts
import { runCodemod, parseMigrationManifest } from '@methane/codemod';

const manifest = parseMigrationManifest(JSON.stringify({
  version: '2.0.0',
  tagPrefix: { from: 'mth-', to: 'acme-' },
  tokenPrefix: { from: '--mth-', to: '--acme-' },
  tagRenames: [{ from: 'mth-drawer-panel', to: 'mth-drawer' }],
  attributeRenames: [{ tag: 'mth-button', from: 'kind', to: 'variant' }],
  eventRenames: [{ tag: 'mth-dialog', from: 'mth-hide', to: 'mth-close' }],
}));

const report = await runCodemod(['src'], {
  manifest,
  dryRun: false,
});
console.log(`Updated ${report.changedFiles}/${report.scannedFiles} files.`);
```

## Notes

- **Idempotent by Design**: Running `methane-codemod` twice produces zero further diffs on the second pass.
- **Language Support**: Handles `.html`, `.htm`, `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`, `.css`, `.scss`, and custom extension filters via `DEFAULT_EXTENSIONS`.
- **Node / CI Execution**: Pure Node.js AST pipeline (no browser runtime required).

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
