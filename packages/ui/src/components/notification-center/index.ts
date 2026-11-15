import { registerMthNotificationCenter } from './element.js';
import type { MthNotificationCenter } from './notification-center.js';

registerMthNotificationCenter();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-notification-center': MthNotificationCenter;
  }
}
