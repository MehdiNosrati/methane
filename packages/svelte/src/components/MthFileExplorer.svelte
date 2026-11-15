<script lang="ts">
  import type { MthFileExplorerProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthFileExplorerProps = $props();
</script>

<mth-file-explorer {...rest}>
  {@render children?.()}
</mth-file-explorer>
