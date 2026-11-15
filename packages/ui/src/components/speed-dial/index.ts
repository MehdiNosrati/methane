import { registerMthSpeedDial } from './element.js';

export * from './element.js';

registerMthSpeedDial();

declare global {
  interface HTMLElementTagNameMap {
    'mth-speed-dial': import('./speed-dial.js').MthSpeedDial;
  }
}
