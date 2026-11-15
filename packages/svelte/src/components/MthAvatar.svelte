<script lang="ts">
  import type { MthAvatarProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthAvatarProps = $props();
</script>

<mth-avatar {...rest}>
  {@render children?.()}
</mth-avatar>
