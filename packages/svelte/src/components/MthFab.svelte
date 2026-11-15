<script lang="ts">
  import type { MthFabProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthFabProps = $props();
</script>

<mth-fab {...rest}>
  {@render children?.()}
</mth-fab>
