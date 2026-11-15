<script lang="ts">
  import type { MthMasonryProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthMasonryProps = $props();
</script>

<mth-masonry {...rest}>
  {@render children?.()}
</mth-masonry>
