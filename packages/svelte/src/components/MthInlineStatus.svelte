<script lang="ts">
  import type { MthInlineStatusProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthInlineStatusProps = $props();
</script>

<mth-inline-status {...rest}>
  {@render children?.()}
</mth-inline-status>
