<script lang="ts">
  import type { MthPdfViewerProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthPdfViewerProps = $props();
</script>

<mth-pdf-viewer {...rest}>
  {@render children?.()}
</mth-pdf-viewer>
