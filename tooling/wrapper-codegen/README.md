# `@methane-ui/wrapper-codegen`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Custom Elements Manifest (`custom-elements.json`) + `ComponentBehaviorSpec` multi-framework code generator (`methane-wrapper-codegen`) producing typed **React 19/18**, **Vue 3**, **Angular 17+**, **Svelte 5**, and **IDE custom-data metadata** from a single canonical source.

## Installation

```bash
pnpm add -D @methane-ui/wrapper-codegen
# or
npm install -D @methane-ui/wrapper-codegen
```

## Package Exports & CLI Binary

| Export / Binary | Purpose |
| --- | --- |
| `methane-wrapper-codegen` (CLI bin) | Generates wrappers from workspace CEMs/specs or custom `--cem` / `--specs` inputs |
| `generateAllWrappers(input, options?)` | Runs all 5 generators (`React`, `Vue`, `Angular`, `Svelte`, `IDE`) and optionally writes outputs to disk |
| `generateReactFiles` / `generateVueFiles` / `generateAngularFiles` / `generateSvelteFiles` / `generateIdeFiles` | Target-specific file generators |
| `loadWorkspaceManifestAndSpecs(rootDir)` / `hasWorkspaceManifests(rootDir)` | Aggregates `custom-elements.json` and `*.spec.*` definitions across workspace packages |
| `normalizeManifest(manifest, specs)` | Produces canonical `NormalizedComponentModel` definitions for downstream generators |

## CLI Reference

```bash
methane-wrapper-codegen [options]
```

| Flag | Description |
| --- | --- |
| `--workspace` | Discover and aggregate all workspace package CEMs & behavior specs |
| `--cem <path>` | Path to a specific `custom-elements.json` file |
| `--specs <path>` | Path to a JSON array of `ComponentBehaviorSpec` definitions |
| `--root <dir>` | Workspace root directory (defaults to `process.cwd()`) |
| `--dry-run` | Compute generated output in memory without writing files to disk |

## Usage Examples

```bash
# Regenerate @methane-ui/react, @methane-ui/vue, @methane-ui/angular, @methane-ui/svelte, and IDE files across the monorepo
npx methane-wrapper-codegen --workspace

# Dry-run verification in CI
npx methane-wrapper-codegen --workspace --dry-run
```

```ts
import { generateAllWrappers, loadWorkspaceManifestAndSpecs } from '@methane-ui/wrapper-codegen';

const { manifest, specs } = loadWorkspaceManifestAndSpecs(process.cwd());
const output = generateAllWrappers({ manifest, specs }, { write: false });
console.log(`Normalized ${output.models.length} components`);
```

## Notes

- Generates `@methane-ui/react` (`.`, `./legacy`), `@methane-ui/vue`, `@methane-ui/angular`, `@methane-ui/svelte`, and VS Code / JetBrains HTML custom-data files (`tooling/wrapper-codegen/ide`).

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
