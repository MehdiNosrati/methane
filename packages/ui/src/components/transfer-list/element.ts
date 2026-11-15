import { defineComponents } from '@methane-ui/core';
import { MthTransferList } from './transfer-list.js';

export {
  MthTransferList,
  type TransferListChangeDetail,
  type TransferListItem,
} from './transfer-list.js';
export { transferListMessages, type TransferListMessages } from './transfer-list.messages.js';
export { transferListStyles } from './transfer-list.styles.js';

export function registerMthTransferList(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-transfer-list': MthTransferList },
  });
}
