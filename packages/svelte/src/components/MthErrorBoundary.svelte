<script lang="ts">
  import type { MthErrorBoundaryProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthErrorBoundaryProps = $props();
</script>

<mth-error-boundary {...rest}>
  {@render children?.()}
</mth-error-boundary>
