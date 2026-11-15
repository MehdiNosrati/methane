import { enableHydrationSupport, hydrateRoot, isHydrationSupported } from '@methane-ui/ssr/client';
import type { RenderOptions } from 'lit';

export interface MethaneAngularHydrationProvider {
  readonly name: 'MethaneHydrationProvider';
  readonly initialize: (litElementClass?: unknown) => boolean;
}

/**
 * Activates `@lit-labs/ssr-client` hydration support for Angular SSR client bootstrap.
 */
export function initAngularHydration(litElementClass?: unknown): boolean {
  return enableHydrationSupport(litElementClass);
}

/**
 * Non-destructively upgrades any `<mth-*>` custom elements inside an Angular-hydrated root
 * once their definitions are registered in `customElements`.
 */
export function upgradeMethaneAngularElements(
  root: ParentNode = document,
  tagPrefix = 'mth-',
): string[] {
  const upgraded: string[] = [];
  const elements = root.querySelectorAll('*');
  for (const el of elements) {
    const tag = el.localName;
    if (!tag.startsWith(tagPrefix)) continue;
    if (customElements.get(tag) !== undefined) {
      customElements.upgrade(el);
      upgraded.push(tag);
    }
  }
  return upgraded;
}

export function hydrateAngularContainer(
  value: unknown,
  container: Element | DocumentFragment,
  options?: RenderOptions,
): void {
  hydrateRoot(value, container, options);
}

export function isAngularHydrationReady(): boolean {
  return isHydrationSupported();
}

/**
 * Returns an initializer descriptor compatible with Angular `provideAppInitializer` /
 * `ENVIRONMENT_INITIALIZER` factories.
 */
export function provideMethaneHydration(
  litElementClass?: unknown,
): MethaneAngularHydrationProvider {
  return {
    name: 'MethaneHydrationProvider',
    initialize: (cls = litElementClass) => initAngularHydration(cls),
  };
}
