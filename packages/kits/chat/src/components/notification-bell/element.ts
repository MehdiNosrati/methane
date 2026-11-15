import { defineComponents } from '@methane-ui/core';
import { MthNotificationBell } from './notification-bell.js';

export { MthNotificationBell, type NotificationBellItem } from './notification-bell.js';
export { notificationBellMessages } from './notification-bell.messages.js';

export function registerMthNotificationBell(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-notification-bell': MthNotificationBell },
  });
}
