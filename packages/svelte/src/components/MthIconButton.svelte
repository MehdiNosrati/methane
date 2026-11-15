<script lang="ts">
  import type { MthIconButtonProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthIconButtonProps = $props();
</script>

<mth-icon-button {...rest}>
  {@render children?.()}
</mth-icon-button>
