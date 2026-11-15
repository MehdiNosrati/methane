import { defineComponents } from '@methane/core';
import { MthFloorPlan } from './floor-plan.js';
import { floorPlanMessages } from './floor-plan.messages.js';
import { floorPlanSpec } from './floor-plan.spec.js';
import { floorPlanStyles } from './floor-plan.styles.js';

export { MthFloorPlan, floorPlanMessages, floorPlanSpec, floorPlanStyles };
export type { FloorPlanRoom } from './floor-plan.js';

export function registerMthFloorPlan(prefix?: string): string {
  return defineComponents({
    ...(prefix ? { prefix } : {}),
    components: { 'mth-floor-plan': MthFloorPlan },
  })[0]!;
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-floor-plan': MthFloorPlan;
  }
}
