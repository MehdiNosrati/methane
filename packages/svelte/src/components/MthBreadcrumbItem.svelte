<script lang="ts">
  import type { MthBreadcrumbItemProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthBreadcrumbItemProps = $props();
</script>

<mth-breadcrumb-item {...rest}>
  {@render children?.()}
</mth-breadcrumb-item>
