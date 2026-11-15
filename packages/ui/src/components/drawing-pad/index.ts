import { registerMthDrawingPad } from './element.js';

export * from './element.js';

registerMthDrawingPad();

declare global {
  interface HTMLElementTagNameMap {
    'mth-drawing-pad': import('./drawing-pad.js').MthDrawingPad;
  }
}
