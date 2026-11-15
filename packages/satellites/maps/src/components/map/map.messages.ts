import type { MessageCatalog } from '@methane-ui/core';

export const mapMessages = {
  regionLabel: 'Interactive map',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resetView: 'Reset map view',
  controlsLabel: 'Map controls',
  statusSummary: 'Center {lat}, {lng} at zoom {zoom}',
  markerLabel: 'Marker: {label}',
  unnamedMarker: 'Map marker {id}',
} satisfies MessageCatalog;
