<script lang="ts">
  import type { MthLinkProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthLinkProps = $props();
</script>

<mth-link {...rest}>
  {@render children?.()}
</mth-link>
