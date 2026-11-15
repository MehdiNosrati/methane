import { registerMthFormulaBar } from './element.js';
import type { MthFormulaBar } from './formula-bar.js';

export * from './element.js';

registerMthFormulaBar();

declare global {
  interface HTMLElementTagNameMap {
    'mth-formula-bar': MthFormulaBar;
  }
}
