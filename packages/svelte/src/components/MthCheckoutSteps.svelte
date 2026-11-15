<script lang="ts">
  import type { MthCheckoutStepsProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCheckoutStepsProps = $props();
</script>

<mth-checkout-steps {...rest}>
  {@render children?.()}
</mth-checkout-steps>
