<script lang="ts">
  import type { MthSpinnerProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSpinnerProps = $props();
</script>

<mth-spinner {...rest}>
  {@render children?.()}
</mth-spinner>
