import { defineComponents } from '@methane/core';
import { MthAvatar } from './avatar.js';

export {
  MthAvatar,
  type MthAvatarShape,
  type MthAvatarSize,
  type MthAvatarStatus,
} from './avatar.js';
export { avatarMessages } from './avatar.messages.js';
export { avatarSpec } from './avatar.spec.js';
export { avatarStyles } from './avatar.styles.js';

export function registerMthAvatar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-avatar': MthAvatar },
  });
}
