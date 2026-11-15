<script lang="ts">
  import type { MthErrorSummaryProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthErrorSummaryProps = $props();
</script>

<mth-error-summary {...rest}>
  {@render children?.()}
</mth-error-summary>
