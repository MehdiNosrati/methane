<script lang="ts">
  import type { MthBannerProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthBannerProps = $props();
</script>

<mth-banner {...rest}>
  {@render children?.()}
</mth-banner>
