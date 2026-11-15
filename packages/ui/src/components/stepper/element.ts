import { defineComponents } from '@methane-ui/core';
import { MthStepper } from './stepper.js';

export {
  MthStepper,
  type StepperOrientation,
  type StepperStatus,
  type StepperStepItem,
} from './stepper.js';
export { stepperMessages } from './stepper.messages.js';
export { stepperSpec } from './stepper.spec.js';
export { stepperStyles } from './stepper.styles.js';

export function registerMthStepper(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-stepper': MthStepper },
  });
}
