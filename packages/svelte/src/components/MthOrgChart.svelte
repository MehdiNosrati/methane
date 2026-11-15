<script lang="ts">
  import type { MthOrgChartProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthOrgChartProps = $props();
</script>

<mth-org-chart {...rest}>
  {@render children?.()}
</mth-org-chart>
