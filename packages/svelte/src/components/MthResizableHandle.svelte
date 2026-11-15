<script lang="ts">
  import type { MthResizableHandleProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthResizableHandleProps = $props();
</script>

<mth-resizable-handle {...rest}>
  {@render children?.()}
</mth-resizable-handle>
