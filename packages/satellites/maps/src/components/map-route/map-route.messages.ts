import type { MessageCatalog } from '@methane/core';

export const mapRouteMessages = {
  regionLabel: 'Map route',
  fitBounds: 'Fit route',
  stopsLabel: 'Route stops',
  originDefault: 'Origin',
  destinationDefault: 'Destination',
  waypointDefault: 'Stop {index}',
  distanceKm: '{distance} km ({stops} stops)',
  distanceMi: '{distance} mi ({stops} stops)',
  emptyRoute: 'No route configured',
} satisfies MessageCatalog;
