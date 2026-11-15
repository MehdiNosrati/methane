<script lang="ts">
  import type { MthDiffViewerProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthDiffViewerProps = $props();
</script>

<mth-diff-viewer {...rest}>
  {@render children?.()}
</mth-diff-viewer>
