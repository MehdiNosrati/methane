<script lang="ts">
  import type { MthFormProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthFormProps = $props();
</script>

<mth-form {...rest}>
  {@render children?.()}
</mth-form>
