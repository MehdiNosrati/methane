# `@methane-ui/figma-sync`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Two-way **Figma Variables REST API** ↔ **W3C DTCG** design token synchronization (`oklch()` ↔ Figma sRGB `RGBA` with perceptual conversion) and multi-framework **`@figma/code-connect`** snippet generator for **Methane UI**.

## Internal Monorepo Package

This package is `"private": true` and is not published to npm. Within the monorepo, workspace packages reference it via `"workspace:^"` and root codegen runs it via `pnpm run codegen`.

## Exported API

| Symbol | Category | Description |
| --- | --- | --- |
| `dtcgToFigmaVariables(dtcg, options?)` | Token Sync | Converts W3C DTCG JSON (`@methane-ui/tokens`) into Figma Variables collections, modes (`light` / `dark`), and values |
| `figmaVariablesToDtcg(payload, options?)` | Token Sync | Converts Figma Variables REST API JSON responses back into W3C DTCG JSON with `com.methane.theme` extensions |
| `generateCodeConnectFiles(input, options?)` | Code Connect | Generates `.figma.ts` / `.figma.tsx` / Vue / Svelte / HTML `@figma/code-connect` definitions from component specs |
| `oklchToFigmaRgba(color)` / `figmaRgbaToOklchString(rgba)` / `parseOklchColor(str)` | Color Math | Lossless-intent perceptual OKLCH ↔ Figma `{ r, g, b, a }` sRGB conversion |

## Usage Examples

### Syncing W3C DTCG Tokens with Figma Variables

```ts
import { dtcgToFigmaVariables, figmaVariablesToDtcg } from '@methane-ui/figma-sync';
import dtcgSource from '@methane-ui/tokens/tokens.json' with { type: 'json' };

// Export Methane DTCG tokens -> Figma Variables REST API payload
const figmaPayload = dtcgToFigmaVariables(dtcgSource, {
  collectionName: 'Methane Tokens',
});

// Import updated Figma Variables response -> W3C DTCG JSON
const roundTrippedDtcg = figmaVariablesToDtcg(figmaPayload);
```

### Generating `@figma/code-connect` Files

```ts
import { generateCodeConnectFiles } from '@methane-ui/figma-sync';
import { loadWorkspaceManifestAndSpecs, normalizeManifest } from '@methane-ui/wrapper-codegen';

const { manifest, specs } = loadWorkspaceManifestAndSpecs(process.cwd());
const files = generateCodeConnectFiles(
  { models: normalizeManifest(manifest, specs) },
  { frameworks: ['react', 'vue', 'html'] },
);
```

## Notes

- Pure Node/TypeScript conversion utilities — pairs cleanly with Figma Variables API CI workflows and `@methane-ui/tokens`.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
