<script lang="ts">
  import type { MthVideoPlayerProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthVideoPlayerProps = $props();
</script>

<mth-video-player {...rest}>
  {@render children?.()}
</mth-video-player>
