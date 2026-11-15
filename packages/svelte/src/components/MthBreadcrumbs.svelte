<script lang="ts">
  import type { MthBreadcrumbsProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthBreadcrumbsProps = $props();
</script>

<mth-breadcrumbs {...rest}>
  {@render children?.()}
</mth-breadcrumbs>
