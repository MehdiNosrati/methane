<script lang="ts">
  import type { MthFacetFiltersProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthFacetFiltersProps = $props();
</script>

<mth-facet-filters {...rest}>
  {@render children?.()}
</mth-facet-filters>
