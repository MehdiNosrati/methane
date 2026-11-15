import { defineComponents } from '@methane/core';
import { MthColumn } from './column.js';

export { MthColumn, type MthColumnAlign, type MthColumnPin } from './column.js';
export { columnMessages } from './column.messages.js';
export { columnSpec } from './column.spec.js';
export { columnStyles } from './column.styles.js';

export function registerMthColumn(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-column': MthColumn },
  });
}
