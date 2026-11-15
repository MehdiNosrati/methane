<script lang="ts">
  import type { MthBulkActionBarProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthBulkActionBarProps = $props();
</script>

<mth-bulk-action-bar {...rest}>
  {@render children?.()}
</mth-bulk-action-bar>
