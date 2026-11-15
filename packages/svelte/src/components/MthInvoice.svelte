<script lang="ts">
  import type { MthInvoiceProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthInvoiceProps = $props();
</script>

<mth-invoice {...rest}>
  {@render children?.()}
</mth-invoice>
