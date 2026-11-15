<script lang="ts">
  import type { MthTableProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthTableProps = $props();
</script>

<mth-table {...rest}>
  {@render children?.()}
</mth-table>
