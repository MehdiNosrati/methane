<script lang="ts">
  import type { MthPriceDisplayProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthPriceDisplayProps = $props();
</script>

<mth-price-display {...rest}>
  {@render children?.()}
</mth-price-display>
