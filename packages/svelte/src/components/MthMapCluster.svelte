<script lang="ts">
  import type { MthMapClusterProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthMapClusterProps = $props();
</script>

<mth-map-cluster {...rest}>
  {@render children?.()}
</mth-map-cluster>
