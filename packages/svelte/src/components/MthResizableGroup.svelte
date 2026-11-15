<script lang="ts">
  import type { MthResizableGroupProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthResizableGroupProps = $props();
</script>

<mth-resizable-group {...rest}>
  {@render children?.()}
</mth-resizable-group>
