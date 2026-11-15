import { defineComponents } from '@methane-ui/core';
import { MthCascader } from './cascader.js';

export { MthCascader, type CascaderChangeDetail, type CascaderOption } from './cascader.js';
export { cascaderMessages, type CascaderMessages } from './cascader.messages.js';
export { cascaderSpec } from './cascader.spec.js';
export { cascaderStyles } from './cascader.styles.js';

export function registerMthCascader(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-cascader': MthCascader },
  });
}
