<script lang="ts">
  import type { MthCardProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCardProps = $props();
</script>

<mth-card {...rest}>
  {@render children?.()}
</mth-card>
