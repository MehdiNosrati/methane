<script lang="ts">
  import type { MthIconProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthIconProps = $props();
</script>

<mth-icon {...rest}>
  {@render children?.()}
</mth-icon>
