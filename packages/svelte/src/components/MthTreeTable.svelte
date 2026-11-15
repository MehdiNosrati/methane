<script lang="ts">
  import type { MthTreeTableProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthTreeTableProps = $props();
</script>

<mth-tree-table {...rest}>
  {@render children?.()}
</mth-tree-table>
