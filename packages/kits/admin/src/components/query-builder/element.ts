import { defineComponents } from '@methane-ui/core';
import { MthQueryBuilder } from './query-builder.js';

export {
  MthQueryBuilder,
  type QueryFieldDef,
  type QueryGroup,
  type QueryLeafRule,
} from './query-builder.js';
export { queryBuilderMessages } from './query-builder.messages.js';
export { queryBuilderSpec } from './query-builder.spec.js';
export { queryBuilderStyles } from './query-builder.styles.js';

export function registerMthQueryBuilder(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-query-builder': MthQueryBuilder },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-query-builder': MthQueryBuilder;
  }
}
