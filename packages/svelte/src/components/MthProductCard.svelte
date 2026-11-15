<script lang="ts">
  import type { MthProductCardProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthProductCardProps = $props();
</script>

<mth-product-card {...rest}>
  {@render children?.()}
</mth-product-card>
