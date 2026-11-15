import { registerMthFloatingPanel } from './element.js';
import type { MthFloatingPanel } from './floating-panel.js';

registerMthFloatingPanel();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-floating-panel': MthFloatingPanel;
  }
}
