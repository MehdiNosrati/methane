import { defineComponents } from '@methane-ui/core';
import { MthFormulaBar } from './formula-bar.js';

export { MthFormulaBar, type MthFormulaBarEngine } from './formula-bar.js';
export { formulaBarMessages } from './formula-bar.messages.js';
export { formulaBarSpec } from './formula-bar.spec.js';
export { formulaBarStyles } from './formula-bar.styles.js';

export function registerMthFormulaBar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-formula-bar': MthFormulaBar },
  });
}
