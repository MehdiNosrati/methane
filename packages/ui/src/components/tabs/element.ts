import { defineComponents } from '@methane-ui/core';
import { MthTabs } from './tabs.js';

export { MthTabs, type MthTabsActivation, type MthTabsOrientation } from './tabs.js';
export { tabsMessages } from './tabs.messages.js';
export { tabsSpec } from './tabs.spec.js';
export { tabsStyles } from './tabs.styles.js';

export function registerMthTabs(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tabs': MthTabs },
  });
}
