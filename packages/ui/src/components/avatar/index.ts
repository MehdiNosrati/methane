import { registerMthAvatar } from './element.js';

export * from './element.js';

registerMthAvatar();

declare global {
  interface HTMLElementTagNameMap {
    'mth-avatar': import('./avatar.js').MthAvatar;
  }
}
