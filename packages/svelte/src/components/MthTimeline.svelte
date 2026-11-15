<script lang="ts">
  import type { MthTimelineProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthTimelineProps = $props();
</script>

<mth-timeline {...rest}>
  {@render children?.()}
</mth-timeline>
