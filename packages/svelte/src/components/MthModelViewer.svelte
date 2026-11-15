<script lang="ts">
  import type { MthModelViewerProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthModelViewerProps = $props();
</script>

<mth-model-viewer {...rest}>
  {@render children?.()}
</mth-model-viewer>
