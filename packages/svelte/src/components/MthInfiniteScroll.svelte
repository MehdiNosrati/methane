<script lang="ts">
  import type { MthInfiniteScrollProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthInfiniteScrollProps = $props();
</script>

<mth-infinite-scroll {...rest}>
  {@render children?.()}
</mth-infinite-scroll>
