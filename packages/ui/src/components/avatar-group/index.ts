import { registerMthAvatarGroup } from './element.js';

export * from './element.js';

registerMthAvatarGroup();

declare global {
  interface HTMLElementTagNameMap {
    'mth-avatar-group': import('./avatar-group.js').MthAvatarGroup;
  }
}
