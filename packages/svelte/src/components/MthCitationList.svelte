<script lang="ts">
  import type { MthCitationListProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCitationListProps = $props();
</script>

<mth-citation-list {...rest}>
  {@render children?.()}
</mth-citation-list>
