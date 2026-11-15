import { registerMthCallout } from './element.js';
import type { MthCallout } from './callout.js';

registerMthCallout();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-callout': MthCallout;
  }
}
