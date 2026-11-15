<script lang="ts">
  import type { MthComparisonTableProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthComparisonTableProps = $props();
</script>

<mth-comparison-table {...rest}>
  {@render children?.()}
</mth-comparison-table>
