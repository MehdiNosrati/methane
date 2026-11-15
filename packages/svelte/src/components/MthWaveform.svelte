<script lang="ts">
  import type { MthWaveformProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthWaveformProps = $props();
</script>

<mth-waveform {...rest}>
  {@render children?.()}
</mth-waveform>
