<script lang="ts">
  import type { MthVisuallyHiddenProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthVisuallyHiddenProps = $props();
</script>

<mth-visually-hidden {...rest}>
  {@render children?.()}
</mth-visually-hidden>
