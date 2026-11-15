import { defineComponents } from '@methane-ui/core';
import { MthDrawingPad } from './drawing-pad.js';

export function registerMthDrawingPad(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-drawing-pad': MthDrawingPad },
  });
}

export { MthDrawingPad, type DrawingPoint, type DrawingStroke, type DrawingTool } from './drawing-pad.js';
export { drawingPadMessages } from './drawing-pad.messages.js';
export { drawingPadSpec } from './drawing-pad.spec.js';
export { drawingPadStyles } from './drawing-pad.styles.js';
