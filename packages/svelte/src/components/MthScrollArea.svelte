<script lang="ts">
  import type { MthScrollAreaProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthScrollAreaProps = $props();
</script>

<mth-scroll-area {...rest}>
  {@render children?.()}
</mth-scroll-area>
