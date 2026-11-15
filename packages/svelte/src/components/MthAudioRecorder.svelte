<script lang="ts">
  import type { MthAudioRecorderProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthAudioRecorderProps = $props();
</script>

<mth-audio-recorder {...rest}>
  {@render children?.()}
</mth-audio-recorder>
