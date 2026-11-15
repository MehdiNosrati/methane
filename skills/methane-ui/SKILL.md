---
name: methane-ui
description: Guides building UIs with Methane Web Components, pure CSS layout classes, domain kits, satellites, and framework wrappers across HTML, React, Vue, Angular, and Svelte. Use when selecting, importing, or wiring @methane-ui/* components or forms.
---

# Methane UI

Build accessible interfaces with pure CSS layouts (`@methane-ui/css`) and custom elements (`@methane-ui/ui`, domain kits, and satellites).

## Choose the Right Layer

| Need | Use | Example |
| --- | --- | --- |
| Spacing, grid, flex, app shell, prose, marketing | `@methane-ui/css` pure CSS classes / layout tags | `.mth-stack`, `.mth-grid`, `.mth-app-shell`, `<mth-stack>` |
| Native form controls with zero JS | `@methane-ui/css` form classes | `.mth-btn`, `.mth-input`, `.mth-select` |
| Interactive controls, overlays, validation | `@methane-ui/ui/<slug>` custom elements | `<mth-button>`, `<mth-dialog>`, `<mth-combobox>` |
| Domain workflows (AI, Auth, Admin, Chat, Commerce) | `@methane-ui/{ai,auth,admin,chat,commerce}` | `<mth-prompt-input>`, `<mth-auth-form>`, `<mth-kanban>` |
| Heavy engines (charts, datagrid, editor, maps, PDF, 3D) | `@methane-ui/{charts,datagrid,editor,code,maps,pdf,3d,rtc,flow,media,spreadsheet}` | `<mth-chart>`, `<mth-datagrid>`, `<mth-code-editor>` |

Prefer `@methane-ui/css` layout classes or `.mth-btn` / `.mth-select` over Shadow DOM custom elements when static styling or native `<button>` / `<select>` suffices.

## Base Setup & Per-Component Imports

Load tokens and base CSS once at your app root, then import individual component entrypoints for tree-shaking:

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/css/index.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/input';
import '@methane-ui/ui/select';
```

For custom tag prefixes (white-labeling), import from `/element`:

```ts
import { registerMthButton } from '@methane-ui/ui/button/element';
registerMthButton('acme'); // registers <acme-button>
```

## Button Variants & Sizing

Valid `<mth-button>` `variant` values:

- `solid` (default primary action)
- `soft` (low-emphasis tinted surface)
- `outline` (bordered secondary action)
- `ghost` (borderless inline/toolbar action)
- `danger` (destructive action)

Sizes: `size="sm" | "md" | "lg"`. Types: `type="button" | "submit" | "reset"`.

## Forms & `FormData`

Methane form controls (`<mth-input>`, `<mth-select>`, `<mth-checkbox>`, `<mth-switch>`, `<mth-radio-group>`, `<mth-textarea>`, `<mth-combobox>`) are Form-Associated Custom Elements (`ElementInternals`). They participate directly in native `<form>` validation, reset, and `new FormData(form)`:

```html
<form id="profile">
  <mth-stack data-gap="4">
    <mth-input name="email" type="email" label="Work email" required></mth-input>
    <mth-select name="role" label="Role" value="eng">
      <mth-option value="eng">Engineer</mth-option>
      <mth-option value="design">Designer</mth-option>
    </mth-select>
    <mth-button type="submit" variant="solid">Save</mth-button>
  </mth-stack>
</form>
```

For coordinated form-wide validation summaries and `mth-submit` `{ values }` / `mth-invalid` `{ errors }` events, wrap controls in `<mth-form>`.

## Event Conventions

Methane components dispatch lowercase, kebab-case `mth-*` custom events (bubble + composed):

- `mth-press` — button or action activation
- `mth-input` — live value changes while typing
- `mth-change` — committed value or checked-state changes
- `mth-open` / `mth-close` — overlay visibility transitions
- `mth-submit` / `mth-invalid` — `<mth-form>` submission results

## References

- Component & package directory: [components.md](references/components.md)
- Framework patterns (HTML, React 19/18, Vue 3, Angular 17+, Svelte 5): [frameworks.md](references/frameworks.md)
