<script lang="ts">
  import type { MthBackToTopProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthBackToTopProps = $props();
</script>

<mth-back-to-top {...rest}>
  {@render children?.()}
</mth-back-to-top>
