import { registerMthInlineStatus } from './element.js';
import type { MthInlineStatus } from './inline-status.js';

registerMthInlineStatus();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-inline-status': MthInlineStatus;
  }
}
