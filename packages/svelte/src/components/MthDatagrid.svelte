<script lang="ts">
  import type { MthDatagridProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthDatagridProps = $props();
</script>

<mth-datagrid {...rest}>
  {@render children?.()}
</mth-datagrid>
