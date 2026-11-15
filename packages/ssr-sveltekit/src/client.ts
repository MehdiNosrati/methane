import { enableHydrationSupport, hydrateRoot, isHydrationSupported } from '@methane/ssr/client';
import type { RenderOptions } from 'lit';

/**
 * Activates `@lit-labs/ssr-client` hydration support in SvelteKit `hooks.client.ts`.
 */
export function initSvelteKitHydration(litElementClass?: unknown): boolean {
  return enableHydrationSupport(litElementClass);
}

export function hydrateSvelteKitRoot(
  value: unknown,
  container: Element | DocumentFragment,
  options?: RenderOptions,
): void {
  hydrateRoot(value, container, options);
}

export function isSvelteKitHydrationReady(): boolean {
  return isHydrationSupported();
}
