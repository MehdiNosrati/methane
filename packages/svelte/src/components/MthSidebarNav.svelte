<script lang="ts">
  import type { MthSidebarNavProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSidebarNavProps = $props();
</script>

<mth-sidebar-nav {...rest}>
  {@render children?.()}
</mth-sidebar-nav>
