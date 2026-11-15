<script lang="ts">
  import type { MthColumnProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthColumnProps = $props();
</script>

<mth-column {...rest}>
  {@render children?.()}
</mth-column>
