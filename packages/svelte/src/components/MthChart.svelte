<script lang="ts">
  import type { MthChartProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthChartProps = $props();
</script>

<mth-chart {...rest}>
  {@render children?.()}
</mth-chart>
