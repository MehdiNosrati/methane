import { enableHydrationSupport, hydrateRoot, isHydrationSupported } from '@methane-ui/ssr/client';
import type { RenderOptions } from 'lit';

/**
 * Activates `@lit-labs/ssr-client` hydration support in Next.js Client Components.
 */
export function initNextHydration(litElementClass?: unknown): boolean {
  return enableHydrationSupport(litElementClass);
}

export function hydrateNextContainer(
  value: unknown,
  container: Element | DocumentFragment,
  options?: RenderOptions,
): void {
  hydrateRoot(value, container, options);
}

export function isNextHydrationReady(): boolean {
  return isHydrationSupported();
}
