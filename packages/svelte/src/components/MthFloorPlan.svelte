<script lang="ts">
  import type { MthFloorPlanProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthFloorPlanProps = $props();
</script>

<mth-floor-plan {...rest}>
  {@render children?.()}
</mth-floor-plan>
