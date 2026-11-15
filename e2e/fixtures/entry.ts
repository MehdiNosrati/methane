import '@methane/core';
import { registerUtilityElements } from '@methane/primitives';
import '@methane/sanitize';
import { registerAllComponents } from '@methane/ui';

registerUtilityElements();
registerAllComponents();

(window as unknown as { __METHANE_READY__?: boolean }).__METHANE_READY__ = true;
