import type { LitElement } from 'lit';

declare const __DEV__: boolean | undefined;

/**
 * Compile-time / export-condition constant folded to `false` in production builds
 * via `@methane-ui/core`'s `"default"` export condition.
 */
export const IS_DEV: boolean = true;

const ARIA_IDREF_ATTRS: ReadonlyArray<string> = [
  'aria-labelledby',
  'aria-describedby',
  'aria-errormessage',
  'aria-controls',
  'aria-activedescendant',
  'aria-owns',
  'aria-flowto',
  'aria-details',
];

const INTERACTIVE_ROLES_REQUIRING_NAME: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'button',
  'textbox',
  'combobox',
  'listbox',
  'checkbox',
  'switch',
  'slider',
  'dialog',
  'alertdialog',
  'tab',
  'menuitem',
]);

/**
 * Tree-shakable development mode check.
 * Production bundles resolve `"default"` export condition where this folds to `false`.
 */
export function isDevMode(): boolean {
  if (typeof process !== 'undefined' && typeof process.env === 'object' && process.env !== null) {
    if (process.env['NODE_ENV'] === 'production') {
      return false;
    }
  }
  if (typeof __DEV__ === 'boolean') {
    return __DEV__;
  }
  return true;
}

export function devWarn(message: string, ...args: unknown[]): void {
  if (isDevMode() && typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(`[methane] ${message}`, ...args);
  }
}

/**
 * Development-only same-root ARIA, accessible-name, and delegatesFocus diagnostics.
 * Stripped completely in production `"default"` builds.
 */
export function runElementDevDiagnostics(
  host: LitElement,
  internals?: ElementInternals | null,
  labels?: NodeList | null,
): void {
  if (!isDevMode()) return;

  const ctor = host.constructor as typeof LitElement & {
    shadowRootOptions?: { delegatesFocus?: boolean };
  };
  const delegatesFocus =
    (host.shadowRoot && 'delegatesFocus' in host.shadowRoot
      ? (host.shadowRoot as ShadowRoot & { delegatesFocus?: boolean }).delegatesFocus
      : undefined) ?? ctor.shadowRootOptions?.delegatesFocus;

  if (delegatesFocus && (host.hasAttribute('role') || internals?.role)) {
    devWarn(
      `<${host.localName}> combines delegatesFocus: true with host role ("${host.getAttribute('role') ?? internals?.role}"). Remove host role per ADR-014.`,
    );
  }

  const root = host.shadowRoot;
  if (!root) return;

  const localIds = new Set<string>();
  for (const el of root.querySelectorAll('[id]')) {
    if (el.id) localIds.add(el.id);
  }

  for (const el of root.querySelectorAll('*')) {
    for (const attr of ARIA_IDREF_ATTRS) {
      const val = el.getAttribute(attr);
      if (!val) continue;
      for (const idRef of val.trim().split(/\s+/)) {
        if (!localIds.has(idRef)) {
          devWarn(
            `<${host.localName}> has non-same-root ${attr}="${idRef}" inside shadowRoot (ADR-003).`,
          );
        }
      }
    }

    const role = el.getAttribute('role');
    if (role && INTERACTIVE_ROLES_REQUIRING_NAME.has(role)) {
      const hasLabelAttr = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
      const hasTitle = el.hasAttribute('title');
      const hasText = (el.textContent?.trim().length ?? 0) > 0;
      const hasHostLabels = (labels?.length ?? 0) > 0;
      if (!hasLabelAttr && !hasTitle && !hasText && !hasHostLabels) {
        devWarn(
          `<${host.localName}> inner [role="${role}"] is missing an accessible name (ADR-003).`,
        );
      }
    }
  }
}
