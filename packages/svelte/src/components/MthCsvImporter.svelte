<script lang="ts">
  import type { MthCsvImporterProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCsvImporterProps = $props();
</script>

<mth-csv-importer {...rest}>
  {@render children?.()}
</mth-csv-importer>
