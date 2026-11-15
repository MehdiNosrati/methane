<script lang="ts">
  import type { MthImageAnnotatorProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthImageAnnotatorProps = $props();
</script>

<mth-image-annotator {...rest}>
  {@render children?.()}
</mth-image-annotator>
