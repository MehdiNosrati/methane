<script lang="ts">
  import type { MthLoadMoreProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthLoadMoreProps = $props();
</script>

<mth-load-more {...rest}>
  {@render children?.()}
</mth-load-more>
