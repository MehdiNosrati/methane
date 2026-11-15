import { defineComponents } from '@methane-ui/core';
import { MthDatagrid } from './datagrid.js';

export { MthDatagrid, type DatagridColumn, type MthDatagridEngine } from './datagrid.js';
export { datagridMessages } from './datagrid.messages.js';
export { datagridStyles } from './datagrid.styles.js';

export function registerMthDatagrid(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-datagrid': MthDatagrid },
  });
}
