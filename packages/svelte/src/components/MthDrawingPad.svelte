<script lang="ts">
  import type { MthDrawingPadProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthDrawingPadProps = $props();
</script>

<mth-drawing-pad {...rest}>
  {@render children?.()}
</mth-drawing-pad>
