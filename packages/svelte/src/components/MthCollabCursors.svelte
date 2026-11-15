<script lang="ts">
  import type { MthCollabCursorsProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCollabCursorsProps = $props();
</script>

<mth-collab-cursors {...rest}>
  {@render children?.()}
</mth-collab-cursors>
