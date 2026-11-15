<script lang="ts">
  import type { MthShareButtonProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthShareButtonProps = $props();
</script>

<mth-share-button {...rest}>
  {@render children?.()}
</mth-share-button>
