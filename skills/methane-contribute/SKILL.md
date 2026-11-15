---
name: methane-contribute
description: Contributor runbook for adding or updating Methane UI components, ComponentBehaviorSpec files, same-root ARIA, Form-Associated Custom Elements, 4-tier logical CSS, wrapper codegen, Vitest conformance suites, and Playwright E2E tests. Use when modifying packages inside the methane monorepo.
---

# Contributing to Methane UI

Follow the package layer hierarchy (`tokens / sanitize -> core -> primitives -> ui -> kits -> satellites`) — never import sibling component internals; share logic through `@methane/primitives` controllers and cores.

## Component File Structure

Every component under `packages/ui/src/components/<slug>/` (or `kits/` / `satellites/`) contains:

- `<slug>.spec.ts` — `ComponentBehaviorSpec` + `CEM_METADATA` (author first)
- `<slug>.ts` — `UIElement` subclass
- `<slug>.styles.ts` — Lit `css` template using tokens and logical properties
- `<slug>.messages.ts` — English default i18n message catalog
- `<slug>.test.ts` — Vitest unit + `@methane/test-conformance` suites
- `element.ts` — exports class/spec/styles/messages + `registerMth<Name>(prefix?)` (side-effect-free)
- `index.ts` — re-exports `element.ts`, calls `registerMth<Name>()`, augments `HTMLElementTagNameMap`

## Authoring Rules (Enforced by `@methane/lint-plugin`)

1. **Same-root ARIA**: Never reference IDs across shadow boundaries. Render internal `<label>`, hint, and error nodes in the component's own Shadow DOM, mirror `slot="label" | "hint" | "error"`, and support external `<label for>` via `ElementInternals.labels`.
2. **Form participation (FACE)**: Wire `static formAssociated = true` with `FormControlController` / `ElementInternals`. In `formDisabledCallback(disabled)`, disable internal controls and update `:state(disabled)` without mutating the host `disabled` attribute.
3. **Custom states & parts**: Expose `this.setCustomState(...)` (`disabled`, `invalid`, `open`, `checked`, `loading`) and semantic `part="..."` attributes (`base`, `control`, `label`, `popup`).
4. **4-tier logical CSS with zero raw hex**: Use CSS Logical Properties exclusively (`inline-size`, `block-size`, `padding-inline`, `margin-block`, `inset-inline-start`). Wrap tokens as `var(--mth-*, fallback)` using `oklch()` / `light-dark()` / system colors — never raw hex literals. Include `@media (prefers-reduced-motion: reduce)` and `@media (forced-colors: active)`.
5. **Security**: Route all untrusted HTML, Markdown, and URLs through `@methane/sanitize` (`safeSetHTML`, `parseSafeFragment`, `isSafeUrl`). Never use raw `innerHTML` or Lit `unsafeHTML`.

## Required Verification Pipeline

Run these checks before committing:

```bash
# 1. Build packages, run wrapper-codegen + figma-sync, and build apps
pnpm build

# 2. Verify generated React/Vue/Angular/Svelte wrappers & CEM match sources
pnpm run codegen:check

# 3. Typecheck, ESLint + Stylelint invariants, and Vitest conformance suites
pnpm typecheck && pnpm lint && pnpm test

# 4. Real-browser Playwright verification (SSR apps & docs)
METHANE_E2E_SERVERS=1 pnpm exec playwright test
pnpm exec playwright test -c apps/docs/playwright.config.ts
```

When adding conformance tests, use `@methane/test-conformance` suites (`FormControlSuite`, `OverlaySuite`, `RovingFocusSuite`, `ListboxSuite`, `DataConsumerSuite`, `SatelliteEngineSuite`, `HydrationPuritySuite`, `scanSameRootAria`) and `runBehaviorSpecAssertions()` from `@methane/spec-compiler`.
