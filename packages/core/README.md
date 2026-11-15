# `@methane/core`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Lit 3 `UIElement` base class, single versioned global runtime (`Symbol.for('@methane/runtime')`), i18n catalog & bidi isolation, and `@lit/context` Community Context Protocol tokens for **Methane UI**.

- Opt-in client SSR hydration support via `@methane/core/hydrate` (so CSR-only bundles carry zero `@lit-labs/ssr-client` bytes).
- Includes `ElementInternals` support for Form-Associated Custom Elements (FACE) and ARIA `CustomStateSet` (`:state(...)`) pseudo-classes.

## Installation

```bash
pnpm add @methane/core
# or
npm install @methane/core
```

> `@methane/core` (`^0.1.0`) is a required `peerDependency` of `@methane/primitives`, `@methane/ui`, `@methane/ai`, `@methane/auth`, `@methane/admin`, `@methane/chat`, `@methane/commerce`, and all 11 `@methane/*` satellite packages.

## Package Exports

| Entrypoint | Key Exports |
| --- | --- |
| `@methane/core` | `UIElement`, `getRuntime`, `negotiateRuntime`, `defineComponents`, `registerStyles`, `loadLocalePack`, `registerLocalePack`, `registerLocaleMessages`, `translateMessage`, `THEME_CONTEXT`, `LOCALE_CONTEXT`, `FIELD_CONTEXT`, `FORM_CONTEXT`, `isDevMode`, `devWarn` |
| `@methane/core/hydrate` | Opt-in client Declarative Shadow DOM hydration side-effect entrypoint wrapping `@lit-labs/ssr-client/lit-element-hydrate-support.js` |
| `@methane/core/runtime` | `CORE_VERSION`, `CORE_MAJOR`, `RUNTIME_SYMBOL`, `negotiateRuntime`, `getRuntime`, `registerStyles`, `defineComponents`, `parseSemver`, `compareSemver`, coordinator interfaces (`OverlayStackCoordinator`, `NotificationStoreCoordinator`, `HotkeyManagerCoordinator`, `LiveAnnouncerCoordinator`, `SharedObserverPools`) |
| `@methane/core/i18n` | `registerLocalePack`, `registerLocaleMessages`, `loadLocalePack`, `translateMessage`, `formatI18nMessage`, `normalizeLocale`, `inferDirectionFromLocale`, `isolateBidiValue`, `resolveMessageEntry` |
| `@methane/core/context` | `THEME_CONTEXT`, `LOCALE_CONTEXT`, `FIELD_CONTEXT`, `FORM_CONTEXT`, defaults (`DEFAULT_THEME_CONTEXT`, `DEFAULT_LOCALE_CONTEXT`), and context value types |

## Usage Examples

### Authoring a Custom Element with `UIElement`

```ts
import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { UIElement, defineComponents } from '@methane/core';

export class AcmeBadge extends UIElement {
  static formAssociated = true;

  static override styles = css`
    :host {
      display: inline-flex;
      border-radius: var(--mth-radius-full);
      background: var(--mth-color-accent-subtle);
      color: var(--mth-color-accent);
      padding: var(--mth-space-1) var(--mth-space-2);
    }
    :host(:state(highlighted)) {
      outline: 2px solid var(--mth-color-border-focus);
    }
  `;

  @property({ type: Boolean, reflect: true })
  highlighted = false;

  protected override updated(): void {
    this.setCustomState('highlighted', this.highlighted);
  }

  override render() {
    return html`<span part="label"><slot></slot></span>`;
  }
}

// Prefix-safe registration (supports custom prefixes via ADR-015)
defineComponents({
  prefix: 'acme',
  components: { 'mth-badge': AcmeBadge },
});
```

### Multi-Bundle Runtime Negotiation & Prefix Registry

If two microfrontends bundle `@methane/core` independently, `getRuntime()` negotiates a single coordinator on `globalThis[Symbol.for('@methane/runtime')]`:

```ts
import { getRuntime, defineComponents } from '@methane/core/runtime';

const runtime = getRuntime();
console.log(runtime.version, runtime.overlays);

// Register standard tags under a custom element prefix (e.g. <acme-button>)
defineComponents({
  prefix: 'acme',
  components: { 'mth-button': MthButton },
});
```

### i18n Registration & RTL Resolution

```ts
import { registerLocalePack, inferDirectionFromLocale } from '@methane/core/i18n';

registerLocalePack('fr', { common: { close: 'Fermer' } });
console.log(inferDirectionFromLocale('ar')); // 'rtl'
```

## Theming, A11y & SSR Notes

- **Theming & States**: `UIElement` manages `:state(...)` flags via `setCustomState()` / `hasCustomState()` on `ElementInternals` (with graceful `data-state-*` / attribute parity) and consumes `THEME_CONTEXT` / `LOCALE_CONTEXT`.
- **Same-Root Accessibility**: `FIELD_CONTEXT` and `FORM_CONTEXT` propagate labels, descriptions, errors, and validity without cross-shadow `aria-labelledby` breakage.
- **SSR & Hydration**: Client Declarative Shadow DOM hydration is opt-in via `import '@methane/core/hydrate'` (before element registration or alongside `@methane/ssr/client` / `@methane/ssr-*/client`) so CSR-only bundles do not pay hydration support overhead.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
