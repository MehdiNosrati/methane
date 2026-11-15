<script lang="ts">
  import type { MthButtonProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthButtonProps = $props();
</script>

<mth-button {...rest}>
  {@render children?.()}
</mth-button>
