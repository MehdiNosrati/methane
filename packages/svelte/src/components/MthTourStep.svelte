<script lang="ts">
  import type { MthTourStepProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthTourStepProps = $props();
</script>

<mth-tour-step {...rest}>
  {@render children?.()}
</mth-tour-step>
