<script lang="ts">
  import type { MthGanttProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthGanttProps = $props();
</script>

<mth-gantt {...rest}>
  {@render children?.()}
</mth-gantt>
