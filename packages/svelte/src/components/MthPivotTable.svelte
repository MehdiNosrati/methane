<script lang="ts">
  import type { MthPivotTableProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthPivotTableProps = $props();
</script>

<mth-pivot-table {...rest}>
  {@render children?.()}
</mth-pivot-table>
