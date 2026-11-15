import { defineComponents } from '@methane-ui/core';
import { MthAvatarGroup } from './avatar-group.js';

export { MthAvatarGroup, type MthAvatarGroupSize } from './avatar-group.js';
export { avatarGroupMessages } from './avatar-group.messages.js';
export { avatarGroupStyles } from './avatar-group.styles.js';

export function registerMthAvatarGroup(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-avatar-group': MthAvatarGroup },
  });
}
