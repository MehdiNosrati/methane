import { defineComponents } from '@methane-ui/core';
import { MthNotificationCenter } from './notification-center.js';

export { MthNotificationCenter } from './notification-center.js';
export { notificationCenterMessages } from './notification-center.messages.js';
export { notificationCenterSpec } from './notification-center.spec.js';
export { notificationCenterStyles } from './notification-center.styles.js';

export function registerMthNotificationCenter(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-notification-center': MthNotificationCenter,
    },
  });
}
