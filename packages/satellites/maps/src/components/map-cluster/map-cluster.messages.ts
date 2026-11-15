import type { MessageCatalog } from '@methane/core';

export const mapClusterMessages = {
  regionLabel: 'Clustered map layer',
  clusterListLabel: 'Map clusters',
  clusterItemLabel: 'Cluster of {count} locations',
  pointItemLabel: 'Location: {label}',
  summaryText: '{clusters} clusters from {total} points at zoom {zoom}',
} satisfies MessageCatalog;
