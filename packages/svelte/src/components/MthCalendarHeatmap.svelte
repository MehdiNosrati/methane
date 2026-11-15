<script lang="ts">
  import type { MthCalendarHeatmapProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCalendarHeatmapProps = $props();
</script>

<mth-calendar-heatmap {...rest}>
  {@render children?.()}
</mth-calendar-heatmap>
