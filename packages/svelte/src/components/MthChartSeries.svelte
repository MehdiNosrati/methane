<script lang="ts">
  import type { MthChartSeriesProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthChartSeriesProps = $props();
</script>

<mth-chart-series {...rest}>
  {@render children?.()}
</mth-chart-series>
