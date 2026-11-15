<script lang="ts">
  import type { MthBottomNavProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthBottomNavProps = $props();
</script>

<mth-bottom-nav {...rest}>
  {@render children?.()}
</mth-bottom-nav>
