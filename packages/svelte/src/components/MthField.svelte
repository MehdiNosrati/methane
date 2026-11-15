<script lang="ts">
  import type { MthFieldProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthFieldProps = $props();
</script>

<mth-field {...rest}>
  {@render children?.()}
</mth-field>
