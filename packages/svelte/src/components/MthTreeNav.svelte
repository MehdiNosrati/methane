<script lang="ts">
  import type { MthTreeNavProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthTreeNavProps = $props();
</script>

<mth-tree-nav {...rest}>
  {@render children?.()}
</mth-tree-nav>
