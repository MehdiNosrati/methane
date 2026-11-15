<script lang="ts">
  import type { MthCountdownProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCountdownProps = $props();
</script>

<mth-countdown {...rest}>
  {@render children?.()}
</mth-countdown>
