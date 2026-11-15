<script lang="ts">
  import type { MthCameraCaptureProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCameraCaptureProps = $props();
</script>

<mth-camera-capture {...rest}>
  {@render children?.()}
</mth-camera-capture>
