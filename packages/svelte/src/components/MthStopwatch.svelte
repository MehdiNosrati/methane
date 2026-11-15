<script lang="ts">
  import type { MthStopwatchProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthStopwatchProps = $props();
</script>

<mth-stopwatch {...rest}>
  {@render children?.()}
</mth-stopwatch>
