<script lang="ts">
  import type { MthSpreadsheetProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSpreadsheetProps = $props();
</script>

<mth-spreadsheet {...rest}>
  {@render children?.()}
</mth-spreadsheet>
