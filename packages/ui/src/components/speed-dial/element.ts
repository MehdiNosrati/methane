import { defineComponents } from '@methane/core';
import { MthSpeedDial } from './speed-dial.js';

export {
  MthSpeedDial,
  type MthSpeedDialAction,
  type MthSpeedDialDirection,
  type MthSpeedDialSize,
  type MthSpeedDialVariant,
} from './speed-dial.js';
export { speedDialMessages } from './speed-dial.messages.js';
export { speedDialSpec } from './speed-dial.spec.js';
export { speedDialStyles } from './speed-dial.styles.js';

export function registerMthSpeedDial(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-speed-dial': MthSpeedDial },
  });
}
