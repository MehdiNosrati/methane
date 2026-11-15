import { registerMthNetworkStatus } from './element.js';
import type { MthNetworkStatus } from './network-status.js';

registerMthNetworkStatus();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-network-status': MthNetworkStatus;
  }
}
