import { registerMthTour } from './element.js';
import type { MthTour } from './tour.js';

registerMthTour();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-tour': MthTour;
  }
}
