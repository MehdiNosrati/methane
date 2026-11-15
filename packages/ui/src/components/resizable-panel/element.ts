import { defineComponents } from '@methane/core';
import { MthResizablePanel } from './resizable-panel.js';

export { MthResizablePanel } from './resizable-panel.js';
export { resizablePanelMessages } from './resizable-panel.messages.js';
export { resizablePanelSpec } from './resizable-panel.spec.js';
export { resizablePanelStyles } from './resizable-panel.styles.js';

export function registerMthResizablePanel(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-resizable-panel': MthResizablePanel },
  });
}
