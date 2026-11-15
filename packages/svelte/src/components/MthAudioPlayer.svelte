<script lang="ts">
  import type { MthAudioPlayerProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthAudioPlayerProps = $props();
</script>

<mth-audio-player {...rest}>
  {@render children?.()}
</mth-audio-player>
