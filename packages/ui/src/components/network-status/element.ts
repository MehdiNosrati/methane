import { defineComponents } from '@methane-ui/core';
import { MthNetworkStatus } from './network-status.js';

export { MthNetworkStatus } from './network-status.js';
export { networkStatusMessages } from './network-status.messages.js';
export { networkStatusStyles } from './network-status.styles.js';

export function registerMthNetworkStatus(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-network-status': MthNetworkStatus,
    },
  });
}
