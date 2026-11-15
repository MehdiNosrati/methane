<script lang="ts">
  import type { MthCartProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCartProps = $props();
</script>

<mth-cart {...rest}>
  {@render children?.()}
</mth-cart>
