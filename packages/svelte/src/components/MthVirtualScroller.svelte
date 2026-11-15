<script lang="ts">
  import type { MthVirtualScrollerProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthVirtualScrollerProps = $props();
</script>

<mth-virtual-scroller {...rest}>
  {@render children?.()}
</mth-virtual-scroller>
