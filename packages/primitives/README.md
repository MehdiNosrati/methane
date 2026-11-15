# `@methane/primitives`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Framework-agnostic Lit `ReactiveController` behaviors, headless state engines, lazy `AutoLoader`, and accessibility utility elements for **Methane UI**.

## Installation

```bash
pnpm add @methane/primitives @methane/core
# or
npm install @methane/primitives @methane/core
```

> **Peer dependency:** `@methane/core` (`workspace:^` / `>=0.1.0`) is required.

## Exported Primitives & Controllers

| Symbol | Category | Description |
| --- | --- | --- |
| `AutoLoader`, `MthVisuallyHiddenElement`, `MthSkipLinkElement`, `MthErrorBoundaryElement`, `registerUtilityElements` | Utilities & Lazy Loading | `MutationObserver`-backed automatic element loader + essential a11y/resilience utility tags (`<mth-visually-hidden>`, `<mth-skip-link>`, `<mth-error-boundary>`) |
| `OverlayController` | Overlay | Top-layer (`popover` / `<dialog>` / `modal`) coordinator integrating with `@methane/core` overlay stack, outside-click, and `Escape` dismissal |
| `PositioningController` | Positioning | Viewport-aware anchor positioning with `flip`, `shift`, `offset`, virtual anchors, and RTL logical alignment |
| `FocusTrapController`, `collectTabbableElements`, `getDeepActiveElement`, `getFirstTabbable` | Focus | Modal & composite-widget focus containment and Shadow DOM deep active element traversal |
| `RovingFocusController` | Keyboard | Arrow-key / `Home` / `End` composite widget navigation with RTL awareness |
| `ListboxController` | Selection | ARIA listbox keyboard handling, typeahead search, and active-descendant / roving selection |
| `SelectionController` | Selection | Single, multiple, and tri-state (`CheckState`) hierarchical selection model |
| `FormControlController` | Forms | Shared FACE `ElementInternals` wiring, constraint validation, form reset/restore, and disabled propagation |
| `InputController` | Text Input | Controlled/uncontrolled input synchronization with caret preservation |
| `MaskAndFormatEngine`, `validateLuhn`, `validateIbanMod97` | Formatting & Validation | Pattern, numeric, credit card (Luhn), and IBAN (MOD-97) masking and validation |
| `FormattingUtils` | Formatting | Locale-aware `Intl` date, number, currency, and relative-time formatting helpers |
| `CalendarCore`, `expandRRule`, `addCalendarDays`, `addCalendarMonths`, `daysInMonth` | Calendar | Headless date math, week/month grid builder (`CalendarCell`), and iCalendar `RRULE` expansion |
| `DataController`, `createArrayDataSource` | Data | Async pagination, filtering, sorting, and request-race cancellation controller |
| `TableCore` | Data Grid | Column pinning, multi-column sorting, resizing, visibility, and column ordering state |
| `VirtualizerController` | Performance | Fixed/variable-size 1D list and 2D grid windowing controller |
| `DragSortController` | Interaction | Pointer & keyboard-accessible drag-and-drop list reordering (`DragReorderDetail`) |
| `HotkeyController`, `HotkeyManager`, `normalizeCombo` | Keyboard | Scoped and global shortcut registry with input-eligibility filtering |
| `LiveAnnouncer` | Accessibility | Polite/assertive ARIA live-region announcement coordinator |
| `NotificationStore`, `NotificationStoreController` | Notifications | Reactive toast/notification queue bound to the shared runtime coordinator |
| `MotionController` | Animation | Reduced-motion-safe enter/exit transition state machine (`MotionPhase`) |
| `ObserverPoolController` | Observers | Shared `ResizeObserver` / `IntersectionObserver` subscription pooling |
| `SlotCollectionController` | Slots | Declarative tracking of slotted child elements matching a predicate |
| `ClipboardAndShare` | Platform | Clipboard copy + Web Share API wrapper with graceful fallbacks |
| `ContextProtocol`, `ThemeContextProviderController`, `LocaleContextProviderController`, `FieldContextProviderController`, `FormContextProviderController` | Context | `@lit/context` provider controllers and consumers |

## Usage Examples

### Lazy Auto-Loading Custom Elements

```ts
import { AutoLoader, registerUtilityElements } from '@methane/primitives';

registerUtilityElements();

const loader = new AutoLoader({
  prefix: 'mth-',
  loaders: {
    'mth-button': () => import('@methane/ui/button'),
    'mth-dialog': () => import('@methane/ui/dialog'),
  },
});

loader.observe(document.body);
```

### Composing Controllers inside a `UIElement`

```ts
import { html } from 'lit';
import { UIElement } from '@methane/core';
import {
  FocusTrapController,
  OverlayController,
  RovingFocusController,
} from '@methane/primitives';

export class AcmeMenu extends UIElement {
  private overlay = new OverlayController(this, {
    mode: 'dropdown',
    onClose: () => {
      this.open = false;
    },
  });

  private roving = new RovingFocusController(this, {
    orientation: 'vertical',
    getItems: () => Array.from(this.querySelectorAll('[role="menuitem"]')),
  });

  private trap = new FocusTrapController(this, { active: false });
  // ...
}
```

### Utility Elements in HTML

```html
<mth-skip-link href="#main-content">Skip to main content</mth-skip-link>
<mth-visually-hidden>Unread notifications: 3</mth-visually-hidden>
<mth-error-boundary>
  <my-widget></my-widget>
</mth-error-boundary>
```

## Theming, A11y & SSR Notes

- Utility elements respect `--mth-*` semantic focus and surface tokens when visible (e.g., `<mth-skip-link>:focus-visible` and `<mth-error-boundary>` fallback card).
- `LiveAnnouncer`, `FocusTrapController`, `RovingFocusController`, and `OverlayController` implement APG keyboard, focus restoration, and screen-reader semantics.
- Headless helpers (`CalendarCore`, `TableCore`, `MaskAndFormatEngine`, `FormattingUtils`, `expandRRule`) have zero DOM dependency and run safely during SSR. DOM observers (`AutoLoader`, `ObserverPoolController`, `OverlayController`) guard window/document APIs on connect.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
