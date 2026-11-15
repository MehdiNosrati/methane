# `@methane/spec-compiler`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Single-source `ComponentBehaviorSpec` validator, Markdown documentation compiler, test-assertion generator, Custom Elements Manifest (CEM) verifier, and WAI-ARIA checklist builder for **Methane UI**.

## Installation

```bash
pnpm add -D @methane/spec-compiler
# or
npm install -D @methane/spec-compiler
```

## Exported API

| Symbol | Description |
| --- | --- |
| `validateBehaviorSpec(spec)` | Validates schema integrity (`tagName`, props, events, parts, slots, keyboard bindings, focus model, conformance suites) |
| `assertValidBehaviorSpec(spec)` | Throws descriptive errors when a `ComponentBehaviorSpec` fails validation |
| `compileSpec(spec, cem?)` | Produces full `CompiledSpecArtifacts` (docs Markdown, test code scaffold, CEM verification, and a11y checklist) |
| `compileSpecDocs(spec)` | Generates structured API documentation Markdown from a component spec |
| `compileSpecTests(spec, options?)` | Emits Vitest conformance test scaffolding targeting `@methane/test-conformance` suites |
| `compileA11yChecklist(spec)` | Produces a structured `A11yChecklist` covering focus model, keyboard bindings, and ARIA contracts |
| `verifyCustomElementsManifest(spec, cem)` | Cross-checks spec declarations against `custom-elements.json` to catch drift |
| `runBehaviorSpecAssertions(spec, adapter)` | Executes runtime spec contract assertions directly inside Vitest suites |

## Usage Examples

### Defining & Testing a `ComponentBehaviorSpec`

```ts
import { assertValidBehaviorSpec, runBehaviorSpecAssertions, type ComponentBehaviorSpec } from '@methane/spec-compiler';

export const buttonSpec: ComponentBehaviorSpec = {
  tagName: 'mth-button',
  className: 'MthButton',
  focusModel: 'roving-or-native',
  props: [{ name: 'variant', type: 'string', defaultValue: 'default' }],
  events: [{ name: 'mth-click', detailType: 'void' }],
  parts: [{ name: 'base', description: 'Inner button element' }],
  keyboard: [{ key: 'Enter', description: 'Activates the button' }],
};

assertValidBehaviorSpec(buttonSpec);
```

### Verifying `custom-elements.json` Drift in CI

```ts
import { verifyCustomElementsManifest } from '@methane/spec-compiler';
import cem from '@methane/ui/custom-elements.json' with { type: 'json' };
import { buttonSpec } from './button.spec.js';

const result = verifyCustomElementsManifest(buttonSpec, cem);
if (!result.valid) {
  throw new Error(result.issues.map((i) => i.message).join('\n'));
}
```

## Notes

- Integrates with `@methane/test-conformance` (`FormControlSuite`, `OverlaySuite`, `RovingFocusSuite`, `ListboxSuite`, `DataConsumerSuite`, `SatelliteEngineSuite`, `HydrationPuritySuite`) and powers `@methane/wrapper-codegen`.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
