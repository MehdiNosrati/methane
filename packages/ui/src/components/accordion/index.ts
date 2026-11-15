import { registerMthAccordion } from './element.js';

export * from './element.js';

registerMthAccordion();

declare global {
  interface HTMLElementTagNameMap {
    'mth-accordion': import('./accordion.js').MthAccordion;
  }
}
