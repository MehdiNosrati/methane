<script lang="ts">
  import type { MthMapProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthMapProps = $props();
</script>

<mth-map {...rest}>
  {@render children?.()}
</mth-map>
