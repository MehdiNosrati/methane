<script lang="ts">
  import type { MthSavedViewsProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSavedViewsProps = $props();
</script>

<mth-saved-views {...rest}>
  {@render children?.()}
</mth-saved-views>
