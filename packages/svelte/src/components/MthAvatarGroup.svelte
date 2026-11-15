<script lang="ts">
  import type { MthAvatarGroupProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthAvatarGroupProps = $props();
</script>

<mth-avatar-group {...rest}>
  {@render children?.()}
</mth-avatar-group>
