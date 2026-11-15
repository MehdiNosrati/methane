import { registerMthSwitch } from './element.js';

export * from './element.js';

registerMthSwitch();

declare global {
  interface HTMLElementTagNameMap {
    'mth-switch': import('./switch.js').MthSwitch;
  }
}
