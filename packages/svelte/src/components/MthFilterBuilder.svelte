<script lang="ts">
  import type { MthFilterBuilderProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthFilterBuilderProps = $props();
</script>

<mth-filter-builder {...rest}>
  {@render children?.()}
</mth-filter-builder>
