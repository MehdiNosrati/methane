<script lang="ts">
  import type { MthConditionalFieldProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthConditionalFieldProps = $props();
</script>

<mth-conditional-field {...rest}>
  {@render children?.()}
</mth-conditional-field>
