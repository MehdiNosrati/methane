<script lang="ts">
  import type { MthFieldsetProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthFieldsetProps = $props();
</script>

<mth-fieldset {...rest}>
  {@render children?.()}
</mth-fieldset>
