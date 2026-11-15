import { defineComponents } from '@methane-ui/core';
import { MthStatCard } from './stat-card.js';

export {
  MthStatCard,
  type MthStatCardFormat,
  type MthStatCardTrend,
  type MthStatCardVariant,
} from './stat-card.js';
export { statCardMessages } from './stat-card.messages.js';
export { statCardStyles } from './stat-card.styles.js';

export function registerMthStatCard(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-stat-card': MthStatCard },
  });
}
