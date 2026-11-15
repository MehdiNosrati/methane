<script lang="ts">
  import type { MthBeforeAfterProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthBeforeAfterProps = $props();
</script>

<mth-before-after {...rest}>
  {@render children?.()}
</mth-before-after>
