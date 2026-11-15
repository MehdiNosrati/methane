<script lang="ts">
  import type { MthMenubarProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthMenubarProps = $props();
</script>

<mth-menubar {...rest}>
  {@render children?.()}
</mth-menubar>
