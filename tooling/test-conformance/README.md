# `@methane-ui/test-conformance`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Reusable Class Conformance Suites, `SatelliteEngineSuite`, `HydrationPuritySuite`, and Shadow DOM same-root ARIA scanner (`scanSameRootAria`) for **Methane UI** component testing.

## Installation

```bash
pnpm add -D @methane-ui/test-conformance
# or
npm install -D @methane-ui/test-conformance
```

## Exported Suites & Scanners

| Symbol | Purpose |
| --- | --- |
| `FormControlSuite` / `runFormControlSuite` | Verifies FACE `ElementInternals`, form submission/reset/restore, disabled propagation, and constraint validation |
| `OverlaySuite` / `runOverlaySuite` | Verifies open/close events, top-layer/escape dismissal, focus restoration, and outside-click behavior |
| `RovingFocusSuite` / `runRovingFocusSuite` | Verifies arrow navigation, `Home`/`End`, single `tabindex="0"` invariant, and RTL reversal |
| `ListboxSuite` / `runListboxSuite` | Verifies `aria-selected`, option cycling, and selection synchronization |
| `DataConsumerSuite` / `runDataConsumerSuite` | Verifies async `DataSource` loading, filtering, cancellation, and error states |
| `SatelliteEngineSuite` / `runSatelliteEngineSuite` | Verifies lazy satellite engine mounting, SSR headless safety, and `disconnectedCallback` disposal |
| `HydrationPuritySuite` / `runHydrationPuritySuite` | Verifies Declarative Shadow DOM upgrade purity with zero hydration mismatch warnings |
| `scanSameRootAria` / `ARIA_IDREF_ATTRIBUTES` | Scans DOM/Shadow roots to confirm `aria-labelledby`, `aria-describedby`, `aria-controls`, etc. resolve within the same root |

## Usage Examples

### Running `FormControlSuite` & `scanSameRootAria` in Vitest

```ts
import { describe, it, expect } from 'vitest';
import { FormControlSuite, scanSameRootAria } from '@methane-ui/test-conformance';

describe('<mth-input> conformance', () => {
  it('passes FormControlSuite', async () => {
    const report = await FormControlSuite.run({
      createElement: () => document.createElement('mth-input'),
      setValue: (el, v) => { (el as any).value = v; },
      getValue: (el) => (el as any).value,
    });
    expect(report.passed).toBe(true);
  });

  it('keeps ARIA IDREFs within the same shadow root', () => {
    const el = document.createElement('mth-input');
    document.body.appendChild(el);
    const ariaReport = scanSameRootAria(el.shadowRoot!);
    expect(ariaReport.issues).toEqual([]);
  });
});
```

### Testing Declarative Shadow DOM Hydration Purity

```ts
import { HydrationPuritySuite } from '@methane-ui/test-conformance';

const report = await HydrationPuritySuite.run({
  ssrHtml,
  upgradeElement: async (host) => {
    customElements.upgrade(host);
  },
});
```

## Notes

- Zero runtime dependencies; works in Vitest with `happy-dom`, `jsdom`, or real browser Playwright/Web Test Runner environments.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
