import { defineComponents } from '@methane/core';
import { MthCard } from './card.js';

export { MthCard, type MthCardVariant } from './card.js';
export { cardMessages } from './card.messages.js';
export { cardSpec } from './card.spec.js';
export { cardStyles } from './card.styles.js';

export function registerMthCard(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-card': MthCard },
  });
}
