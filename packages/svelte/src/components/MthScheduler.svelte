<script lang="ts">
  import type { MthSchedulerProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSchedulerProps = $props();
</script>

<mth-scheduler {...rest}>
  {@render children?.()}
</mth-scheduler>
