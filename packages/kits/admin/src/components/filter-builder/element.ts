import { defineComponents } from '@methane/core';
import { MthFilterBuilder } from './filter-builder.js';

export {
  MthFilterBuilder,
  type FilterCombinator,
  type FilterFieldDef,
  type FilterRule,
} from './filter-builder.js';
export { filterBuilderMessages } from './filter-builder.messages.js';
export { filterBuilderSpec } from './filter-builder.spec.js';
export { filterBuilderStyles } from './filter-builder.styles.js';

export function registerMthFilterBuilder(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-filter-builder': MthFilterBuilder },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-filter-builder': MthFilterBuilder;
  }
}
