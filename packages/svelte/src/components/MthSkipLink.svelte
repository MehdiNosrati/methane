<script lang="ts">
  import type { MthSkipLinkProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSkipLinkProps = $props();
</script>

<mth-skip-link {...rest}>
  {@render children?.()}
</mth-skip-link>
