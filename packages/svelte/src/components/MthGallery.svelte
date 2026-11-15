<script lang="ts">
  import type { MthGalleryProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthGalleryProps = $props();
</script>

<mth-gallery {...rest}>
  {@render children?.()}
</mth-gallery>
