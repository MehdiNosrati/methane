import { defineComponents } from '@methane/core';
import { MthIcon } from './icon.js';

export { ICON_CATALOG, MthIcon, type MthIconName, type MthIconSize } from './icon.js';
export { iconMessages } from './icon.messages.js';
export { iconSpec } from './icon.spec.js';
export { iconStyles } from './icon.styles.js';

export function registerMthIcon(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-icon': MthIcon },
  });
}
