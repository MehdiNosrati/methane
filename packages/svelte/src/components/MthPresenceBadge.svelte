<script lang="ts">
  import type { MthPresenceBadgeProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthPresenceBadgeProps = $props();
</script>

<mth-presence-badge {...rest}>
  {@render children?.()}
</mth-presence-badge>
