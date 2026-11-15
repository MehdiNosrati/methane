<script lang="ts">
  import type { MthCarouselProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCarouselProps = $props();
</script>

<mth-carousel {...rest}>
  {@render children?.()}
</mth-carousel>
