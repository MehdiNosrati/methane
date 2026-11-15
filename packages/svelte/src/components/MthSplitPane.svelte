<script lang="ts">
  import type { MthSplitPaneProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSplitPaneProps = $props();
</script>

<mth-split-pane {...rest}>
  {@render children?.()}
</mth-split-pane>
