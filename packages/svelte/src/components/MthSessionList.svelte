<script lang="ts">
  import type { MthSessionListProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSessionListProps = $props();
</script>

<mth-session-list {...rest}>
  {@render children?.()}
</mth-session-list>
