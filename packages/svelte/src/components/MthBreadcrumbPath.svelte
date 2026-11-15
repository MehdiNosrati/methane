<script lang="ts">
  import type { MthBreadcrumbPathProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthBreadcrumbPathProps = $props();
</script>

<mth-breadcrumb-path {...rest}>
  {@render children?.()}
</mth-breadcrumb-path>
