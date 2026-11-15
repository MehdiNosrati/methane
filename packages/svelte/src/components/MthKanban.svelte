<script lang="ts">
  import type { MthKanbanProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthKanbanProps = $props();
</script>

<mth-kanban {...rest}>
  {@render children?.()}
</mth-kanban>
