import { enableHydrationSupport, hydrateRoot, isHydrationSupported } from '@methane-ui/ssr/client';
import type { RenderOptions } from 'lit';

/**
 * Activates `@lit-labs/ssr-client` hydration support for Astro islands.
 */
export function initAstroHydration(litElementClass?: unknown): boolean {
  return enableHydrationSupport(litElementClass);
}

export function hydrateAstroIsland(
  element: Element | DocumentFragment,
  template?: unknown,
  options?: RenderOptions,
): void {
  if (template !== undefined) {
    hydrateRoot(template, element, options);
  }
}

export function isAstroHydrationReady(): boolean {
  return isHydrationSupported();
}
