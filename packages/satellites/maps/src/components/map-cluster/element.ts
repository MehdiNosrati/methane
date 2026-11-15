import { defineComponents } from '@methane/core';
import { MthMapCluster } from './map-cluster.js';
import { mapClusterMessages } from './map-cluster.messages.js';
import { mapClusterSpec } from './map-cluster.spec.js';
import { mapClusterStyles } from './map-cluster.styles.js';

export { MthMapCluster, mapClusterMessages, mapClusterSpec, mapClusterStyles };
export type { ClusterPoint, ComputedCluster } from './map-cluster.js';

export function registerMthMapCluster(prefix?: string): string {
  return defineComponents({
    ...(prefix ? { prefix } : {}),
    components: { 'mth-map-cluster': MthMapCluster },
  })[0]!;
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-map-cluster': MthMapCluster;
  }
}
