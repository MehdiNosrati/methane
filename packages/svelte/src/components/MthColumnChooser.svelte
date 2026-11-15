<script lang="ts">
  import type { MthColumnChooserProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthColumnChooserProps = $props();
</script>

<mth-column-chooser {...rest}>
  {@render children?.()}
</mth-column-chooser>
