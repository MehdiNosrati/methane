import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import type { RenderOptions } from 'lit';

export const LIT_HYDRATE_SUPPORT_IMPORT = '@lit-labs/ssr-client/lit-element-hydrate-support.js';

/**
 * Returns `true` when `@lit-labs/ssr-client` hydration support has registered
 * `globalThis.litElementHydrateSupport` on the current runtime.
 */
export function isHydrationSupported(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { litElementHydrateSupport?: unknown }).litElementHydrateSupport === 'function'
  );
}

/**
 * Ensures `litElementHydrateSupport` is attached to `LitElement` even if a bundler
 * evaluated `lit` before `@methane/ssr/client`.
 */
export function enableHydrationSupport(litElementClass?: unknown): boolean {
  const hook = (globalThis as { litElementHydrateSupport?: (arg: { LitElement: unknown }) => void })
    .litElementHydrateSupport;
  if (typeof hook !== 'function') {
    return false;
  }
  if (litElementClass !== undefined) {
    hook({ LitElement: litElementClass });
  }
  return true;
}

/**
 * Hydrates a server-rendered container (`DocumentFragment`, `Element`, or `ShadowRoot`)
 * using `@lit-labs/ssr-client`'s `hydrate()`.
 */
export function hydrateRoot(
  value: unknown,
  container: Element | DocumentFragment,
  options?: RenderOptions,
): void {
  hydrate(value, container, options);
}
