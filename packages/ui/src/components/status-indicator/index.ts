import { registerMthStatusIndicator } from './element.js';
import type { MthStatusIndicator } from './status-indicator.js';

registerMthStatusIndicator();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-status-indicator': MthStatusIndicator;
  }
}
