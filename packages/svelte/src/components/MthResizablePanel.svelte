<script lang="ts">
  import type { MthResizablePanelProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthResizablePanelProps = $props();
</script>

<mth-resizable-panel {...rest}>
  {@render children?.()}
</mth-resizable-panel>
