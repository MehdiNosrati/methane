import { getRuntime } from '@methane/core';
import { MthPlanPicker } from './element.js';

export { MthPlanPicker, type BillingPlan } from './element.js';
export { planPickerMessages } from './plan-picker.messages.js';
export { planPickerSpec } from './plan-picker.spec.js';

export function registerMthPlanPicker(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-plan-picker': MthPlanPicker,
    },
  });
}

registerMthPlanPicker();
