<script lang="ts">
  import type { MthZoomPanProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthZoomPanProps = $props();
</script>

<mth-zoom-pan {...rest}>
  {@render children?.()}
</mth-zoom-pan>
