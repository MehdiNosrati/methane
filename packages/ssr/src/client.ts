import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { digestForTemplateResult, hydrate } from '@lit-labs/ssr-client';
import { LitElement, type RenderOptions } from 'lit';

export { digestForTemplateResult };
export const LIT_HYDRATE_SUPPORT_IMPORT = '@lit-labs/ssr-client/lit-element-hydrate-support.js';

const patchedConstructors = new WeakSet<object>();

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
 * Idempotently ensures `litElementHydrateSupport` is attached to `LitElement`
 * even if a bundler evaluated `lit` before `@methane-ui/ssr/client`.
 */
export function enableHydrationSupport(litElementClass: unknown = LitElement): boolean {
  const hook = (globalThis as { litElementHydrateSupport?: (arg: { LitElement: unknown }) => void })
    .litElementHydrateSupport;
  if (typeof hook !== 'function') {
    return false;
  }
  if (litElementClass !== undefined && (typeof litElementClass === 'function' || typeof litElementClass === 'object') && litElementClass !== null) {
    if (patchedConstructors.has(litElementClass)) {
      return true;
    }
    const ownDesc = Object.getOwnPropertyDescriptor(litElementClass, 'observedAttributes');
    if (ownDesc && !ownDesc.configurable) {
      patchedConstructors.add(litElementClass);
      return true;
    }
    patchedConstructors.add(litElementClass);
    hook({ LitElement: litElementClass });
  }
  return true;
}

enableHydrationSupport(LitElement);

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
