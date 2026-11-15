<script lang="ts">
  import type { MthMapRouteProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthMapRouteProps = $props();
</script>

<mth-map-route {...rest}>
  {@render children?.()}
</mth-map-route>
