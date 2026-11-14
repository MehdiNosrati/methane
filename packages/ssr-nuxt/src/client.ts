import { enableHydrationSupport, hydrateRoot, isHydrationSupported } from '@methane/ssr/client';
import type { RenderOptions } from 'lit';

export function initNuxtHydration(litElementClass?: unknown): boolean {
  return enableHydrationSupport(litElementClass);
}

export function hydrateNuxtRoot(
  value: unknown,
  container: Element | DocumentFragment,
  options?: RenderOptions,
): void {
  hydrateRoot(value, container, options);
}

export function createMethaneNuxtPlugin() {
  return {
    name: 'methane-ssr-hydration',
    setup(): { readonly hydrationReady: boolean } {
      const hydrationReady = isHydrationSupported();
      return { hydrationReady };
    },
  };
}
