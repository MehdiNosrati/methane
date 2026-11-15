import { defineComponents } from '@methane-ui/core';
import { MthCsvImporter } from './csv-importer.js';

export {
  MthCsvImporter,
  parseCsvMatrix,
  type CsvTargetField,
  type CsvValidatedRow,
} from './csv-importer.js';
export { csvImporterMessages } from './csv-importer.messages.js';
export { csvImporterSpec } from './csv-importer.spec.js';
export { csvImporterStyles } from './csv-importer.styles.js';

export function registerMthCsvImporter(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-csv-importer': MthCsvImporter },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-csv-importer': MthCsvImporter;
  }
}
