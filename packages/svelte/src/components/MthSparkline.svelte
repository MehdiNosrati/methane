<script lang="ts">
  import type { MthSparklineProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSparklineProps = $props();
</script>

<mth-sparkline {...rest}>
  {@render children?.()}
</mth-sparkline>
