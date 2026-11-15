import { registerAllComponents as registerChartsComponents } from '@methane-ui/charts';
import { registerAllComponents as registerCodeComponents } from '@methane-ui/code';
import { registerAllComponents as registerDatagridComponents } from '@methane-ui/datagrid';
import { registerAllComponents as registerSpreadsheetComponents } from '@methane-ui/spreadsheet';

registerChartsComponents();
registerCodeComponents();
registerDatagridComponents();
registerSpreadsheetComponents();

(window as unknown as { __METHANE_SATELLITES_READY__?: boolean }).__METHANE_SATELLITES_READY__ =
  true;
