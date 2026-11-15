import { defineComponents } from '@methane/core';
import { MthStep } from './step.js';

export { MthStep, type StepStatus } from './step.js';
export { stepMessages } from './step.messages.js';
export { stepSpec } from './step.spec.js';
export { stepStyles } from './step.styles.js';

export function registerMthStep(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-step': MthStep },
  });
}
