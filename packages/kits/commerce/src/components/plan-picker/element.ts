import { defineComponents } from '@methane-ui/core';
import { MthPlanPicker } from './plan-picker.js';

export { MthPlanPicker, type BillingPlan } from './plan-picker.js';
export { planPickerMessages } from './plan-picker.messages.js';

export function registerMthPlanPicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-plan-picker': MthPlanPicker },
  });
}
