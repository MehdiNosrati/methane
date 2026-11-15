import { defineComponents } from '@methane/core';
import { MthFloatingPanel } from './floating-panel.js';

export { MthFloatingPanel, type FloatingPanelDock } from './floating-panel.js';
export { floatingPanelMessages } from './floating-panel.messages.js';
export { floatingPanelSpec } from './floating-panel.spec.js';
export { floatingPanelStyles } from './floating-panel.styles.js';

export function registerMthFloatingPanel(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-floating-panel': MthFloatingPanel,
    },
  });
}
