import { defineComponents } from '@methane/core';
import { MthTabPanel } from './tab-panel.js';

export { MthTabPanel } from './tab-panel.js';
export { tabPanelMessages } from './tab-panel.messages.js';
export { tabPanelSpec } from './tab-panel.spec.js';
export { tabPanelStyles } from './tab-panel.styles.js';

export function registerMthTabPanel(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tab-panel': MthTabPanel },
  });
}
