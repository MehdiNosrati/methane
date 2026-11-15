<script lang="ts">
  import type { MthVideoGridProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthVideoGridProps = $props();
</script>

<mth-video-grid {...rest}>
  {@render children?.()}
</mth-video-grid>
