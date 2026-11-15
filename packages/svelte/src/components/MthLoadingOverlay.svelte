<script lang="ts">
  import type { MthLoadingOverlayProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthLoadingOverlayProps = $props();
</script>

<mth-loading-overlay {...rest}>
  {@render children?.()}
</mth-loading-overlay>
