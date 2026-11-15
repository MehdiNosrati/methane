<script lang="ts">
  import type { MthEmptyStateProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthEmptyStateProps = $props();
</script>

<mth-empty-state {...rest}>
  {@render children?.()}
</mth-empty-state>
