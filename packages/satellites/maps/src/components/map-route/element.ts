import { defineComponents } from '@methane-ui/core';
import { MthMapRoute } from './map-route.js';
import { mapRouteMessages } from './map-route.messages.js';
import { mapRouteSpec } from './map-route.spec.js';
import { mapRouteStyles } from './map-route.styles.js';

export { MthMapRoute, mapRouteMessages, mapRouteSpec, mapRouteStyles };
export type { RouteWaypoint } from './map-route.js';

export function registerMthMapRoute(prefix?: string): string {
  return defineComponents({
    ...(prefix ? { prefix } : {}),
    components: { 'mth-map-route': MthMapRoute },
  })[0]!;
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-map-route': MthMapRoute;
  }
}
