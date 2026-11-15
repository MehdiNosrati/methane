<script lang="ts">
  import type { MthScreenRecorderProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthScreenRecorderProps = $props();
</script>

<mth-screen-recorder {...rest}>
  {@render children?.()}
</mth-screen-recorder>
