<script lang="ts">
  import type { MthImageProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthImageProps = $props();
</script>

<mth-image {...rest}>
  {@render children?.()}
</mth-image>
