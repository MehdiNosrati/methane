<script lang="ts">
  import type { MthButtonGroupProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthButtonGroupProps = $props();
</script>

<mth-button-group {...rest}>
  {@render children?.()}
</mth-button-group>
