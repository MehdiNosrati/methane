import { defineComponents } from '@methane-ui/core';
import { MthSchemaForm } from './schema-form.js';

export {
  MthSchemaForm,
  type JsonSchemaSubset,
  type SchemaPropertyDefinition,
  type SchemaPropertyType,
  type SchemaStringFormat,
} from './schema-form.js';
export { schemaFormMessages } from './schema-form.messages.js';
export { schemaFormStyles } from './schema-form.styles.js';

export function registerMthSchemaForm(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-schema-form': MthSchemaForm },
  });
}
