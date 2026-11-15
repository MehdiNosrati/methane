<script lang="ts">
  import type { MthSortableProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSortableProps = $props();
</script>

<mth-sortable {...rest}>
  {@render children?.()}
</mth-sortable>
