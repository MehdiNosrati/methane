import { getRuntime } from '@methane-ui/core';
import { MthNotificationBell } from './element.js';

export { MthNotificationBell, type NotificationBellItem } from './element.js';
export { notificationBellMessages } from './notification-bell.messages.js';
export { notificationBellSpec } from './notification-bell.spec.js';

export function registerMthNotificationBell(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-notification-bell': MthNotificationBell,
    },
  });
}

registerMthNotificationBell();
