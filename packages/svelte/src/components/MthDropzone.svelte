<script lang="ts">
  import type { MthDropzoneProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthDropzoneProps = $props();
</script>

<mth-dropzone {...rest}>
  {@render children?.()}
</mth-dropzone>
