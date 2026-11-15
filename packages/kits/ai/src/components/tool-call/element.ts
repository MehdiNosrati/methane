import { defineComponents } from '@methane-ui/core';
import { registerMthBadge } from '@methane-ui/ui/badge/element.js';
import { registerMthIcon } from '@methane-ui/ui/icon/element.js';
import { registerMthSpinner } from '@methane-ui/ui/spinner/element.js';
import { MthToolCall } from './tool-call.js';

export { MthToolCall, type MthToolCallStatus } from './tool-call.js';
export { toolCallMessages } from './tool-call.messages.js';
export { toolCallSpec } from './tool-call.spec.js';
export { toolCallStyles } from './tool-call.styles.js';

export function registerMthToolCall(prefix?: string): ReadonlyArray<string> {
  registerMthBadge();
  registerMthIcon();
  registerMthSpinner();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tool-call': MthToolCall },
  });
}
