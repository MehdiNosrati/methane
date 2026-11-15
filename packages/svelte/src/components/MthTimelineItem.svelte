<script lang="ts">
  import type { MthTimelineItemProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthTimelineItemProps = $props();
</script>

<mth-timeline-item {...rest}>
  {@render children?.()}
</mth-timeline-item>
