<script lang="ts">
  import type { MthBadgeProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthBadgeProps = $props();
</script>

<mth-badge {...rest}>
  {@render children?.()}
</mth-badge>
