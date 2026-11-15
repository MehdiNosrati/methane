# `@methane-ui/ui`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Accessible, form-associated, RTL-ready Lit 3 Web Components spanning core controls, forms, navigation, overlays, data display, and feedback — built on `@methane-ui/core` and `@methane-ui/tokens`.

- **Per-component tree shaking** via `@methane-ui/ui/<slug>` (auto-registers `<mth-*>`) and `@methane-ui/ui/<slug>/element` (unregistered class + `registerMth*(prefix?)` for white-label prefixes).
- **Same-root ARIA & FACE**: `<mth-field>` and `<mth-form>` coordinate labels, descriptions, errors, and native `ElementInternals` constraint validation without cross-shadow ARIA mismatches.
- **Custom Elements Manifest**: Ships `custom-elements.json` at `@methane-ui/ui/custom-elements.json` for IDE autocomplete and wrapper codegen.

## Installation

```bash
pnpm add @methane-ui/ui @methane-ui/core @methane-ui/tokens
# or
npm install @methane-ui/ui @methane-ui/core @methane-ui/tokens
```

> **Peer dependency:** `@methane-ui/core` (`^0.1.2`) is required.

## Package Exports

| Export | Description |
| --- | --- |
| `@methane-ui/ui` | Tree-shakeable barrel re-exporting component classes, styles, messages, `registerMth*` helpers, and `registerAllComponents(prefix?)` without side effects |
| `@methane-ui/ui/define` | Side-effect entrypoint that auto-registers all core UI custom elements and exports `registerAllComponents` |
| `@methane-ui/ui/<slug>` | Per-component auto-registering entrypoint (e.g. `@methane-ui/ui/button`, `@methane-ui/ui/dialog`) |
| `@methane-ui/ui/<slug>/element` | Exports class, styles, messages, and `registerMth<Name>(prefix?)` without side-effect registration |
| `@methane-ui/ui/custom-elements.json` | Custom Elements Manifest (CEM) JSON metadata |

## Component Catalog

