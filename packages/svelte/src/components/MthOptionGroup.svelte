<script lang="ts">
  import type { MthOptionGroupProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthOptionGroupProps = $props();
</script>

<mth-option-group {...rest}>
  {@render children?.()}
</mth-option-group>
