<script lang="ts">
  import type { MthTocProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthTocProps = $props();
</script>

<mth-toc {...rest}>
  {@render children?.()}
</mth-toc>
