<script lang="ts">
  import type { MthStatusIndicatorProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthStatusIndicatorProps = $props();
</script>

<mth-status-indicator {...rest}>
  {@render children?.()}
</mth-status-indicator>
