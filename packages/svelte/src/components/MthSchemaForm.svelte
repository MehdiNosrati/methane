<script lang="ts">
  import type { MthSchemaFormProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSchemaFormProps = $props();
</script>

<mth-schema-form {...rest}>
  {@render children?.()}
</mth-schema-form>
