import { defineComponents } from '@methane-ui/core';
import { MthShareButton } from './share-button.js';

export {
  MthShareButton,
  type MthShareButtonSize,
  type MthShareButtonVariant,
} from './share-button.js';
export { shareButtonMessages } from './share-button.messages.js';
export { shareButtonStyles } from './share-button.styles.js';

export function registerMthShareButton(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-share-button': MthShareButton },
  });
}
