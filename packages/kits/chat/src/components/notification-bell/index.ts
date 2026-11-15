import { registerMthNotificationBell } from './element.js';

export * from './element.js';

registerMthNotificationBell();

declare global {
  interface HTMLElementTagNameMap {
    'mth-notification-bell': import('./notification-bell.js').MthNotificationBell;
  }
}
