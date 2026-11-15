export interface AdrEntry {
  readonly id: string;
  readonly title: string;
  readonly context: string;
  readonly decision: string;
  readonly consequence: string;
}

export const ADRS: ReadonlyArray<AdrEntry> = [
  {
    id: 'ADR-001',
    title: 'Lit 3 + Human-Owned UIElement & @lit-labs/ssr Over Custom Micro-Kernel',
    context:
      'Maintaining a bespoke micro-kernel across 200+ custom elements creates subtle edge-case risk around reactive batching, Trusted Types, and streaming SSR.',
    decision:
      'Adopt Lit 3 wrapped in a thin human-owned UIElement base class (tested with fast-check) adding DSD hydration, FACE wiring, :state() helpers, i18n lookup, and dev warnings; wrap @lit-labs/ssr behind @methane-ui/ssr.',
    consequence:
      'Cold first-component cost includes lit, while template security, reactive ergonomics, and SSR maturity improve dramatically.',
  },
  {
    id: 'ADR-002',
    title: 'Controller-Only Reuse & Strict Acyclic Composition DAG',
    context:
      'Subclassing components or importing sibling internals creates brittle coupling across ~250 deliverables.',
    decision:
      'Share behavior exclusively via @methane-ui/primitives controllers/cores. Nest <mth-*> elements strictly via public tags, props, slots, events, and ::part(), enforcing tokens/sanitize -> core -> primitives -> ui -> kits -> satellites.',
    consequence:
      'Components and shards can be built and refactored in parallel without breaking siblings.',
  },
  {
    id: 'ADR-003',
    title: 'Same-Root ARIA Only (Self-Labeled Shadow Controls)',
    context:
      'aria-* ID attributes never cross shadow roots, while ariaLabelledByElements and Reference Target are not universally Baseline Widely Available.',
    decision:
      'Every aria-* ID resolves within a single DOM root. Controls render internal <label>, hint, and error nodes in Shadow DOM and support external <label for> via ElementInternals.labels. <mth-field> is purely layout and Context.',
    consequence:
      'Universal screen-reader reliability across all Baseline browsers today.',
  },
  {
    id: 'ADR-004',
    title: 'Declarative Child Elements as Canonical Collection API',
    context:
      'Property-only collection APIs fail in static HTML, streaming SSR, and no-JS progressive enhancement.',
    decision:
      'Light DOM child elements (<mth-option>, <mth-column>, <mth-tab>, <mth-tree-item>) are canonical; JS arrays and DataSource<T> reconcile into the same model via SlotCollectionController.',
    consequence:
      'SSR and plain HTML work natively while JS consumers retain ergonomic array binding.',
  },
  {
    id: 'ADR-005',
    title: 'Single DataSource<T> Contract & Shared DataController',
    context:
      'Divergent async pagination/filter APIs across Combobox, Table, Tree, Kanban, and Chat fragment app integration.',
    decision:
      'Standardize one DataSource<T> interface (query({ cursor | page, sort, filter, signal }) -> { items, total?, nextCursor? }) driven by DataController with caching and AbortController cancellation.',
    consequence:
      'One backend adapter integrates cleanly with every async component in Methane.',
  },
  {
    id: 'ADR-006',
    title: 'Versioned Community Context Protocol Across Shadow Roots',
    context:
      'Prop-drilling theme, locale, field, and form state breaks across arbitrary user DOM and Shadow DOM boundaries.',
    decision:
      'Use event-based Community Context Protocol (context-request) with versioned payload schemas for Theme, Locale/Direction, Field->Control, and Form context.',
    consequence:
      'Framework-agnostic context works across shadow trees and tolerates minor version skew.',
  },
  {
    id: 'ADR-007',
    title: 'Global Runtime Singleton with SemVer Negotiation',
    context:
      'Micro-frontends and bundlers can load duplicate copies of core modules, breaking modal Escape stacks, toasts, and registries.',
    decision:
      "Store shared coordinators at globalThis[Symbol.for('@methane-ui/runtime')] with semver negotiation (highest compatible version wins) and duplicate-core guard.",
    consequence:
      'Shared browser resources coordinate cleanly across separately bundled slices.',
  },
  {
    id: 'ADR-008',
    title: 'Hybrid DSD Styles (<link rel="stylesheet"> + < 1 KB Critical Inline CSS)',
    context:
      'Repeating full inline <style> blocks inside every DSD shadow root bloats SSR HTML, while unguarded <link> tags risk FOUC.',
    decision:
      'Default DSD templates emit a cacheable <link rel="stylesheet"> plus a < 1 KB critical layout <style> shell, with an opt-in inline mode for email/edge. Pure-CSS primitives remain 0 B JS Light DOM.',
    consequence:
      'Minimal SSR HTML overhead and single-parse CSS caching with zero FOUC.',
  },
  {
    id: 'ADR-009',
    title: 'Explicit Framework SSR Adapters & React 19 Native-First Types',
    context:
      'Meta-frameworks have distinct streaming SSR pipelines, and React 19 natively supports custom elements without runtime wrappers.',
    decision:
      'Deliver 6 tested SSR packages (@methane-ui/ssr + Next, Nuxt, SvelteKit, Astro, Angular), generate @methane-ui/react as zero-runtime React 19 types, and isolate React 18 shims in @methane-ui/react/legacy.',
    consequence:
      'Near-zero wrapper cost on React 19 and turnkey hydration purity across SSR frameworks.',
  },
  {
    id: 'ADR-010',
    title: 'Baseline Widely Available Core + Dual-Path Progressive Enhancements',
    context:
      'Unguarded Newly/Limited Available APIs break non-supporting engines.',
    decision:
      'Target Baseline Widely Available and feature-detect every enhancement (base-select, anchor positioning, interestfor, ::scroll-button, moveBefore, EyeDropper, scoped registries, setHTML) with full fallbacks tested in CI.',
    consequence:
      'Honest bundle metrics and rock-solid cross-browser parity without sacrificing modern upgrades.',
  },
  {
    id: 'ADR-011',
    title: 'Co-Located English Defaults + Context-Driven i18n Message Catalog',
    context:
      'Hardcoded English strings block international apps, while external i18n frameworks bloat bundles.',
    decision:
      'Inline tree-shakable English defaults per component in @methane-ui/core, overridable via Locale Context, props/slots, and lazy @methane-ui/locales packs with Intl.PluralRules and RTL bidi isolation.',
    consequence:
      'Zero-config English DX plus complete enterprise i18n/RTL support.',
  },
  {
    id: 'ADR-012',
    title: 'Mandatory @methane-ui/sanitize & Defense-in-Depth Content Rules',
    context:
      'Rich text, Markdown, and streaming AI outputs are primary XSS/mXSS vectors, especially under Trusted Types CSP.',
    decision:
      'Ship @methane-ui/sanitize using native setHTML/parseHTML with a parity-configured bundled DOMPurify fallback (RETURN_TRUSTED_TYPE: true), disable raw HTML by default, allowlist http/https/mailto/tel URLs, and render SVGs via <img>.',
    consequence:
      "Eliminates DOM XSS sinks and works cleanly under require-trusted-types-for 'script'.",
  },
  {
    id: 'ADR-013',
    title: 'Wrap-First Satellites with SemVer-Exempt .engine Escape Hatch',
    context:
      'Re-implementing enterprise grids, charts, editors, maps, or PDF viewers from scratch lags mature engines.',
    decision:
      'Wrap permissive engines (TanStack, ECharts, ProseMirror, CodeMirror 6, MapLibre, pdf.js, Three.js) behind <mth-*> APIs with token theming, accessible fallbacks, SatelliteEngineSuite tests, and typed .engine.',
    consequence:
      'Rapid delivery of heavy components with consistent <mth-*> ergonomics and zero lock-in.',
  },
  {
    id: 'ADR-014',
    title: 'Behavior Specs as Data & Mechanical CI Gates for AI-Safe Authoring',
    context:
      'Scaling to 275 deliverables risks subtle APG, ARIA, and lifecycle regressions.',
    decision:
      'Require machine-readable <tag>.spec.ts files to generate tests, docs, CEM checks, and checklists; enforce 5 Class Conformance Suites, @methane-ui/lint-plugin static/runtime invariants, ariaSnapshot() matrices, and Hydration Purity.',
    consequence:
      'Turns parallel AI component authoring into a deterministic, mechanically verified factory.',
  },
  {
    id: 'ADR-015',
    title: 'Methane Naming, @methane-ui/* Scope & mth- Prefix Convention',
    context:
      'Every package, custom element tag, token, custom event, and runtime symbol needs a terse, collision-free namespace.',
    decision:
      "Standardize on @methane-ui/* packages, mth-* tags (configurable via defineComponents({ prefix })), --mth-* tokens, mth-* custom events, .mth-* CSS primitives, and Symbol.for('@methane-ui/runtime').",
    consequence:
      'Terse 3-letter prefix minimizes HTML/SSR byte overhead and keeps every layer immediately recognizable.',
  },
];
