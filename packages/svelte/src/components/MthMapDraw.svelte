<script lang="ts">
  import type { MthMapDrawProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthMapDrawProps = $props();
</script>

<mth-map-draw {...rest}>
  {@render children?.()}
</mth-map-draw>
