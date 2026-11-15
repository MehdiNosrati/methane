import { registerMthDatagrid } from './element.js';
import type { MthDatagrid } from './datagrid.js';

export * from './element.js';

registerMthDatagrid();

declare global {
  interface HTMLElementTagNameMap {
    'mth-datagrid': MthDatagrid;
  }
}
