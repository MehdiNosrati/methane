import { defineComponents } from '@methane/core';
import { registerMthAvatar } from '@methane/ui/avatar/element.js';
import { registerMthBadge } from '@methane/ui/badge/element.js';
import { registerMthIcon } from '@methane/ui/icon/element.js';
import { MthProfileMenu } from './profile-menu.js';

export { MthProfileMenu, type ProfileMenuItem } from './profile-menu.js';
export { profileMenuMessages } from './profile-menu.messages.js';
export { profileMenuSpec } from './profile-menu.spec.js';
export { profileMenuStyles } from './profile-menu.styles.js';

export function registerMthProfileMenu(prefix?: string): ReadonlyArray<string> {
  registerMthAvatar();
  registerMthBadge();
  registerMthIcon();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-profile-menu': MthProfileMenu },
  });
}
