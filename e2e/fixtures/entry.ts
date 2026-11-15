import '@methane-ui/core';
import { registerUtilityElements } from '@methane-ui/primitives';
import '@methane-ui/sanitize';
import { registerAllComponents } from '@methane-ui/ui';

registerUtilityElements();
registerAllComponents();

(window as unknown as { __METHANE_READY__?: boolean }).__METHANE_READY__ = true;