| Domain | Custom Elements |
| --- | --- |
| **Actions & Buttons** | `mth-button`, `mth-button-group`, `mth-copy-button`, `mth-fab`, `mth-icon-button`, `mth-share-button`, `mth-speed-dial`, `mth-split-button`, `mth-toggle-button`, `mth-toggle-group` |
| **Form Controls & Inputs** | `mth-address-input`, `mth-checkbox`, `mth-color-picker`, `mth-conditional-field`, `mth-creatable-select`, `mth-credit-card-input`, `mth-cron-builder`, `mth-currency-input`, `mth-drawing-pad`, `mth-dropzone`, `mth-duration-input`, `mth-field`, `mth-fieldset`, `mth-file-upload`, `mth-form`, `mth-form-repeater`, `mth-form-wizard`, `mth-iban-input`, `mth-inline-edit`, `mth-input`, `mth-masked-input`, `mth-mention-input`, `mth-multi-select`, `mth-number-input`, `mth-option`, `mth-option-group`, `mth-otp-input`, `mth-password-input`, `mth-phone-input`, `mth-radio`, `mth-radio-group`, `mth-range-slider`, `mth-rating`, `mth-rrule-editor`, `mth-schema-form`, `mth-search-input`, `mth-segmented-control`, `mth-select`, `mth-signature-pad`, `mth-slider`, `mth-switch`, `mth-tag-input`, `mth-textarea`, `mth-transfer-list` |
| **Date & Time** | `mth-calendar`, `mth-clock`, `mth-countdown`, `mth-date-picker`, `mth-date-range-calendar`, `mth-date-range-picker`, `mth-datetime-picker`, `mth-month-picker`, `mth-stopwatch`, `mth-time-picker`, `mth-timezone-picker` |
| **Navigation & Layout** | `mth-accordion`, `mth-accordion-item`, `mth-back-to-top`, `mth-bottom-nav`, `mth-breadcrumb-item`, `mth-breadcrumb-path`, `mth-breadcrumbs`, `mth-link`, `mth-mega-menu`, `mth-menubar`, `mth-navbar`, `mth-pagination`, `mth-resizable-group`, `mth-resizable-handle`, `mth-resizable-panel`, `mth-scroll-area`, `mth-sidebar-nav`, `mth-split-pane`, `mth-step`, `mth-stepper`, `mth-tab`, `mth-tab-panel`, `mth-tabs`, `mth-toc`, `mth-tree`, `mth-tree-item`, `mth-tree-nav` |
| **Overlays & Menus** | `mth-bottom-sheet`, `mth-coachmark`, `mth-command-palette`, `mth-context-menu`, `mth-dialog`, `mth-drawer`, `mth-dropdown-menu`, `mth-floating-panel`, `mth-fullscreen-overlay`, `mth-hover-card`, `mth-lightbox`, `mth-menu-item`, `mth-popover`, `mth-tooltip`, `mth-tour`, `mth-tour-step` |
| **Data Display & Media** | `mth-activity-feed`, `mth-audio-player`, `mth-avatar`, `mth-avatar-group`, `mth-badge`, `mth-barcode`, `mth-before-after`, `mth-calendar-heatmap`, `mth-card`, `mth-carousel`, `mth-carousel-item`, `mth-cascader`, `mth-code-tabs`, `mth-column`, `mth-combobox`, `mth-comparison-table`, `mth-emoji-picker`, `mth-gallery`, `mth-icon`, `mth-image`, `mth-image-cropper`, `mth-infinite-scroll`, `mth-key-value`, `mth-list`, `mth-list-item`, `mth-load-more`, `mth-masonry`, `mth-qr-code`, `mth-sortable`, `mth-sparkline`, `mth-stat-card`, `mth-table`, `mth-tag`, `mth-timeline`, `mth-timeline-item`, `mth-video-player`, `mth-virtual-scroller`, `mth-zoom-pan` |
| **Feedback & Utility** | `mth-alert`, `mth-async-search`, `mth-banner`, `mth-callout`, `mth-captcha-slot`, `mth-cookie-banner`, `mth-empty-state`, `mth-error-summary`, `mth-inline-status`, `mth-loading-overlay`, `mth-network-status`, `mth-newsletter-form`, `mth-notification-center`, `mth-progress-bar`, `mth-progress-ring`, `mth-site-search`, `mth-skeleton`, `mth-spinner`, `mth-status-indicator`, `mth-toast`, `mth-upload-progress` |

## Usage Examples

### Per-Component Import (Recommended for Bundle Size)

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/dialog';
import '@methane-ui/ui/input';
```

```html
<mth-form>
  <mth-field label="Email">
    <mth-input name="email" type="email" required placeholder="you@example.com"></mth-input>
  </mth-field>
  <mth-button type="submit" variant="solid">Continue</mth-button>
</mth-form>
```

### Custom Tag Prefix Registration

```ts
import { registerMthButton } from '@methane-ui/ui/button/element';
import { registerMthDialog } from '@methane-ui/ui/dialog/element';

registerMthButton('acme'); // defines <acme-button>
registerMthDialog('acme'); // defines <acme-dialog>
```

## Theming, Accessibility & SSR Notes

- **Theming**: Style components globally via `--mth-*` tokens, inspect live state via `:state(disabled)`, `:state(invalid)`, `:state(open)`, `:state(checked)`, and customize internal shadow nodes via `::part(base)`, `::part(control)`, `::part(label)`, etc.
- **Accessibility & Keyboard**: Implements WAI-ARIA Authoring Practices Guide (APG) keyboard interactions (roving tabindex, focus trapping, `Escape` dismissal, `Home`/`End`, typeahead) with full RTL logical layout.
- **SSR**: Built on `UIElement`. Import `@methane-ui/core/hydrate` (or `@methane-ui/ssr/client` / framework `@methane-ui/ssr-*/client` adapters) on the client for opt-in Declarative Shadow DOM hydration.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
