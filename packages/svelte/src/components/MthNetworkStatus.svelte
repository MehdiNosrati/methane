<script lang="ts">
  import type { MthNetworkStatusProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthNetworkStatusProps = $props();
</script>

<mth-network-status {...rest}>
  {@render children?.()}
</mth-network-status>
