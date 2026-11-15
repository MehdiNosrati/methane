import { registerMthPlanPicker } from './element.js';

export * from './element.js';

registerMthPlanPicker();

declare global {
  interface HTMLElementTagNameMap {
    'mth-plan-picker': import('./plan-picker.js').MthPlanPicker;
  }
}
