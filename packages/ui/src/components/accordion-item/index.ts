import { registerMthAccordionItem } from './element.js';

export * from './element.js';

registerMthAccordionItem();

declare global {
  interface HTMLElementTagNameMap {
    'mth-accordion-item': import('./accordion-item.js').MthAccordionItem;
  }
}
