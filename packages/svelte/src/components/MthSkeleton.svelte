<script lang="ts">
  import type { MthSkeletonProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSkeletonProps = $props();
</script>

<mth-skeleton {...rest}>
  {@render children?.()}
</mth-skeleton>
