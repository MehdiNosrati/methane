<script lang="ts">
  import type { MthImageCropperProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthImageCropperProps = $props();
</script>

<mth-image-cropper {...rest}>
  {@render children?.()}
</mth-image-cropper>
