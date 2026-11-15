<script lang="ts">
  import type { MthActivityFeedProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthActivityFeedProps = $props();
</script>

<mth-activity-feed {...rest}>
  {@render children?.()}
</mth-activity-feed>
