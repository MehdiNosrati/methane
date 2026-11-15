<script lang="ts">
  import type { MthPaginationProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthPaginationProps = $props();
</script>

<mth-pagination {...rest}>
  {@render children?.()}
</mth-pagination>
