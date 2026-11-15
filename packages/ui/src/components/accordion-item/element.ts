import { defineComponents } from '@methane-ui/core';
import { MthAccordionItem } from './accordion-item.js';

export { MthAccordionItem } from './accordion-item.js';
export { accordionItemMessages } from './accordion-item.messages.js';
export { accordionItemStyles } from './accordion-item.styles.js';

export function registerMthAccordionItem(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-accordion-item': MthAccordionItem },
  });
}
