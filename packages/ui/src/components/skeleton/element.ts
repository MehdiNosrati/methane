import { defineComponents } from '@methane-ui/core';
import { MthSkeleton } from './skeleton.js';

export { MthSkeleton, type MthSkeletonVariant } from './skeleton.js';
export { skeletonMessages } from './skeleton.messages.js';
export { skeletonStyles } from './skeleton.styles.js';

export function registerMthSkeleton(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-skeleton': MthSkeleton },
  });
}
